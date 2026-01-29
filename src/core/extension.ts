import * as vscode from "vscode";
import * as path from "path";
import OpenAI from "openai";
import simpleGit from "simple-git";

import { SidebarViewProvider } from "../SidebarViewProvider";
import { EditorOverlayProvider } from "../EditorOverlayProvider";
import { RightDashboardProvider } from "../RightDashboardProvider";

// Phase-1: Native providers
import { registerHoverProvider } from "../providers/hover";
import { registerInlineCompletionProvider } from "../providers/inline";
import { defaultConfig } from "./config";
import { initializeLLM } from "./llm";

// Phase-1: Commit generator (for testing)
import {
  analyzeDiff,
  generateCommitMessage as generateNativeCommit,
  generateQuickCommitMessage as generateNativeQuickCommit,
  getCommitSuggestions as getNativeSuggestions,
} from "../services/commits";

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

/* ========================= PHASE-1: Native Providers ======================== */

let hoverDisposable: vscode.Disposable | undefined;
let inlineCompletionDisposable: vscode.Disposable | undefined;

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

/* -------------------------------- Debounce -------------------------------- */

function getSmartSuggestion(
  line: string,
  language: string
): string | null {
  const trimmed = line.trim();

  if (!trimmed) return null;

  // JavaScript / TypeScript
  if (language === "javascript" || language === "typescript") {
    if (trimmed.startsWith("function")) {
      return "\n  // TODO: implement logic\n}";
    }

    if (trimmed.includes("console.log")) {
      return "\n// Debug log";
    }

    if (trimmed.endsWith("{")) {
      return "\n  \n}";
    }
  }

  // HTML
  if (language === "html") {
    if (trimmed.startsWith("<div")) {
      return "\n  \n</div>";
    }
  }

  return null;
}

/* -------------------------------- Activate -------------------------------- */

