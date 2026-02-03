/**
 * Phase 3: TODO Workflow System
 * Proper TODO management with priorities, workflow states, and achievements
 */

import * as vscode from "vscode";
import { getLogger } from "../core/logger";

const logger = getLogger("TODOWorkflow");

export interface TODOItem {
  id: string;
  text: string;
  file: string;
  line: number;
  priority: "high" | "medium" | "low";
  status: "pending" | "in-progress" | "completed" | "blocked";
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  assignedTo?: string;
  tags?: string[];
  description?: string;
  completionDate?: string;
  hoursEstimated?: number;
  hoursSpent?: number;
}

export interface TODOWorkflow {
  getTodos(): TODOItem[];
  addTodo(todo: Partial<TODOItem>): TODOItem;
  updateTodo(id: string, updates: Partial<TODOItem>): TODOItem | null;
  deleteTodo(id: string): boolean;
  changePriority(id: string, priority: "high" | "medium" | "low"): boolean;
  changeStatus(id: string, status: "pending" | "in-progress" | "completed" | "blocked"): boolean;
  getByPriority(priority: string): TODOItem[];
  getByStatus(status: string): TODOItem[];
  getCompleted(): TODOItem[];
  getPending(): TODOItem[];
  getStats(): TODOStats;
}

export interface TODOStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  blocked: number;
  completionRate: number;
  highPriority: number;
  averageTimePerTask: number;
}

/**
 * TODO Workflow Manager
 * Handles proper TODO structure with priorities, status, and achievements
 */
export class TODOWorkflowManager implements TODOWorkflow {
  private todos: Map<string, TODOItem> = new Map();
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.loadTodos();
  }

  /**
   * Load TODOs from storage
   */
  private loadTodos(): void {
    try {
      const stored = this.context.globalState.get<TODOItem[]>(
        "devpilot.todos"
      );
      if (stored) {
        stored.forEach((todo) => {
          this.todos.set(todo.id, todo);
        });
        logger.info(`Loaded ${stored.length} TODOs from storage`);
      }
    } catch (error) {
      logger.warn("Failed to load TODOs", { error: String(error) });
    }
  }

  /**
   * Save TODOs to storage
   */
  private saveTodos(): void {
    try {
      const todos = Array.from(this.todos.values());
      this.context.globalState.update("devpilot.todos", todos);
      logger.info(`Saved ${todos.length} TODOs to storage`);
    } catch (error) {
      logger.error("Failed to save TODOs", { error: String(error) });
    }
  }

  getTodos(): TODOItem[] {
    return Array.from(this.todos.values()).sort(
      (a, b) =>
        this.priorityValue(b.priority) - this.priorityValue(a.priority) ||
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  addTodo(todo: Partial<TODOItem>): TODOItem {
    const id = `todo-${Date.now()}`;
    const now = new Date().toISOString();

    const newTodo: TODOItem = {
      id,
      text: todo.text || "Untitled TODO",
      file: todo.file || "unknown",
      line: todo.line || 0,
      priority: todo.priority || "medium",
      status: todo.status || "pending",
      createdAt: todo.createdAt || now,
      updatedAt: now,
      dueDate: todo.dueDate,
      assignedTo: todo.assignedTo,
      tags: todo.tags || [],
      description: todo.description,
      hoursEstimated: todo.hoursEstimated,
    };

    this.todos.set(id, newTodo);
    this.saveTodos();

    logger.info("TODO added", { id, text: newTodo.text });
    return newTodo;
  }

  updateTodo(id: string, updates: Partial<TODOItem>): TODOItem | null {
    const todo = this.todos.get(id);
    if (!todo) {
      return null;
    }

    const updated: TODOItem = {
      ...todo,
      ...updates,
      id, // Preserve ID
      updatedAt: new Date().toISOString(),
    };

    this.todos.set(id, updated);
    this.saveTodos();

    logger.info("TODO updated", { id, changes: Object.keys(updates) });
    return updated;
  }

  deleteTodo(id: string): boolean {
    const deleted = this.todos.delete(id);
    if (deleted) {
      this.saveTodos();
      logger.info("TODO deleted", { id });
    }
    return deleted;
  }

  changePriority(
    id: string,
    priority: "high" | "medium" | "low"
  ): boolean {
    const todo = this.todos.get(id);
    if (!todo) {
      return false;
    }

    todo.priority = priority;
    todo.updatedAt = new Date().toISOString();
    this.todos.set(id, todo);
    this.saveTodos();

    logger.info("TODO priority changed", { id, priority });
    return true;
  }

  changeStatus(
    id: string,
    status: "pending" | "in-progress" | "completed" | "blocked"
  ): boolean {
    const todo = this.todos.get(id);
    if (!todo) {
      return false;
    }

    const oldStatus = todo.status;
    todo.status = status;
    todo.updatedAt = new Date().toISOString();

    if (status === "completed") {
      todo.completionDate = new Date().toISOString();
    }

    this.todos.set(id, todo);
    this.saveTodos();

    logger.info("TODO status changed", {
      id,
      from: oldStatus,
      to: status,
    });

    // Trigger achievements if completed
    if (status === "completed") {
      this.onTodoCompleted(todo);
    }

    return true;
  }

  getByPriority(priority: string): TODOItem[] {
    return this.getTodos().filter((todo) => todo.priority === priority);
  }

  getByStatus(status: string): TODOItem[] {
    return this.getTodos().filter((todo) => todo.status === status);
  }

  getCompleted(): TODOItem[] {
    return this.getByStatus("completed");
  }

  getPending(): TODOItem[] {
    return this.getTodos().filter(
      (todo) => todo.status === "pending" || todo.status === "in-progress"
    );
  }

  getStats(): TODOStats {
    const todos = this.getTodos();
    const completed = todos.filter((t) => t.status === "completed");
    const totalHours = todos
      .filter((t) => t.hoursSpent)
      .reduce((sum, t) => sum + (t.hoursSpent || 0), 0);

    return {
      total: todos.length,
      pending: todos.filter((t) => t.status === "pending").length,
      inProgress: todos.filter((t) => t.status === "in-progress").length,
      completed: completed.length,
      blocked: todos.filter((t) => t.status === "blocked").length,
      completionRate:
        todos.length > 0 ? (completed.length / todos.length) * 100 : 0,
      highPriority: todos.filter((t) => t.priority === "high").length,
      averageTimePerTask:
        completed.length > 0 ? totalHours / completed.length : 0,
    };
  }

  /**
   * Called when a TODO is marked as complete
   * Triggers achievement system updates
   */
  private onTodoCompleted(todo: TODOItem): void {
    logger.info("TODO completed - checking achievements", { id: todo.id });
    // This would integrate with the achievements system
    // vscode.commands.executeCommand("devpilot.onTodoCompleted", todo);
  }

  /**
   * Get priority value for sorting
   */
  private priorityValue(priority: string): number {
    const values: Record<string, number> = {
      high: 3,
      medium: 2,
      low: 1,
    };
    return values[priority] || 0;
  }

  /**
   * Get status icon for display
   */
  static getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      pending: "⭕",
      "in-progress": "🔄",
      completed: "✅",
      blocked: "🚫",
    };
    return icons[status] || "❓";
  }

  /**
   * Get priority icon for display
   */
  static getPriorityIcon(priority: string): string {
    const icons: Record<string, string> = {
      high: "🔴",
      medium: "🟡",
      low: "🟢",
    };
    return icons[priority] || "⚪";
  }

  /**
   * Format TODO for display
   */
  static formatTodo(todo: TODOItem): string {
    const status = this.getStatusIcon(todo.status);
    const priority = this.getPriorityIcon(todo.priority);
    const location = `${todo.file}:${todo.line}`;

    let display = `${status} ${priority} ${todo.text} (${location})`;

    if (todo.dueDate) {
      display += ` 📅 ${new Date(todo.dueDate).toLocaleDateString()}`;
    }

    if (todo.hoursEstimated) {
      display += ` ⏱️ ${todo.hoursEstimated}h`;
    }

    return display;
  }
}

