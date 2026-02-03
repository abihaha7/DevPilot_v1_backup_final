/**
 * DevPilot Minimal Sidebar (Intent Router)
 * 
 * Replaces complex FigmaDashboard with simple icon/menu UI
 * Strictly navigation-only, no state management
 * Routes all actions via commands
 */

import * as vscode from "vscode";
import { getLogger } from "../core/logger";

const logger = getLogger("MinimalSidebar");

export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  command: string;
  tooltip: string;
  badge?: string;
}

/**
 * Minimal Sidebar View Provider
 * 
 * Shows simple icon menu of features
 * No React, no heavy UI, pure HTML
 */
export class MinimalSidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "devpilot.sidebar";

  private _view: vscode.WebviewView | null = null;

  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveWebviewView(view: vscode.WebviewView): void {
    this._view = view;

    view.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, "media"),
      ],
    };

    view.webview.html = this.getMinimalHtml(view.webview);

    // Handle messages from webview
    view.webview.onDidReceiveMessage((msg) => {
      if (!msg?.type) {
        return;
      }

      // Route all navigation intents to commands
      if (msg.type === "navigate") {
        const command = msg.payload?.command;
        if (command) {
          vscode.commands.executeCommand(command);
          logger.info("Navigation executed", { command });
        }
      }

      // Handle feature selection
      if (msg.type === "selectFeature") {
        const feature = msg.payload?.feature;
        if (feature) {
          vscode.commands.executeCommand("devpilot.switchFeature", {
            feature,
          });
        }
      }
    });

    // Send initial state
    setTimeout(() => {
      view.webview.postMessage({
        type: "ready",
        payload: { features: this.getNavigationItems() },
      });
    }, 500);
  }

  /**
   * Get navigation items
   */
  private getNavigationItems(): NavigationItem[] {
    return [
      {
        id: "learning",
        label: "Learning",
        icon: "📚",
        command: "devpilot.openLearningPanel",
        tooltip: "Learning resources and tutorials",
      },
      {
        id: "practice",
        label: "Practice",
        icon: "🎯",
        command: "devpilot.openPracticeProblems",
        tooltip: "Solve coding challenges",
      },
      {
        id: "commits",
        label: "Commits",
        icon: "📝",
        command: "devpilot.generateCommitMessage",
        tooltip: "Generate commit messages",
      },
      {
        id: "todos",
        label: "Todos",
        icon: "✓",
        command: "devpilot.showTodos",
        tooltip: "View and manage TODOs",
      },
      {
        id: "achievements",
        label: "Badges",
        icon: "🏆",
        command: "devpilot.showAchievements",
        tooltip: "View your achievements",
      },
      {
        id: "settings",
        label: "Settings",
        icon: "⚙️",
        command: "devpilot.openSettings",
        tooltip: "Configure DevPilot",
      },
    ];
  }

  /**
   * Generate minimal HTML (no framework, ultra-light)
   */
  private getMinimalHtml(webview: vscode.Webview): string {
    const nonce = this.getNonce();
    const items = this.getNavigationItems();

    const itemsHtml = items
      .map(
        (item) => `
      <button class="nav-item" 
              data-command="${item.command}" 
              title="${item.tooltip}">
        <span class="icon">${item.icon}</span>
        <span class="label">${item.label}</span>
        ${item.badge ? `<span class="badge">${item.badge}</span>` : ""}
      </button>
    `
      )
      .join("");

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';" />
  <title>DevPilot Navigation</title>
  <style nonce="${nonce}">
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: var(--vscode-sideBar-background);
      color: var(--vscode-foreground);
      padding: 8px;
    }

    .nav-container {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
      border: 1px solid var(--vscode-button-border);
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.2s ease;
      text-align: left;
      position: relative;
      overflow: hidden;
    }

    .nav-item:hover {
      background: var(--vscode-button-hoverBackground);
    }

    .nav-item:active {
      transform: scale(0.98);
    }

    .nav-item .icon {
      font-size: 18px;
      min-width: 24px;
      text-align: center;
    }

    .nav-item .label {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .nav-item .badge {
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
      padding: 2px 6px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
    }

    .section-title {
      font-size: 11px;
      font-weight: 700;
      color: var(--vscode-sideBar-foreground);
      opacity: 0.7;
      text-transform: uppercase;
      margin-top: 12px;
      margin-bottom: 4px;
      padding-left: 12px;
      letter-spacing: 0.5px;
    }

    .info-panel {
      background: var(--vscode-editor-background);
      border: 1px solid var(--vscode-editor-lineHighlightBorder);
      border-radius: 4px;
      padding: 8px;
      margin-top: 12px;
      font-size: 12px;
      line-height: 1.5;
      opacity: 0.8;
    }

    .info-panel strong {
      color: var(--vscode-sideBar-foreground);
    }

    /* Dark theme adjustments */
    @media (prefers-color-scheme: dark) {
      .nav-item {
        border-color: rgba(255, 255, 255, 0.1);
      }
    }

    /* Light theme adjustments */
    @media (prefers-color-scheme: light) {
      .nav-item {
        border-color: rgba(0, 0, 0, 0.1);
      }
    }
  </style>
</head>
<body>
  <div class="nav-container">
    <div class="section-title">Navigation</div>
    ${itemsHtml}

    <div class="info-panel">
      <strong>💡 Tip:</strong> Click any button above to navigate to features.
      DevPilot is editor-first — all features integrate directly into the editor.
    </div>
  </div>

  <script nonce="${nonce}">
    // Acquire VS Code API
    const vscode = acquireVsCodeApi();

    // Handle navigation button clicks
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const command = btn.getAttribute('data-command');
        if (command) {
          vscode.postMessage({
            type: 'navigate',
            payload: { command }
          });
        }
      });
    });

    // Tell extension sidebar is ready
    vscode.postMessage({ type: 'ready' });
  </script>
</body>
</html>`;
  }

  public postMessage(message: unknown): void {
    this._view?.webview.postMessage(message);
  }

  private getNonce(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    return Array.from({ length: 32 }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join("");
  }
}
