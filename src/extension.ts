import * as vscode from "vscode";
import * as path from "path";
import OpenAI from "openai";
import simpleGit from "simple-git";

import { SidebarViewProvider } from "./SidebarViewProvider";
import { EditorOverlayProvider } from "./EditorOverlayProvider";
import { RightDashboardProvider } from "./RightDashboardProvider";

/* -------------------------------- Globals -------------------------------- */

let openaiApiKey: string | undefined;
let todosRunning = false;

// 🔒 Webview references
let sidebarWebview: vscode.Webview | null = null;
let overlayWebview: vscode.Webview | null = null;
let rightDashboardWebview: vscode.Webview | null = null;

// Providers
let sidebar: SidebarViewProvider;
let editorOverlay: EditorOverlayProvider;
let rightDashboard: RightDashboardProvider;

// Single source of truth
let activeFeature: string | undefined;

/* -------------------------- Webview Attachers ----------------------------- */

export function attachSidebar(view: vscode.WebviewView) {
  sidebarWebview = view.webview;
}

export function attachOverlay(view: vscode.WebviewView) {
  overlayWebview = view.webview;
}

export function attachRightDashboard(webview: vscode.Webview | null) {
  rightDashboardWebview = webview;
}

/* ------------------------------ Broadcasting ------------------------------ */

function broadcast(msg: any) {
  try {
    sidebarWebview?.postMessage(msg);
    overlayWebview?.postMessage(msg);
    rightDashboardWebview?.postMessage(msg);
  } catch {}
}

/* -------------------------------- Utilities -------------------------------- */

function debounce(fn: (...args: any[]) => void, delay = 400) {
  let timer: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/* -------------------------------- Activate -------------------------------- */

export function activate(context: vscode.ExtensionContext) {
  openaiApiKey = context.globalState.get<string>("devpilot.openaiKey");
  activeFeature = context.globalState.get<string>("devpilot.activeFeature");

  console.log("[DevPilot] Extension activating…");

  /* ---------------- Commands (REGISTER FIRST) ---------------- */

  const register = (cmd: string, cb: (...args: any[]) => any) =>
    context.subscriptions.push(vscode.commands.registerCommand(cmd, cb));

  register("devpilot.route", (msg?: any) => {
    if (!msg?.target || !msg?.type) {return;}
    if (msg.type === "switchFeature") {return;}

    if (msg.target === "sidebar") {sidebarWebview?.postMessage(msg);}
    if (msg.target === "right") {rightDashboardWebview?.postMessage(msg);}
    if (msg.target === "overlay") {overlayWebview?.postMessage(msg);}
  });

  register(
    "devpilot.__internalMessage",
    async (message: any, source: vscode.WebviewPanel | vscode.WebviewView) => {
      if (!message?.type || !source) {return;}

      switch (message.type) {
        case "ready": {
          if (activeFeature) {
            source.webview.postMessage({
              type: "switchFeature",
              payload: { feature: activeFeature },
            });
          }
          break;
        }

        case "switchFeature": {
          const feature = message.payload?.feature;
          if (!feature) {return;}

          activeFeature = feature;
          context.globalState.update("devpilot.activeFeature", feature);

          rightDashboard?.show();

          broadcast({
            type: "switchFeature",
            payload: { feature },
          });
          break;
        }
      }
    }
  );

  register("devpilot.chatMessage", async (payload?: { text?: string }) => {
    const text = payload?.text ?? "";
    const reply = await handleChat(text);

    rightDashboardWebview?.postMessage({
      type: "chatReply",
      payload: { text: reply },
    });
  });

  /* ---------------- Providers (AFTER commands) ---------------- */

  sidebar = new SidebarViewProvider(context);
  editorOverlay = new EditorOverlayProvider(context);
  rightDashboard = new RightDashboardProvider(context);

  /* ---------------- Webview Providers ---------------- */

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      SidebarViewProvider.viewType,
      sidebar
    ),
    vscode.window.registerWebviewViewProvider(
      EditorOverlayProvider.viewType,
      editorOverlay
    )
  );

  console.log("[DevPilot] Extension activated");

  /* ---------------- Editor Sync ---------------- */

  const syncEditorDebounced = debounce(() => {
    sendActiveEditor();
    setTimeout(sendTODOs, 0);
  }, 800);

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(sendActiveEditor),
    vscode.window.onDidChangeTextEditorSelection((e) =>
      sendCursorSelection(e.textEditor)
    ),
    vscode.workspace.onDidChangeTextDocument((e) => {
      sendFileDiff(e.document);
      syncEditorDebounced();
    })
  );

  /* ---------------- Theme Sync ---------------- */

  context.subscriptions.push(
    vscode.window.onDidChangeActiveColorTheme(sendTheme)
  );

  /* ---------------- Restore ---------------- */

  if (activeFeature) {
    rightDashboard.show();
    broadcast({
      type: "switchFeature",
      payload: { feature: activeFeature },
    });
  }

  sendActiveEditor();
  setTimeout(sendTODOs, 0);
}

/* ------------------------------ Editor Sync ------------------------------ */

function sendActiveEditor() {
  const e = vscode.window.activeTextEditor;

  broadcast({
    type: "activeEditor",
    payload: e
      ? {
          uri: e.document.uri.fsPath,
          text: e.document.getText(),
          languageId: e.document.languageId,
          fileName: path.basename(e.document.fileName),
        }
      : null,
  });
}

function sendCursorSelection(editor?: vscode.TextEditor) {
  if (!editor) {return;}

  broadcast({
    type: "cursorSelection",
    payload: {
      selections: editor.selections.map((s) => ({
        start: s.start,
        end: s.end,
        text: editor.document.getText(s),
      })),
    },
  });
}

function sendTheme() {
  const theme = vscode.window.activeColorTheme;

  broadcast({
    type: "theme",
    payload: { kind: theme.kind },
  });
}

/* ------------------------------ Git Diff ------------------------------ */

async function sendFileDiff(doc?: vscode.TextDocument) {
  if (!doc) {return;}

  try {
    const diff = await simpleGit().diff(["--", doc.uri.fsPath]);
    broadcast({ type: "fileDiff", payload: { diff } });
  } catch {}
}

/* ------------------------------ TODO ------------------------------ */

async function sendTODOs() {
  if (todosRunning) {return;}
  todosRunning = true;

  try {
    const files = await vscode.workspace.findFiles(
      "**/*.{ts,tsx,js,jsx}",
      "**/{node_modules,out,dist}/**",
      50
    );

    const todos: Array<{ file: string; line: number; text: string }> = [];

    for (const file of files) {
      const doc = await vscode.workspace.openTextDocument(file);
      doc.getText().split("\n").forEach((line, i) => {
        if (line.includes("TODO")) {
          todos.push({
            file: path.basename(file.fsPath),
            line: i + 1,
            text: line.trim(),
          });
        }
      });
    }

    broadcast({ type: "todosResult", payload: { todos } });
  } finally {
    todosRunning = false;
  }
}

/* ------------------------------ OpenAI ------------------------------ */

async function generateCommitMessage() {
  if (!openaiApiKey) {return "API key not set.";}

  const diff = await simpleGit().diff();
  const client = new OpenAI({ apiKey: openaiApiKey });

  const r = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: diff }],
  });

  return r.choices[0]?.message?.content ?? "";
}

async function handleChat(text: string) {
  if (!openaiApiKey) {return "API key not set.";}

  const client = new OpenAI({ apiKey: openaiApiKey });

  const r = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: text }],
  });

  return r.choices[0]?.message?.content ?? "";
}

export function deactivate() {}
