import * as vscode from "vscode";
import { attachRightDashboard } from "./extension";

export class RightDashboardProvider {
  private panel: vscode.WebviewPanel | null = null;

  constructor(private readonly context: vscode.ExtensionContext) {}

  /* ---------------- OPEN / REVEAL PANEL ---------------- */

  public show() {
    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.Beside);
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      "devpilot.rightDashboard",
      "DevPilot",
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(this.context.extensionUri, "out"),
        ],
      }
    );

    // 🔗 attach immediately (legacy-safe)
    attachRightDashboard(this.panel.webview);

    /* ---------------- MESSAGE BRIDGE (DIRECT) ---------------- */

    this.panel.webview.onDidReceiveMessage((msg) => {
      if (!msg?.type) {return;}

      switch (msg.type) {
        case "ready": {
          console.log("[DevPilot] RightDashboard READY");

          const feature =
            this.context.globalState.get<string>(
              "devpilot.activeFeature"
            ) ?? "chat";

          this.panel?.webview.postMessage({
            type: "switchFeature",
            payload: { feature },
          });
          break;
        }

        case "chatMessage": {
          vscode.commands.executeCommand(
            "devpilot.chatMessage",
            msg.payload
          );
          break;
        }

        case "setFeature": {
          const feature = msg.payload?.feature;
          if (!feature) {return;}

          this.context.globalState.update(
            "devpilot.activeFeature",
            feature
          );

          this.panel?.webview.postMessage({
            type: "switchFeature",
            payload: { feature },
          });
          break;
        }

        default:
          console.warn("[DevPilot] Unknown panel message:", msg);
      }
    });

    /* ---------------- CLEANUP ---------------- */

    this.panel.onDidDispose(() => {
      this.panel = null;
      attachRightDashboard(null as any);
    });

    /* ---------------- HTML ---------------- */

    this.panel.webview.html = this.getHtml(this.panel.webview);
  }

  /* ---------------- API ---------------- */

  public postMessage(message: unknown) {
    this.panel?.webview.postMessage(message);
  }

  public get webview(): vscode.Webview | null {
    return this.panel?.webview ?? null;
  }

  /* ---------------- HTML ---------------- */

  private getHtml(webview: vscode.Webview): string {
    const nonce = getNonce();

    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.context.extensionUri,
        "out/components/figma-ui/dashboard/RightDashboard.js"
      )
    );

    const baseCss = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.context.extensionUri,
        "out/components/figma-ui/index.css"
      )
    );

    const globalsCss = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.context.extensionUri,
        "out/components/figma-ui/styles/globals.css"
      )
    );

    const csp = [
      "default-src 'none'",
      `img-src ${webview.cspSource} https: data:`,
      `font-src ${webview.cspSource}`,
      `style-src ${webview.cspSource} 'unsafe-inline'`,
      `script-src 'nonce-${nonce}'`,
      `connect-src ${webview.cspSource}`,
    ].join("; ");

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <link href="${baseCss}" rel="stylesheet" />
  <link href="${globalsCss}" rel="stylesheet" />

  <title>DevPilot</title>

  <style nonce="${nonce}">
    html, body, #root {
      height: 100%;
      width: 100%;
      margin: 0;
      padding: 0;
      background: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
    }
  </style>
</head>

<body>
  <div id="root"></div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    vscode.postMessage({ type: "ready" });
  </script>

  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

/* ---------------- NONCE ---------------- */

function getNonce(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let nonce = "";
  for (let i = 0; i < 32; i++) {
    nonce += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return nonce;
}
