/**
 * DevPilot Todo Tracker (CodeLens + Diagnostics)
 * 
 * Highlights TODO comments in the editor
 * Provides quick actions to manage, track, and prioritize todos
 * No UI webview needed - all native editor integration
 */

import * as vscode from "vscode";
import { getLogger } from "../core/logger";
import { getAchievementsManager } from "./achievements";

const logger = getLogger("TodoTracker");

export interface TodoItem {
  id: string;
  file: string;
  line: number;
  text: string;
  priority: "high" | "medium" | "low";
  completed: boolean;
  createdAt: number;
  completedAt?: number;
}

interface TodoPattern {
  pattern: RegExp;
  priority: "high" | "medium" | "low";
}

const TODO_PATTERNS: TodoPattern[] = [
  { pattern: /!\s*TODO\b/i, priority: "high" }, // !TODO
  { pattern: /FIXME\b/i, priority: "high" }, // FIXME
  { pattern: /BUG\b/i, priority: "high" }, // BUG
  { pattern: /TODO\b/i, priority: "medium" }, // TODO
  { pattern: /HACK\b/i, priority: "medium" }, // HACK
  { pattern: /NOTE\b/i, priority: "low" }, // NOTE
  { pattern: /XXX\b/i, priority: "medium" }, // XXX
];

/**
 * Todo CodeLens Provider
 * 
 * Shows quick action buttons above TODO comments
 */
export class TodoCodeLensProvider implements vscode.CodeLensProvider {
  private diagnosticCollection: vscode.DiagnosticCollection;

  constructor(diagnosticCollection: vscode.DiagnosticCollection) {
    this.diagnosticCollection = diagnosticCollection;
  }

  async provideCodeLenses(
    document: vscode.TextDocument
  ): Promise<vscode.CodeLens[]> {
    const codeLenses: vscode.CodeLens[] = [];
    const text = document.getText();
    const lines = text.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      for (const { pattern } of TODO_PATTERNS) {
        if (pattern.test(line)) {
          const range = new vscode.Range(i, 0, i, line.length);
          const todoMatch = line.match(/(?:TODO|FIXME|BUG|HACK|NOTE):\s*(.+)/i);
          const todoText = todoMatch ? todoMatch[1].trim() : "No description";

          // Mark as Done action
          const markDoneCommand: vscode.Command = {
            title: "✅ Mark Done",
            command: "devpilot.markTodoDone",
            arguments: [document.uri, i, todoText],
          };

          // Increase Priority action
          const priorityCommand: vscode.Command = {
            title: "⬆️ Priority",
            command: "devpilot.increaseTodoPriority",
            arguments: [document.uri, i],
          };

          // Delete action
          const deleteCommand: vscode.Command = {
            title: "🗑️ Delete",
            command: "devpilot.deleteTodo",
            arguments: [document.uri, i],
          };

          const codeLens = new vscode.CodeLens(range, markDoneCommand);
          codeLens.command = priorityCommand; // Default action
          codeLenses.push(codeLens);

          // Also add diagnostics for visibility
          const diagnostic = new vscode.Diagnostic(
            range,
            `📝 ${todoText}`,
            vscode.DiagnosticSeverity.Information
          );
          diagnostic.source = "DevPilot Todo Tracker";
          diagnostic.code = "todo-item";
          this.diagnosticCollection.set(document.uri, [diagnostic]);

          break;
        }
      }
    }

    return codeLenses;
  }

  resolveCodeLens(
    codeLens: vscode.CodeLens
  ): vscode.CodeLens | Thenable<vscode.CodeLens> {
    return codeLens;
  }
}

/**
 * Todo Tracker Commands
 */
