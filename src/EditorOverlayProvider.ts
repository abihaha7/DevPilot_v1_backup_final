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

      // 🚫 DO NOT forward state sync messages
      if (msg.type === "switchFeature" || msg.type === "theme") {
        return;
      }

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

  <!-- Webview loads ESM bundle via module script -->

  <script nonce="${nonce}">globalThis.exports = globalThis.exports || {}; globalThis.module = globalThis.module || { exports: globalThis.exports };</script>
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

<body class="devpilot-root" data-brand="DevPilot">
  <div id="root"></div>

  <script nonce="${nonce}">
    (function () {
      if (!window.__vscodeApi) {
        window.__vscodeApi = acquireVsCodeApi();
      }
      window.vscode = window.__vscodeApi;
      const vscode = window.vscode;

      vscode.postMessage({
        type: "ready"
      });

      window.addEventListener('error', (ev) => {
        try { vscode.postMessage({ type: 'webviewDebug', payload: { kind: 'error', message: ev.message, filename: ev.filename, lineno: ev.lineno } }); } catch (e) {}
      });

      window.addEventListener('unhandledrejection', (ev) => {
        try { vscode.postMessage({ type: 'webviewDebug', payload: { kind: 'unhandledRejection', reason: String(ev.reason) } }); } catch (e) {}
      });

      (async () => {
        try {
          const r = await fetch("${jsUri}", { method: 'GET' });
          vscode.postMessage({ type: 'webviewDebug', payload: { kind: 'fetch', ok: r.ok, status: r.status, url: r.url } });
        } catch (e) {
          try { vscode.postMessage({ type: 'webviewDebug', payload: { kind: 'fetchError', error: String(e) } }); } catch (e) {}
        }
      })();
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