/**
 * Register TODO workflow commands
 */
export function registerTODOWorkflow(
  context: vscode.ExtensionContext
): TODOWorkflowManager {
  const workflow = new TODOWorkflowManager(context);
  const logger_cmds = getLogger("TODOCommands");

  const register = (cmd: string, cb: (...args: any[]) => any) =>
    context.subscriptions.push(vscode.commands.registerCommand(cmd, cb));

  /**
   * Show TODO statistics
   */
  register("devpilot.showTodoStats", async () => {
    const stats = workflow.getStats();
    const message = `
📊 TODO Statistics:
━━━━━━━━━━━━━━━━━
Total: ${stats.total}
✅ Completed: ${stats.completed} (${stats.completionRate.toFixed(0)}%)
⭕ Pending: ${stats.pending}
🔄 In Progress: ${stats.inProgress}
🚫 Blocked: ${stats.blocked}
🔴 High Priority: ${stats.highPriority}
⏱️ Avg Time/Task: ${stats.averageTimePerTask.toFixed(1)}h
    `;

    vscode.window.showInformationMessage(message);
    logger_cmds.info("TODO stats displayed");
  });

  /**
   * Change TODO status
   */
  register("devpilot.changeTodoStatus", async (todoId: string) => {
    const statuses = ["Pending", "In Progress", "Completed", "Blocked"];
    const selected = await vscode.window.showQuickPick(statuses);

    if (selected) {
      const statusMap: Record<string, "pending" | "in-progress" | "completed" | "blocked"> = {
        Pending: "pending",
        "In Progress": "in-progress",
        Completed: "completed",
        Blocked: "blocked",
      };

      workflow.changeStatus(todoId, statusMap[selected]);
      vscode.window.showInformationMessage(`✅ TODO status changed to ${selected}`);
    }
  });

  /**
   * Create new TODO
   */
  register("devpilot.createTodo", async () => {
    const text = await vscode.window.showInputBox({
      prompt: "Enter TODO description",
      placeHolder: "e.g., Fix login bug",
    });

    if (!text) {
      return;
    }

    const editor = vscode.window.activeTextEditor;
    const file = editor?.document.fileName || "unknown";
    const line = editor?.selection.start.line || 0;

    const priorities = ["High", "Medium", "Low"];
    const priority = await vscode.window.showQuickPick(priorities);

    if (priority) {
      const todo = workflow.addTodo({
        text,
        file,
        line,
        priority: priority.toLowerCase() as "high" | "medium" | "low",
      });

      vscode.window.showInformationMessage(
        `✅ TODO created: "${todo.text}"`
      );
      logger_cmds.info("TODO created", { text });
    }
  });

  return workflow;
}