export function registerTodoTrackerCommands(
  context: vscode.ExtensionContext
): void {
  const register = (cmd: string, cb: (...args: any[]) => any) =>
    context.subscriptions.push(vscode.commands.registerCommand(cmd, cb));

  register(
    "devpilot.markTodoDone",
    async (uri: vscode.Uri, lineNum: number, todoText: string) => {
      try {
        const document = await vscode.workspace.openTextDocument(uri);
        const editor = await vscode.window.showTextDocument(document);

        const line = document.lineAt(lineNum);
        const range = new vscode.Range(lineNum, 0, lineNum, line.text.length);

        // Comment out the TODO line
        const newText = `// ✅ DONE: ${line.text.trim()}`;
        const edit = new vscode.WorkspaceEdit();
        edit.replace(uri, range, newText);

        await vscode.workspace.applyEdit(edit);
        vscode.window.showInformationMessage(`✅ Marked done: ${todoText}`);
        logger.info("Todo marked done", { line: lineNum, text: todoText });

        // Check and unlock achievements
        const achievementsManager = getAchievementsManager();
        if (achievementsManager) {
          await achievementsManager.checkAndUnlockAchievement();
          logger.info("Achievement check triggered from todo completion");
        }
      } catch (error) {
        logger.error("Failed to mark todo done", { error: String(error) });
      }
    }
  );

  register(
    "devpilot.increaseTodoPriority",
    async (uri: vscode.Uri, lineNum: number) => {
      try {
        const document = await vscode.workspace.openTextDocument(uri);
        const line = document.lineAt(lineNum);
        const text = line.text;

        // Add ! prefix for high priority
        if (!text.includes("!TODO")) {
          const newText = text.replace(/TODO/, "!TODO");
          const range = new vscode.Range(lineNum, 0, lineNum, text.length);
          const edit = new vscode.WorkspaceEdit();
          edit.replace(uri, range, newText);
          await vscode.workspace.applyEdit(edit);

          vscode.window.showInformationMessage("⬆️ Priority increased to HIGH");
          logger.info("Todo priority increased", { line: lineNum });
        }
      } catch (error) {
        logger.error("Failed to increase priority", { error: String(error) });
      }
    }
  );

  register(
    "devpilot.deleteTodo",
    async (uri: vscode.Uri, lineNum: number) => {
      try {
        const document = await vscode.workspace.openTextDocument(uri);
        const line = document.lineAt(lineNum);
        const range = new vscode.Range(lineNum, 0, lineNum + 1, 0);

        const edit = new vscode.WorkspaceEdit();
        edit.delete(uri, range);
        await vscode.workspace.applyEdit(edit);

        vscode.window.showInformationMessage("🗑️ Todo deleted");
        logger.info("Todo deleted", { line: lineNum });
      } catch (error) {
        logger.error("Failed to delete todo", { error: String(error) });
      }
    }
  );

  register("devpilot.showTodos", async () => {
    try {
      const todos: TodoItem[] = [];
      const files = await vscode.workspace.findFiles(
        "**/*.{ts,tsx,js,jsx,py,go,html,css}",
        "**/node_modules/**",
        50
      );

      for (const file of files) {
        const document = await vscode.workspace.openTextDocument(file);
        const text = document.getText();
        const lines = text.split("\n");

        for (let i = 0; i < lines.length; i++) {
          for (const { pattern, priority } of TODO_PATTERNS) {
            if (pattern.test(lines[i])) {
              const match = lines[i].match(/(?:TODO|FIXME|BUG|HACK|NOTE):\s*(.+)/i);
              const text = match ? match[1].trim() : "No description";

              todos.push({
                id: `${file.fsPath}:${i}`,
                file: file.fsPath,
                line: i + 1,
                text,
                priority,
                completed: false,
                createdAt: Date.now(),
              });
              break;
            }
          }
        }
      }

      // Sort by priority and line
      todos.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        return pDiff !== 0 ? pDiff : a.line - b.line;
      });

      // Display in quick pick
      const items = todos.map((todo) => ({
        label: `${todo.priority.toUpperCase()} | L${todo.line}: ${todo.text}`,
        description: todo.file,
        detail: todo.text,
        todo,
      }));

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: `Found ${todos.length} todos - click to navigate`,
        matchOnDescription: true,
      });

      if (selected) {
        const doc = await vscode.workspace.openTextDocument(
          vscode.Uri.file(selected.todo.file)
        );
        const editor = await vscode.window.showTextDocument(doc);
        const range = new vscode.Range(selected.todo.line - 1, 0, selected.todo.line - 1, 0);
        editor.selection = new vscode.Selection(range.start, range.start);
        editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
      }
    } catch (error) {
      logger.error("Failed to show todos", { error: String(error) });
      vscode.window.showErrorMessage("Failed to load todos");
    }
  });
}

/**
 * Register todo tracker
 */
export function registerTodoTracker(
  context: vscode.ExtensionContext
): vscode.Disposable {
  const diagnosticCollection = vscode.languages.createDiagnosticCollection(
    "devpilot-todos"
  );

  const provider = new TodoCodeLensProvider(diagnosticCollection);

  registerTodoTrackerCommands(context);

  return vscode.languages.registerCodeLensProvider(
    { scheme: "file", pattern: "**/*.{ts,tsx,js,jsx,py,go,html,css}" },
    provider
  );
}
