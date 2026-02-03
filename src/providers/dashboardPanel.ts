import * as vscode from 'vscode';
import { TODOWorkflowManager } from './todoWorkflow';

/**
 * Unified DevPilot Dashboard Panel
 * Provides a single hub for all DevPilot features and information
 * Displays TODO stats, learning streaks, suggestions, and quick actions
 */

interface DashboardState {
  todoCount: number;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
  totalPoints: number;
  activeSuggestions: number;
  activeFile?: string;
}

export class DashboardPanelProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'devpilot.dashboard';

  private _view?: vscode.WebviewView;
  private _context: vscode.ExtensionContext;
  private _todoManager: TODOWorkflowManager;
  private _updateInterval: NodeJS.Timeout | undefined;

  constructor(context: vscode.ExtensionContext) {
    this._context = context;
    this._todoManager = new TODOWorkflowManager(context);
    this.startAutoRefresh();
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._context.extensionUri],
    };

    webviewView.webview.html = this.getHtmlContent();

    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.command) {
        case 'createTodo':
          await vscode.commands.executeCommand('devpilot.createTodo');
          break;
        case 'viewTodoStats':
          await vscode.commands.executeCommand('devpilot.showTodoStats');
          break;
        case 'takeQuiz':
          await vscode.commands.executeCommand('devpilot.openQuiz');
          break;
        case 'checkStreak':
          await vscode.commands.executeCommand('devpilot.checkLearningStreak');
          break;
        case 'openHelp':
          await vscode.commands.executeCommand('devpilot.openHelp');
          break;
        case 'refreshDashboard':
          this.updateDashboard();
          break;
      }
    });

    this.updateDashboard();
  }

  private startAutoRefresh() {
    this._updateInterval = setInterval(() => {
      if (this._view) {
        this.updateDashboard();
      }
    }, 5000); // Refresh every 5 seconds
  }

  private async updateDashboard() {
    if (!this._view) {
      return;
    }

    const state = await this.getDashboardState();
    this._view.webview.postMessage({
      command: 'updateDashboard',
      data: state,
    });
  }

  private async getDashboardState(): Promise<DashboardState> {
    const todos = this._todoManager.getTodos();
    const stats = this._todoManager.getStats();
    const globalState = this._context.globalState;
    
    const currentStreak = (await globalState.get<number>('devpilot.streak.current')) || 0;
    const longestStreak = (await globalState.get<number>('devpilot.streak.longest')) || 0;
    const totalPoints = (await globalState.get<number>('devpilot.streak.points')) || 0;

    const activeEditor = vscode.window.activeTextEditor;
    const activeSuggestions = activeEditor ? this.countSuggestionsForFile(activeEditor.document.fileName) : 0;

    return {
      todoCount: todos.length,
      completionRate: stats.completionRate,
      currentStreak,
      longestStreak,
      totalPoints,
      activeSuggestions,
      activeFile: activeEditor?.document.fileName.split('/').pop(),
    };
  }

  private countSuggestionsForFile(filePath: string): number {
    // Placeholder for suggestion counting
    // Will be populated when suggestion filter is implemented
    return Math.floor(Math.random() * 5); // Temporary for demo
  }

  private getHtmlContent(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DevPilot Dashboard</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: var(--vscode-foreground);
      background-color: var(--vscode-sideBar-background);
      padding: 16px;
    }

    .dashboard {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .header-icon {
      font-size: 20px;
    }

    .header-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--vscode-foreground);
    }

    .panel {
      background-color: var(--vscode-sideBar-foreground, rgba(255,255,255,0.05));
      border: 1px solid var(--vscode-sideBarSectionHeader-border, rgba(255,255,255,0.1));
      border-radius: 6px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 500;
      font-size: 12px;
      color: var(--vscode-sideBarTitle-foreground);
    }

    .stat-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 0;
      font-size: 12px;
    }

    .stat-label {
      color: var(--vscode-descriptionForeground);
    }

    .stat-value {
      font-weight: 600;
      color: var(--vscode-foreground);
    }

    .progress-bar {
      height: 4px;
      background-color: rgba(255,255,255,0.1);
      border-radius: 2px;
      overflow: hidden;
      margin-top: 4px;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #00a3ff, #0088cc);
      border-radius: 2px;
    }

    .streak-display {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      background-color: rgba(255,193,7,0.1);
      border-radius: 4px;
      border-left: 3px solid #ffc107;
    }

    .streak-icon {
      font-size: 18px;
    }

    .streak-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .streak-number {
      font-weight: 700;
      font-size: 14px;
    }

    .streak-label {
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
    }

    .quick-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
    }

    .action-button {
      padding: 8px 12px;
      background-color: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 11px;
      font-weight: 500;
      transition: background-color 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
    }

    .action-button:hover {
      background-color: var(--vscode-button-hoverBackground);
    }

    .action-button:active {
      transform: scale(0.98);
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px 12px;
      color: var(--vscode-descriptionForeground);
      text-align: center;
      gap: 8px;
    }

    .empty-icon {
      font-size: 32px;
      opacity: 0.5;
    }

    .empty-text {
      font-size: 12px;
    }

    .suggestions-item {
      padding: 6px 0;
      font-size: 11px;
      display: flex;
      gap: 6px;
      align-items: flex-start;
    }

    .suggestions-icon {
      flex-shrink: 0;
      font-size: 12px;
    }

    .suggestions-text {
      flex: 1;
      color: var(--vscode-descriptionForeground);
      line-height: 1.4;
    }

    .badge {
      display: inline-block;
      padding: 2px 6px;
      background-color: rgba(0,163,255,0.2);
      color: #00a3ff;
      border-radius: 3px;
      font-size: 10px;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="dashboard">
    <!-- Header -->
    <div class="header">
      <div class="header-icon">🚀</div>
      <div class="header-title">DevPilot Dashboard</div>
    </div>

    <!-- Todo Stats Panel -->
    <div class="panel">
      <div class="panel-header">
        <span>📋 Tasks</span>
        <span id="todoCount" class="badge">0</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Active TODOs</span>
        <span class="stat-value" id="activeTodos">0</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Completion Rate</span>
        <span class="stat-value" id="completionRate">0%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" id="completionProgress" style="width: 0%"></div>
      </div>
    </div>

    <!-- Learning Streak Panel -->
    <div class="panel">
      <div class="streak-display">
        <div class="streak-icon">🔥</div>
        <div class="streak-text">
          <div class="streak-number" id="streakNumber">0</div>
          <div class="streak-label">Current Streak</div>
        </div>
      </div>
      <div class="stat-row">
        <span class="stat-label">Longest Streak</span>
        <span class="stat-value" id="longestStreak">0</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Total Points</span>
        <span class="stat-value" id="totalPoints">0</span>
      </div>
    </div>

    <!-- Active File Suggestions -->
    <div class="panel">
      <div class="panel-header">
        <span>💡 Suggestions for <span id="activeFile">current file</span></span>
        <span id="suggestionCount" class="badge">0</span>
      </div>
      <div id="suggestionsContainer"></div>
    </div>

    <!-- Quick Actions -->
    <div class="panel">
      <div class="panel-header">⚡ Quick Actions</div>
      <div class="quick-actions">
        <button class="action-button" onclick="sendCommand('createTodo')">
          <span>+</span> New TODO
        </button>
        <button class="action-button" onclick="sendCommand('takeQuiz')">
          <span>🎯</span> Quiz
        </button>
        <button class="action-button" onclick="sendCommand('viewTodoStats')">
          <span>📊</span> Stats
        </button>
        <button class="action-button" onclick="sendCommand('checkStreak')">
          <span>🔥</span> Streak
        </button>
        <button class="action-button" onclick="sendCommand('openHelp')">
          <span>❓</span> Help
        </button>
        <button class="action-button" onclick="sendCommand('refreshDashboard')">
          <span>⟳</span> Refresh
        </button>
      </div>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();

    function sendCommand(command) {
      vscode.postMessage({ command });
    }

    window.addEventListener('message', (event) => {
      const message = event.data;
      if (message.command === 'updateDashboard') {
        updateUI(message.data);
      }
    });

    function updateUI(state) {
      // Update TODO stats
      document.getElementById('todoCount').textContent = state.todoCount;
      document.getElementById('activeTodos').textContent = state.todoCount;
      document.getElementById('completionRate').textContent = Math.round(state.completionRate) + '%';
      document.getElementById('completionProgress').style.width = state.completionRate + '%';

      // Update streak
      document.getElementById('streakNumber').textContent = state.currentStreak;
      document.getElementById('longestStreak').textContent = state.longestStreak;
      document.getElementById('totalPoints').textContent = state.totalPoints;

      // Update file info
      if (state.activeFile) {
        document.getElementById('activeFile').textContent = state.activeFile;
        document.getElementById('suggestionCount').textContent = state.activeSuggestions;
      }

      // Update suggestions
      updateSuggestions(state.activeSuggestions);
    }

    function updateSuggestions(count) {
      const container = document.getElementById('suggestionsContainer');
      if (count === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-text">No suggestions for this file</div></div>';
      } else {
        container.innerHTML = \`<div class="suggestions-item">
          <span class="suggestions-icon">✓</span>
          <span class="suggestions-text">\${count} suggestion\${count > 1 ? 's' : ''} found</span>
        </div>\`;
      }
    }
  </script>
</body>
</html>
    `;
  }

  public dispose() {
    if (this._updateInterval) {
      clearInterval(this._updateInterval);
    }
  }
}

export function registerDashboardPanel(context: vscode.ExtensionContext) {
  const provider = new DashboardPanelProvider(context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(DashboardPanelProvider.viewType, provider)
  );
}
