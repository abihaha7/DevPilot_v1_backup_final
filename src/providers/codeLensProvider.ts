import * as vscode from 'vscode';
import { TODOWorkflowManager } from './todoWorkflow';

/**
 * CodeLens Provider for DevPilot
 * Shows TODO counts, suggestion counts, and quick action lenses
 */

export class TodoCodeLensProvider implements vscode.CodeLensProvider {
  private _todoManager: TODOWorkflowManager;
  private _context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this._context = context;
    this._todoManager = new TODOWorkflowManager(context);
  }

  provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    const lenses: vscode.CodeLens[] = [];
    const filePath = document.fileName;
    const todos = this._todoManager.getTodos().filter((t) => t.file === filePath);

    if (todos.length === 0) {
      return lenses;
    }

    // Add file-level TODO summary at top
    const range = new vscode.Range(0, 0, 0, 0);

    const activeTodos = todos.filter((t) => t.status !== 'completed');
    const completedTodos = todos.filter((t) => t.status === 'completed');

    lenses.push(
      new vscode.CodeLens(range, {
        title: `📋 ${activeTodos.length} Active TODOs | ${completedTodos.length} Done`,
        command: 'devpilot.showFileTodoStats',
        arguments: [filePath],
      })
    );

    // Add CodeLens for each TODO at its line
    for (const todo of todos) {
      if (todo.line !== undefined && todo.line < document.lineCount) {
        const range = document.lineAt(todo.line).range;
        const statusIcon = this.getStatusIcon(todo.status || 'pending');

        lenses.push(
          new vscode.CodeLens(range, {
            title: `${statusIcon} ${this.getPriorityEmoji(todo.priority)} ${todo.text.substring(0, 40)}...`,
            command: 'devpilot.showTodoAction',
            arguments: [todo.id],
          })
        );
      }
    }

    return lenses;
  }

  resolveCodeLens(codeLens: vscode.CodeLens): vscode.CodeLens | Thenable<vscode.CodeLens> {
    return codeLens;
  }

  private getStatusIcon(status: string): string {
    switch (status) {
      case 'completed':
        return '✅';
      case 'in-progress':
        return '🔄';
      case 'blocked':
        return '🚫';
      default:
        return '⭕';
    }
  }

  private getPriorityEmoji(priority: string): string {
    switch (priority) {
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
      default:
        return '⚪';
    }
  }
}

export class SuggestionCodeLensProvider implements vscode.CodeLensProvider {
  provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    const lenses: vscode.CodeLens[] = [];
    const language = document.languageId;

    // JavaScript/TypeScript specific lenses
    if (['javascript', 'typescript'].includes(language)) {
      for (let i = 0; i < document.lineCount; i++) {
        const line = document.lineAt(i);
        const text = line.text;

        // Detect async/await without try-catch
        if (text.includes('await') && !text.includes('try')) {
          lenses.push(
            new vscode.CodeLens(line.range, {
              title: '💡 Add error handling',
              command: 'devpilot.suggestFix',
              arguments: ['addTryCatch', i],
            })
          );
        }

        // Detect console.log
        if (text.includes('console.log')) {
          lenses.push(
            new vscode.CodeLens(line.range, {
              title: '💡 Replace with logging',
              command: 'devpilot.suggestFix',
              arguments: ['useLogger', i],
            })
          );
        }
      }
    }

    // Python specific lenses
    if (language === 'python') {
      for (let i = 0; i < document.lineCount; i++) {
        const line = document.lineAt(i);
        const text = line.text;

        // Detect print() function
        if (text.includes('print(') && !text.includes('#')) {
          lenses.push(
            new vscode.CodeLens(line.range, {
              title: '💡 Use logging module',
              command: 'devpilot.suggestFix',
              arguments: ['useLogging', i],
            })
          );
        }
      }
    }

    return lenses;
  }

  resolveCodeLens(codeLens: vscode.CodeLens): vscode.CodeLens | Thenable<vscode.CodeLens> {
    return codeLens;
  }
}

