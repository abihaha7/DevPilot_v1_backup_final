// -------------------------------------------------------
// DevPilot — EXTENSION BACKEND
// -------------------------------------------------------

import * as vscode from "vscode";
import * as path from "path";
import OpenAI from "openai";

// ⭐ ADDED — Import your sidebar
import { SidebarViewProvider } from "./SidebarViewProvider";

let openaiApiKey: string | undefined;

/* -------------------------------------------------------
   ACTIVATE
-------------------------------------------------------- */
export function activate(context: vscode.ExtensionContext) {
  console.log("🔥 DevPilot Activated");

  // ⭐ ADDED — Register sidebar view provider
  const sidebarProvider = new SidebarViewProvider(context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      SidebarViewProvider.viewType,
      sidebarProvider
    )
  );

  // Load stored API key
  openaiApiKey = context.globalState.get("devpilot.openaiKey");

  /* ---------------------------
     COMMAND: Hello World
  ---------------------------- */
  context.subscriptions.push(
    vscode.commands.registerCommand("devpilot.helloWorld", () => {
      vscode.window.showInformationMessage("👋 Hello from DevPilot!");
    })
  );

  /* ---------------------------
     COMMAND: Save OpenAI Key
  ---------------------------- */
  context.subscriptions.push(
    vscode.commands.registerCommand("devpilot.setOpenAIKey", async () => {
      const apiKey = await vscode.window.showInputBox({
        placeHolder: "Enter your OpenAI API Key",
        password: true,
        ignoreFocusOut: true,
      });

      if (!apiKey) return;

      openaiApiKey = apiKey;
      await context.globalState.update("devpilot.openaiKey", apiKey);
      vscode.window.showInformationMessage("✅ OpenAI API Key saved!");
    })
  );

  /* ---------------------------
     COMMAND: Open Dashboard
  ---------------------------- */
  context.subscriptions.push(
    vscode.commands.registerCommand("devpilot.openDashboard", () => {
      const panel = vscode.window.createWebviewPanel(
        "devpilotDashboard",
        "DevPilot Dashboard",
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: [
            vscode.Uri.joinPath(context.extensionUri, "out"),
            vscode.Uri.joinPath(context.extensionUri, "out", "components"),
            vscode.Uri.joinPath(context.extensionUri, "out", "utils"),
          ],
        }
      );

      // Inject React UI
      panel.webview.html = getWebviewContent(panel.webview, context.extensionUri);

      // -------------------------------
      // 📩 MESSAGE HANDLER (STEP 3)
      // -------------------------------
      panel.webview.onDidReceiveMessage(
        async (msg) => {
          const { type, payload } = msg || {};
          console.log("📩 Message from dashboard:", msg);

          switch (type) {
            /* generateCommit */
            case "generateCommit": {
              const text = await generateCommitMessage();
              panel.webview.postMessage({
                type: "commitResult",
                payload: { text },
              });
              break;
            }

            /* scan TODOs */
            case "scanTODOs": {
              const todos = await scanTODOs();
              panel.webview.postMessage({
                type: "todosResult",
                payload: { todos },
              });
              break;
            }

            /* chatMessage */
            case "chatMessage": {
              const userText = payload?.text ?? "";
              const reply = await handleChat(userText);

              panel.webview.postMessage({
                type: "chatReply",
                payload: { text: reply },
              });
              break;
            }

            /* helloFromDashboard */
            case "helloFromDashboard": {
              vscode.window.showInformationMessage(
                "🌐 DevPilot dashboard connected."
              );
              break;
            }

            default:
              console.warn("⚠️ Unknown message type:", type);
          }
        },
        undefined,
        context.subscriptions
      );

      panel.onDidDispose(() => {
        console.log("🧹 DevPilot dashboard closed.");
      });
    })
  );
}

/* -------------------------------------------------------
   WEBVIEW HTML (STEP 4)
-------------------------------------------------------- */
function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri) {
  const indexCssUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "out", "components", "figma-ui", "index.css")
  );

  const globalsCssUri = webview.asWebviewUri(
    vscode.Uri.joinPath(
      extensionUri,
      "out",
      "components",
      "figma-ui",
      "styles",
      "globals.css"
    )
  );

  const jsUri = webview.asWebviewUri(
    vscode.Uri.joinPath(
      extensionUri,
      "out",
      "components",
      "figma-ui",
      "dashboard",
      "FigmaDashboard.js"
    )
  );

  const csp = `
<meta http-equiv="Content-Security-Policy"
  content="
    default-src 'none';
    img-src ${webview.cspSource} https: data:;
    script-src 'unsafe-eval' 'unsafe-inline' ${webview.cspSource};
    style-src 'unsafe-inline' ${webview.cspSource};
    font-src ${webview.cspSource} https: data:;
    connect-src ${webview.cspSource} https:;
  ">
`;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    ${csp}
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <link rel="stylesheet" href="${indexCssUri}">
    <link rel="stylesheet" href="${globalsCssUri}">
    <title>DevPilot Dashboard</title>
  </head>

  <body>
    <div id="root"></div>
    <script src="${jsUri}"></script>
  </body>
</html>`;
}

/* -------------------------------------------------------
   COMMIT GENERATION
-------------------------------------------------------- */
async function generateCommitMessage(): Promise<string> {
  try {
    if (!openaiApiKey) return "⚠️ Set OpenAI API key first.";

    const { simpleGit } = await import("simple-git");
    const git = simpleGit();
    const diff = await git.diff();

    const client = new OpenAI({ apiKey: openaiApiKey });

    const resp: any = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Write concise Git commit messages." },
        { role: "user", content: `Generate a commit message for this diff:\n${diff}` },
      ],
    });

    return resp.choices[0].message?.content?.trim() || "❌ No commit generated.";
  } catch (err: any) {
    return `❌ Error: ${err.message}`;
  }
}

/* -------------------------------------------------------
   TODO SCANNER
-------------------------------------------------------- */
async function scanTODOs() {
  const todos: { file: string; line: number; text: string }[] = [];

  if (!vscode.workspace.workspaceFolders?.length) {
    vscode.window.showWarningMessage("⚠️ No workspace folder open.");
    return todos;
  }

  const files = await vscode.workspace.findFiles(
    "**/*.{ts,js,tsx,jsx,py,java}",
    "**/node_modules/**"
  );

  for (const file of files) {
    const doc = await vscode.workspace.openTextDocument(file);
    const lines = doc.getText().split("\n");

    lines.forEach((line, idx) => {
      if (line.includes("TODO")) {
        todos.push({
          file: path.basename(file.fsPath),
          line: idx + 1,
          text: line.trim(),
        });
      }
    });
  }

  return todos;
}

/* -------------------------------------------------------
   CHATBOT
-------------------------------------------------------- */
async function handleChat(userMsg: string): Promise<string> {
  if (!openaiApiKey) return "⚠️ Set OpenAI API key first.";

  try {
    const client = new OpenAI({ apiKey: openaiApiKey });

    const resp: any = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are DevPilot, a coding assistant inside VS Code." },
        { role: "user", content: userMsg },
      ],
    });

    return resp.choices[0].message?.content?.trim() || "🤖 No response.";
  } catch (err: any) {
    return `❌ Chat error: ${err.message}`;
  }
}

/* -------------------------------------------------------
   DEACTIVATE
-------------------------------------------------------- */
export function deactivate() {
  console.log("🛑 DevPilot deactivated.");
}







