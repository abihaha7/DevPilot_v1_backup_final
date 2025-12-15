import * as vscode from "vscode";

export class RightDashboardProvider {
  private panel: vscode.WebviewPanel | null = null;

  constructor(private readonly context: vscode.ExtensionContext) {}

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

    this.panel.webview.onDidReceiveMessage((msg) => {
      vscode.commands.executeCommand(
      "devpilot.__internalMessage",
        msg,
      this.panel
    );
  });

  //ATTACH IMMEDIATELY WHEN PANEL EXISTS

    this.panel.onDidDispose(() => {
      this.panel = null;
    });

    this.panel.webview.html = this.getHtml(this.panel.webview);
  }

  public postMessage(message: unknown) {
    this.panel?.webview.postMessage(message);
  }

  public get webview(): vscode.Webview | null {
    return this.panel?.webview ?? null;
  }

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

    // ✅ SINGLE CSP SOURCE OF TRUTH (NONCE-BASED, PRODUCTION SAFE)
    const csp = [
      "default-src 'none'",
      `img-src ${webview.cspSource} https: data:`,
      `font-src ${webview.cspSource}`,
      `style-src ${webview.cspSource} 'unsafe-inline'`,
      `script-src 'nonce-${nonce}'`,
      `connect-src ${webview.cspSource}`,
    ].join("; ");

    return /* html */ `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="Content-Security-Policy" content="${csp}" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <link href="${baseCss}" rel="stylesheet" />
    <link href="${globalsCss}" rel="stylesheet" />

    <title>DevPilot</title>

    <!-- ✅ ALL INLINE CSS IS NOW LEGALLY NONCED -->
    <style nonce="${nonce}">
      html, body {
        padding: 0;
        margin: 0;
        height: 100%;
        background: var(--vscode-editor-background);
        color: var(--vscode-editor-foreground);
      }

      #root {
        height: 100%;
        width: 100%;
        animation: devpilot-slide-in 160ms cubic-bezier(0.2, 0, 0, 1);
      }

      @keyframes devpilot-slide-in {
        from {
          opacity: 0;
          transform: translateX(8px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
    </style>
  </head>

  <body>
    <div id="root"></div>

    <!-- VS Code API bootstrap + ready handshake -->
    <script nonce="${nonce}">
      const vscode = acquireVsCodeApi();
      vscode.postMessage({ type: "ready", source: "rightDashboard" });
    </script>

    <script nonce="${nonce}" src="${scriptUri}"></script>
  </body>
</html>`;
  }
}

// ─────────────────────────────────────────────────────────────────────────────

function getNonce(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let nonce = "";
  for (let i = 0; i < 32; i++) {
    nonce += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return nonce;
}