export function registerCodeLensProviders(context: vscode.ExtensionContext) {
  const todoLensProvider = new TodoCodeLensProvider(context);
  const suggestionLensProvider = new SuggestionCodeLensProvider();

  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      { scheme: 'file', language: 'javascript' },
      todoLensProvider
    ),
    vscode.languages.registerCodeLensProvider(
      { scheme: 'file', language: 'typescript' },
      todoLensProvider
    ),
    vscode.languages.registerCodeLensProvider(
      { scheme: 'file', language: 'python' },
      todoLensProvider
    ),
    vscode.languages.registerCodeLensProvider(
      { scheme: 'file', language: 'go' },
      todoLensProvider
    ),
    vscode.languages.registerCodeLensProvider(
      { scheme: 'file', language: 'java' },
      todoLensProvider
    ),

    // Suggestion CodeLens for multiple languages
    vscode.languages.registerCodeLensProvider(
      { scheme: 'file', language: 'javascript' },
      suggestionLensProvider
    ),
    vscode.languages.registerCodeLensProvider(
      { scheme: 'file', language: 'typescript' },
      suggestionLensProvider
    ),
    vscode.languages.registerCodeLensProvider(
      { scheme: 'file', language: 'python' },
      suggestionLensProvider
    )
  );

  // Register command handlers
  context.subscriptions.push(
    vscode.commands.registerCommand('devpilot.showFileTodoStats', async (filePath: string) => {
      const manager = new TODOWorkflowManager(context);
      const todos = manager.getTodos().filter((t) => t.file === filePath);
      const active = todos.filter((t) => t.status !== 'completed');
      const completed = todos.filter((t) => t.status === 'completed');

      const fileName = filePath.split('/').pop() || filePath;
      vscode.window.showInformationMessage(
        `📋 ${fileName}: ${active.length} active, ${completed.length} completed`
      );
    }),

    vscode.commands.registerCommand('devpilot.showTodoAction', async (todoId: string) => {
      const manager = new TODOWorkflowManager(context);
      const todos = manager.getTodos();
      const todo = todos.find((t) => t.id === todoId);

      if (todo) {
        const action = await vscode.window.showQuickPick(
          [
            { label: '✓ Mark Done', description: 'Complete this TODO' },
            { label: '🔄 Mark In Progress', description: 'Start working' },
            { label: '🚫 Mark Blocked', description: 'Blocked by something' },
            { label: '✏️ Edit', description: 'Edit TODO text' },
            { label: '🗑️ Delete', description: 'Remove TODO' },
          ],
          { placeHolder: `Action for: ${todo.text.substring(0, 30)}...` }
        );

        switch (action?.label) {
          case '✓ Mark Done':
            await manager.changeStatus(todoId, 'completed');
            vscode.window.showInformationMessage('✅ TODO completed!');
            break;
          case '🔄 Mark In Progress':
            await manager.changeStatus(todoId, 'in-progress');
            vscode.window.showInformationMessage('🔄 TODO in progress!');
            break;
          case '🚫 Mark Blocked':
            await manager.changeStatus(todoId, 'blocked');
            vscode.window.showInformationMessage('🚫 TODO blocked!');
            break;
          case '✏️ Edit': {
            const newText = await vscode.window.showInputBox({
              prompt: 'Edit TODO',
              value: todo.text,
            });
            if (newText) {
              await manager.updateTodo(todoId, { ...todo, text: newText });
              vscode.window.showInformationMessage('✏️ TODO updated!');
            }
            break;
          }
          case '🗑️ Delete': {
            const confirm = await vscode.window.showQuickPick(['Yes', 'No'], {
              placeHolder: 'Confirm delete?',
            });
            if (confirm === 'Yes') {
              await manager.deleteTodo(todoId);
              vscode.window.showInformationMessage('🗑️ TODO deleted!');
            }
            break;
          }
        }
      }
    })
  );
}
