import * as vscode from "vscode";

export class SidebarViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "devpilot.dashboard";

  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveWebviewView(
    view: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    view.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, "out"),
        vscode.Uri.joinPath(this.context.extensionUri, "out", "components")
      ],
    };

    view.webview.html = `
      <html>
        <body style="padding:0;margin:0;">
          <script>
            const vscode = acquireVsCodeApi();
          </script>
          <iframe 
            src="vscode-resource:/out/components/figma-ui/dashboard/FigmaDashboard.html" 
            style="width:100%;height:100%;border:0;"
          ></iframe>
        </body>
      </html>
    `;
  }
}
