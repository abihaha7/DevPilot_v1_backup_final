import * as vscode from 'vscode';
import { TODOWorkflowManager } from './todoWorkflow';

/**
 * TODO Comment Parser
 * Automatically detects and creates TODOs from code comments
 * Supports multiple languages and comment formats
 */

interface ParsedTodo {
  line: number;
  text: string;
  file: string;
  language: string;
  priority: 'high' | 'medium' | 'low';
  timestamp: Date;
}

interface TodoCommentPattern {
  regex: RegExp;
  priority: 'high' | 'medium' | 'low';
}

export class TodoCommentParser {
  private _context: vscode.ExtensionContext;
  private _todoManager: TODOWorkflowManager;
  private _patterns: Map<string, TodoCommentPattern[]>;
  private _disposables: vscode.Disposable[] = [];

  constructor(context: vscode.ExtensionContext) {
    this._context = context;
    this._todoManager = new TODOWorkflowManager(context);
    this._patterns = this.initializePatterns();
    this.setupListeners();
  }

  private initializePatterns(): Map<string, TodoCommentPattern[]> {
    const patterns = new Map<string, TodoCommentPattern[]>();

    // JavaScript/TypeScript patterns
    patterns.set('javascript', [
      { regex: /\/\/\s*TODO:?\s*(.+?)(?:$|\/\/)/i, priority: 'medium' },
      { regex: /\/\/\s*FIXME:?\s*(.+?)(?:$|\/\/)/i, priority: 'high' },
      { regex: /\/\/\s*HACK:?\s*(.+?)(?:$|\/\/)/i, priority: 'high' },
      { regex: /\/\*\s*TODO:?\s*(.+?)\s*\*\//i, priority: 'medium' },
      { regex: /\/\*\*\s*TODO:?\s*(.+?)\s*\*\//i, priority: 'medium' },
    ]);

    patterns.set('typescript', patterns.get('javascript')!);

    // Python patterns
    patterns.set('python', [
      { regex: /#\s*TODO:?\s*(.+?)(?:$|#)/i, priority: 'medium' },
      { regex: /#\s*FIXME:?\s*(.+?)(?:$|#)/i, priority: 'high' },
      { regex: /'''\s*TODO:?\s*(.+?)\s*'''/i, priority: 'medium' },
      { regex: /"""\s*TODO:?\s*(.+?)\s*"""/i, priority: 'medium' },
    ]);

    // Go patterns
    patterns.set('go', [
      { regex: /\/\/\s*TODO:?\s*(.+?)(?:$|\/\/)/i, priority: 'medium' },
      { regex: /\/\*\s*TODO:?\s*(.+?)\s*\*\//i, priority: 'medium' },
    ]);

    // Java/C#/C++ patterns
    patterns.set('java', patterns.get('javascript')!);
    patterns.set('csharp', patterns.get('javascript')!);
    patterns.set('cpp', patterns.get('javascript')!);

    // Ruby patterns
    patterns.set('ruby', [
      { regex: /#\s*TODO:?\s*(.+?)(?:$|#)/i, priority: 'medium' },
      { regex: /#\s*FIXME:?\s*(.+?)(?:$|#)/i, priority: 'high' },
    ]);

    // SQL patterns
    patterns.set('sql', [
      { regex: /--\s*TODO:?\s*(.+?)(?:$|--)/i, priority: 'medium' },
      { regex: /\/\*\s*TODO:?\s*(.+?)\s*\*\//i, priority: 'medium' },
    ]);

    // HTML patterns
    patterns.set('html', [
      { regex: /<!--\s*TODO:?\s*(.+?)\s*-->/i, priority: 'medium' },
      { regex: /<!--\s*FIXME:?\s*(.+?)\s*-->/i, priority: 'high' },
    ]);

    // CSS patterns
    patterns.set('css', [
      { regex: /\/\*\s*TODO:?\s*(.+?)\s*\*\//i, priority: 'medium' },
      { regex: /\/\*\s*FIXME:?\s*(.+?)\s*\*\//i, priority: 'high' },
    ]);

    return patterns;
  }

  private setupListeners() {
    // Parse on file open
    this._disposables.push(
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor) {
          this.parseDocument(editor.document);
        }
      })
    );

    // Parse on file change
    this._disposables.push(
      vscode.workspace.onDidChangeTextDocument((event) => {
        this.parseDocument(event.document);
      })
    );

    // Parse all open files on activation
    for (const editor of vscode.window.visibleTextEditors) {
      this.parseDocument(editor.document);
    }
  }

  public parseDocument(document: vscode.TextDocument) {
    const language = document.languageId;
    const patterns = this._patterns.get(language);

    if (!patterns) {
      return; // No patterns for this language
    }

    const todos: ParsedTodo[] = [];

    for (let i = 0; i < document.lineCount; i++) {
      const line = document.lineAt(i);
      const text = line.text;

      for (const pattern of patterns) {
        const match = text.match(pattern.regex);
        if (match && match[1]) {
          const todoText = match[1].trim();
          todos.push({
            line: i,
            text: todoText,
            file: document.fileName,
            language,
            priority: pattern.priority,
            timestamp: new Date(),
          });
        }
      }
    }

    this.syncParsedTodos(todos, document.fileName);
  }

  private syncParsedTodos(todos: ParsedTodo[], filePath: string) {
    // Get existing TODOs for this file
    const existingTodos = this._todoManager.getTodos().filter((t) => t.file === filePath);

    // Create new TODOs that don't exist
    for (const todo of todos) {
      const exists = existingTodos.some((t) => t.line === todo.line && t.text === todo.text);
      if (!exists) {
        this._todoManager.addTodo({
          text: todo.text,
          priority: todo.priority,
          file: filePath,
          line: todo.line,
        });
      }
    }

    // Remove TODOs that are no longer in comments
    for (const existing of existingTodos) {
      const stillExists = todos.some((t) => t.line === existing.line && t.text === existing.text);
      if (!stillExists) {
        this._todoManager.deleteTodo(existing.id!);
      }
    }
  }

  public getDecorations(document: vscode.TextDocument): vscode.DecorationOptions[] {
    const language = document.languageId;
    const patterns = this._patterns.get(language);

    if (!patterns) {
      return [];
    }

    const decorations: vscode.DecorationOptions[] = [];

    for (let i = 0; i < document.lineCount; i++) {
      const line = document.lineAt(i);
      const text = line.text;

      for (const pattern of patterns) {
        if (pattern.regex.test(text)) {
          const range = new vscode.Range(i, 0, i, text.length);
          decorations.push({
            range,
            hoverMessage: '🎯 TODO from comment',
            renderOptions: {
              before: {
                contentText: '●',
                color: this.getPriorityColor(pattern.priority),
                margin: '0 4px 0 0',
              },
            },
          });
        }
      }
    }

    return decorations;
  }

  private getPriorityColor(priority: 'high' | 'medium' | 'low'): string {
    switch (priority) {
      case 'high':
        return '#ff5555'; // Red
      case 'medium':
        return '#ffbb33'; // Orange
      case 'low':
        return '#0099cc'; // Blue
      default:
        return '#999999'; // Gray
    }
  }

  public dispose() {
    this._disposables.forEach((d) => d.dispose());
  }
}

export function registerTodoCommentParser(context: vscode.ExtensionContext) {
  const parser = new TodoCommentParser(context);

  // Update decorations when editor changes
  const decorationType = vscode.window.createTextEditorDecorationType({
    gutterIconPath: undefined,
    light: {
      before: { backgroundColor: 'rgba(0,0,0,0.1)' },
    },
    dark: {
      before: { backgroundColor: 'rgba(255,255,255,0.1)' },
    },
  });

  let updateDecorations = (editor: vscode.TextEditor | undefined) => {
    if (editor) {
      const decorations = parser.getDecorations(editor.document);
      editor.setDecorations(decorationType, decorations);
    }
  };

  vscode.window.onDidChangeActiveTextEditor((editor) => {
    updateDecorations(editor);
  });

  for (const editor of vscode.window.visibleTextEditors) {
    updateDecorations(editor);
  }

  context.subscriptions.push(parser, decorationType);
}
