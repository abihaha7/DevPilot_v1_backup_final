import * as vscode from "vscode";
import { attachOverlay } from "./core/extension"; // ✅ MUST match extension.ts

export class EditorOverlayProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "devpilot.editorOverlay";

  private _view: vscode.WebviewView | null = null;

  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveWebviewView(view: vscode.WebviewView) {
    this._view = view;

    // ✅ Correct: attach overlay to extension
    attachOverlay(view);

    view.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, "out"),
      ],
    };

    view.webview.html = this.getHtmlForWebview(view.webview);

    /* ---------------- Message Listener ---------------- */

    view.webview.onDidReceiveMessage((msg) => {
      if (!msg?.type) {
        return;
      }

            // 🔁 Explicit relay to RIGHT dashboard when requested
      view.webview.onDidReceiveMessage((msg) => {
        if (!msg?.type) {return;}

        // 🚫 DO NOT forward state sync messages
        if (msg.type === "switchFeature" || msg.type === "theme") {
          return;
        }

        vscode.commands.executeCommand("devpilot.route", {
          target: "right",
          type: msg.type,
          payload: msg.payload,
        });
      });

      // 🔒 Default: forward EVERYTHING to extension core
      vscode.commands.executeCommand(
        "devpilot.__internalMessage",
        msg,
        view
      );
    });

    /* ---------------- Theme Sync ---------------- */

    vscode.window.onDidChangeActiveColorTheme((theme) => {
      try {
        view.webview.postMessage({
          type: "theme",
          payload: { kind: theme.kind },
        });
      } catch {}
    });
  }

public postMessage(message: unknown) {
  this._view?.webview.postMessage(message);
}

  /* ---------------- HTML / CSP ---------------- */

  private getHtmlForWebview(webview: vscode.Webview): string {
    const nonce = this.getNonce();

    const cssUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.context.extensionUri,
        "out",
        "components",
        "figma-ui",
        "index.css"
      )
    );

    const globalsCssUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.context.extensionUri,
        "out",
        "components",
        "figma-ui",
        "styles",
        "globals.css"
      )
    );

    const jsUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.context.extensionUri,
        "out",
        "components",
        "figma-ui",
        "dashboard",
        "EditorOverlay.js"
      )
    );

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy"
    content="
      default-src 'none';
      img-src ${webview.cspSource} https:;
      style-src ${webview.cspSource} 'unsafe-inline';
      script-src 'nonce-${nonce}';
      connect-src ${webview.cspSource};
    "
  />

  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <link rel="stylesheet" href="${cssUri}">
  <link rel="stylesheet" href="${globalsCssUri}">

  <style nonce="${nonce}">
    html, body, #root {
      height: 100%;
      margin: 0;
      padding: 0;
    }
  </style>

  <title>DevPilot — Editor Overlay</title>
</head>

<body class="devpilot-root">
  <div id="root"></div>

  <script nonce="${nonce}">
    (function () {
      if (!window.vscode) {
        window.vscode = acquireVsCodeApi();
      }

      window.acquireVsCodeApi = () => window.vscode;

      window.vscode.postMessage({
        type: "ready"
      });
    })();
  </script>

  <script nonce="${nonce}" src="${jsUri}"></script>
</body>
</html>`;
  }

  /* ---------------- NONCE ---------------- */

  private getNonce() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let text = "";
    for (let i = 0; i < 32; i++) {
      text += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return text;
  }
}
