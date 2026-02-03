// src/SidebarViewProvider.ts
// DevPilot Sidebar (LEFT PANEL) — navigation only, feature orchestration via extension

import * as vscode from "vscode";
import { attachSidebar } from "./core/extension"; // MUST match extension.ts

export class SidebarViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "devpilot.sidebar";

  private _view: vscode.WebviewView | null = null;

  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveWebviewView(view: vscode.WebviewView) {
    this._view = view;

    // Attach sidebar to extension broadcaster
    attachSidebar(view);

    view.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, "out"),
        vscode.Uri.joinPath(this.context.extensionUri, "out", "components"),
      ],
    };

    view.webview.html = this.getHtml(view.webview);

    // Sidebar does NOT own state
    // It routes intent → extension
    view.webview.onDidReceiveMessage((msg) => {
      if (!msg?.type) {
        return;
      }

      // 🚫 DO NOT forward state sync messages
      if (msg.type === "switchFeature" || msg.type === "theme") {
        return;
      }

      // 🔒 Everything else goes through internal message bus
      vscode.commands.executeCommand(
        "devpilot.__internalMessage",
        msg,
        view
      );
    });
  }

  public postMessage(message: unknown) {
  this._view?.webview.postMessage(message);
}

  private getHtml(webview: vscode.Webview): string {
    const nonce = getNonce();

    const globalsCss = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.context.extensionUri,
        "out",
        "components",
        "figma-ui",
        "styles",
        "globals.css"
      )
    );

    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.context.extensionUri,
        "out",
        "components",
        "figma-ui",
        "dashboard",
        "FigmaDashboard.js"
      )
    );

    return /* html */ `<!DOCTYPE html>
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

  <link rel="stylesheet" href="${globalsCss}" />
  <title>DevPilot — Sidebar</title>
</head>
<body class="devpilot-root" data-brand="DevPilot">
  <div id="root"></div>

  <script nonce="${nonce}">
    // Acquire VS Code API ONCE and store globally
    if (!window.__vscodeApi) {
      window.__vscodeApi = acquireVsCodeApi();
    }
    window.vscode = window.__vscodeApi;
    const vscode = window.vscode;
    vscode.postMessage({ type: 'ready' });
    
    // Debug listeners use the same vscode instance
    window.addEventListener('error', (ev) => {
      try { vscode.postMessage({ type: 'webviewDebug', payload: { kind: 'error', message: ev.message, filename: ev.filename, lineno: ev.lineno } }); } catch (e) {}
    });

    window.addEventListener('unhandledrejection', (ev) => {
      try { vscode.postMessage({ type: 'webviewDebug', payload: { kind: 'unhandledRejection', reason: String(ev.reason) } }); } catch (e) {}
    });

    (async () => {
      try {
        const r = await fetch("${scriptUri}", { method: 'GET' });
        vscode.postMessage({ type: 'webviewDebug', payload: { kind: 'fetch', ok: r.ok, status: r.status, url: r.url } });
      } catch (e) {
        try { vscode.postMessage({ type: 'webviewDebug', payload: { kind: 'fetchError', error: String(e) } }); } catch (e) {}
      }
    })();
  </script>

  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function getNonce(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: 32 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join("");
}