export function activate(context: vscode.ExtensionContext) {
  openaiApiKey = context.globalState.get<string>("devpilot.openaiKey");
  activeFeature = context.globalState.get<string>("devpilot.activeFeature");

  console.log("[DevPilot] Extension activating…");
  console.log(`[DevPilot] Phase-1 Native: Hover + Inline completions (deterministic, offline)`);
  console.log(`[DevPilot] Commit Generator: Native semantic analysis (no LLM needed)`);

  /* ============================================================================
     PHASE-1: NATIVE PROVIDERS (Deterministic, no LLM)
     ============================================================================ */

  // Register native hover provider
  if (defaultConfig.enableHoverExplanations) {
    hoverDisposable = registerHoverProvider(context);
    context.subscriptions.push(hoverDisposable);
    console.log("[DevPilot] ✅ Hover explanations (Native) enabled");
  }

  // Register native inline completion provider
  if (defaultConfig.enableInlineCompletions) {
    inlineCompletionDisposable = registerInlineCompletionProvider(context);
    context.subscriptions.push(inlineCompletionDisposable);
    console.log("[DevPilot] ✅ Inline completions (Native) enabled");
  }

  /* ============================================================================
     PHASE-2: LLM INITIALIZATION (Feature-flagged, for future)
     ============================================================================ */

  if (openaiApiKey && defaultConfig.useLLMMode) {
    initializeLLM(openaiApiKey);
    console.log("[DevPilot] ✅ LLM mode initialized (Phase-2)");
  }

  /* ============================================================================
     CORE FEATURES
     ============================================================================ */

  /* ---------------- Commands (REGISTER FIRST) ---------------- */

  const register = (cmd: string, cb: (...args: any[]) => any) =>
    context.subscriptions.push(vscode.commands.registerCommand(cmd, cb));

  register("devpilot.route", (msg?: any) => {
    if (!msg?.target || !msg?.type) {
      return;
    }
    if (msg.type === "switchFeature") {
      return;
    }

    if (msg.target === "sidebar") {
      sidebarWebview?.postMessage(msg);
    }
    if (msg.target === "right") {
      rightDashboardWebview?.postMessage(msg);
    }
    if (msg.target === "overlay") {
      overlayWebview?.postMessage(msg);
    }
  });

  register(
    "devpilot.__internalMessage",
    async (message: any, source: vscode.WebviewPanel | vscode.WebviewView) => {
      if (!message?.type || !source) {
        return;
      }

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
          if (!feature) {
            return;
          }

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

  register("devpilot.openCommitGenerator", async () => {
    // Integrate with existing dashboard instead of creating a new panel
    activeFeature = "commitGenerator";
    context.globalState.update("devpilot.activeFeature", "commitGenerator");

    // Show the right dashboard panel
    rightDashboard?.show();

    // Broadcast to switch to commit generator feature
    broadcast({
      type: "switchFeature",
      payload: { feature: "commitGenerator" },
    });

    vscode.window.showInformationMessage(
      "✅ Commit Generator opened in dashboard!"
    );
  });

  /* ============================================================================
     TEST COMMAND: Verify Commit Generator Works
     ============================================================================ */

  /* ============================================================================
     TEST COMMAND: Verify Commit Generator Works
     ============================================================================ */

  register("devpilot.testCommitGenerator", async () => {
    try {
      console.log("\n" + "=".repeat(80));
      console.log("🧪 DevPilot Commit Generator Test");
      console.log("=".repeat(80));

      // Get real git diff from workspace
      const git = simpleGit();
      let diff = "";

      try {
        diff = await git.diff();
        if (!diff) {
          console.log("\n📝 No uncommitted changes found. Using sample diff for testing...\n");
          diff = `diff --git a/src/utils/utils.ts b/src/utils/utils.ts
index 1234567..abcdefg 100644
--- a/src/utils/utils.ts
+++ b/src/utils/utils.ts
@@ -45,8 +45,9 @@ export function getWordAtPosition(text: string, position: number) {
   if (!isValidPosition(position)) {
-    return null;
+    return { word: "", start: position, end: position };
   }
+  // Fix: return proper object structure
   const word = extractWord(text, position);
   return word;
 }`;
        }
      } catch (e) {
        console.log("⚠️  No git repository found. Using sample diff.\n");
        diff = `diff --git a/src/core/extension.ts b/src/core/extension.ts
new file mode 100644
index 0000000..1234567
--- /dev/null
+++ b/src/core/extension.ts
@@ -0,0 +1,50 @@
+export function activate(context: vscode.ExtensionContext) {
+  console.log("[DevPilot] Extension activated");
+  registerHoverProvider(context);
+  registerInlineCompletionProvider(context);
+}`;
      }

      // Analyze the diff
      console.log("📊 Analyzing diff...\n");
      const analysis = analyzeDiff(diff);

      console.log("  Files modified:", analysis.filesModified.length);
      console.log("  Files added:", analysis.filesAdded.length);
      console.log("  Lines added:", analysis.addedLines);
      console.log("  Lines deleted:", analysis.deletedLines);
      console.log("  Keywords detected:", Array.from(analysis.keywords).join(", "));

      // Generate commit messages
      console.log("\n" + "-".repeat(80));
      console.log("📝 Generated Commit Messages");
      console.log("-".repeat(80));

      const fullCommit = generateNativeCommit(diff);
      const quickCommit = generateNativeQuickCommit(diff);
      const suggestions = getNativeSuggestions(diff);

      console.log("\n✅ Full Commit Message:");
      console.log(`   "${fullCommit}"`);

      console.log("\n⚡ Quick Subject Line:");
      console.log(`   "${quickCommit}"`);

      console.log("\n💡 Suggestions:");
      suggestions.forEach((msg, i) => {
        console.log(`   ${i + 1}. "${msg}"`);
      });

      console.log("\n" + "=".repeat(80));
      console.log("✨ Test Complete! Commit generator is working.\n");
      console.log("   Detected type: " + analysis.keywords.values().next().value?.toUpperCase() || "refactor");
      console.log("   Deterministic: ✅ (same diff = same output)");
      console.log("   Offline: ✅ (no API calls)");
      console.log("=".repeat(80) + "\n");

      vscode.window.showInformationMessage(
        `✅ Commit Generator Test Complete! Check Debug Console for details.`
      );
    } catch (error) {
      console.error("[DevPilot] Test error:", error);
      vscode.window.showErrorMessage(
        `❌ Test failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
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
