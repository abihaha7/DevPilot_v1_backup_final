import * as vscode from 'vscode';
import { TODOWorkflowManager } from './todoWorkflow';

/**
 * Hover Provider for TODO Actions
 * Provides interactive hover actions for TODOs in the editor
 * Shows mark done, edit, delete, and explain actions
 */

export class TodoHoverProvider implements vscode.HoverProvider {
  private _todoManager: TODOWorkflowManager;

  constructor(context: vscode.ExtensionContext) {
    this._todoManager = new TODOWorkflowManager(context);
  }

  async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken
  ): Promise<vscode.Hover | undefined> {
    // Find TODO at this line
    const filePath = document.fileName;
    const todos = this._todoManager.getTodos().filter((t) => t.file === filePath && t.line === position.line);

    if (todos.length === 0) {
      return undefined;
    }

    const todo = todos[0];
    const markdown = new vscode.MarkdownString();

    markdown.appendMarkdown(`### 📌 TODO: ${todo.text}\n\n`);
    markdown.appendMarkdown(`**Priority**: ${this.getPriorityDisplay(todo.priority)}\n\n`);
    markdown.appendMarkdown(`**Status**: ${this.getStatusDisplay(todo.status || 'pending')}\n\n`);

    // Add action links
    markdown.appendMarkdown('---\n\n');
    markdown.appendMarkdown('**Quick Actions**:\n\n');

    if (todo.status !== 'completed') {
      markdown.appendMarkdown(`[✓ Mark Done](command:devpilot.markTodoComplete?${encodeURIComponent(JSON.stringify([todo.id]))})\n\n`);
    }

    markdown.appendMarkdown(`[✏️ Edit](command:devpilot.editTodo?${encodeURIComponent(JSON.stringify([todo.id]))})\n\n`);
    markdown.appendMarkdown(`[🗑️ Delete](command:devpilot.deleteTodo?${encodeURIComponent(JSON.stringify([todo.id]))})\n\n`);

    markdown.isTrusted = true;
    markdown.supportHtml = true;

    return new vscode.Hover(markdown);
  }

  private getPriorityDisplay(priority: string): string {
    switch (priority) {
      case 'high':
        return '🔴 High';
      case 'medium':
        return '🟡 Medium';
      case 'low':
        return '🟢 Low';
      default:
        return '⚪ Unknown';
    }
  }

  private getStatusDisplay(status: string): string {
    switch (status) {
      case 'pending':
        return '⭕ Pending';
      case 'in-progress':
        return '🔄 In Progress';
      case 'completed':
        return '✅ Completed';
      case 'blocked':
        return '🚫 Blocked';
      default:
        return '❓ Unknown';
    }
  }
}

export class SuggestionHoverProvider implements vscode.HoverProvider {
  async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken
  ): Promise<vscode.Hover | undefined> {
    // This would be expanded to show suggestions for the line
    const line = document.lineAt(position.line);
    const text = line.text;

    // Simple heuristic-based hover suggestions
    if (text.includes('console.log')) {
      const markdown = new vscode.MarkdownString();
      markdown.appendMarkdown('### 💡 Suggestion: Replace with logging\n\n');
      markdown.appendMarkdown('`console.log` is better replaced with a proper logging framework.\n\n');
      markdown.appendMarkdown('**Why**: Better control, filtering, and debugging\n\n');
      markdown.appendMarkdown('[Apply Quick Fix](command:devpilot.suggestFix?%5B%22useLogger%22%5D)');
      markdown.isTrusted = true;
      return new vscode.Hover(markdown);
    }

    if (text.includes('var ')) {
      const markdown = new vscode.MarkdownString();
      markdown.appendMarkdown('### 💡 Suggestion: Use const or let\n\n');
      markdown.appendMarkdown('`var` is function-scoped, consider using `const` or `let` for block scope.\n\n');
      markdown.appendMarkdown('[Apply Quick Fix](command:devpilot.suggestFix?%5B%22useConstLet%22%5D)');
      markdown.isTrusted = true;
      return new vscode.Hover(markdown);
    }

    return undefined;
  }
}

export function registerHoverProviders(context: vscode.ExtensionContext) {
  const todoHover = new TodoHoverProvider(context);
  const suggestionHover = new SuggestionHoverProvider();

  context.subscriptions.push(
    vscode.languages.registerHoverProvider(['javascript', 'typescript'], todoHover),
    vscode.languages.registerHoverProvider(['python'], todoHover),
    vscode.languages.registerHoverProvider(['go'], todoHover),
    vscode.languages.registerHoverProvider(
      ['javascript', 'typescript', 'python'],
      suggestionHover
    )
  );

  // Register quick action commands
  context.subscriptions.push(
    vscode.commands.registerCommand('devpilot.markTodoComplete', async (todoId: string) => {
      const manager = new TODOWorkflowManager(context);
      await manager.changeStatus(todoId, 'completed');
      vscode.window.showInformationMessage('✅ TODO marked as complete!');
    }),

    vscode.commands.registerCommand('devpilot.editTodo', async (todoId: string) => {
      const newText = await vscode.window.showInputBox({
        prompt: 'Edit TODO',
        placeHolder: 'Enter new TODO text',
      });
      if (newText) {
        const manager = new TODOWorkflowManager(context);
        const todos = manager.getTodos();
        const todo = todos.find((t) => t.id === todoId);
        if (todo) {
          await manager.updateTodo(todoId, { ...todo, text: newText });
          vscode.window.showInformationMessage('✏️ TODO updated!');
        }
      }
    }),

    vscode.commands.registerCommand('devpilot.deleteTodo', async (todoId: string) => {
      const confirm = await vscode.window.showQuickPick(['Yes', 'No'], {
        placeHolder: 'Delete this TODO?',
      });
      if (confirm === 'Yes') {
        const manager = new TODOWorkflowManager(context);
        await manager.deleteTodo(todoId);
        vscode.window.showInformationMessage('🗑️ TODO deleted!');
      }
    })
  );
}
