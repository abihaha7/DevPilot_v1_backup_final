/**
 * DevPilot Learning Resources & Practice TreeView
 * 
 * Provides native TreeView for:
 * - Learning resources (organized by topic)
 * - Practice problems (by difficulty)
 * - Project templates
 */

import * as vscode from "vscode";
import { getLogger } from "../core/logger";

const logger = getLogger("LearningTreeView");

export interface Resource {
  id: string;
  title: string;
  description: string;
  type: "resource" | "problem" | "template";
  topic: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  url?: string;
  content?: string;
  children?: Resource[];
}

/**
 * Learning Resources Tree Item
 */
class LearningTreeItem extends vscode.TreeItem {
  constructor(
    public readonly resource: Resource,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(resource.title, collapsibleState);

    this.description = resource.description;
    this.tooltip = `${resource.topic} • ${resource.difficulty || "reference"}`;

    // Set icons based on type
    switch (resource.type) {
      case "resource":
        this.iconPath = new vscode.ThemeIcon("book");
        break;
      case "problem":
        this.iconPath = new vscode.ThemeIcon("lightbulb");
        break;
      case "template":
        this.iconPath = new vscode.ThemeIcon("file-code");
        break;
    }

    // Add context menu
    this.contextValue = `learning-${resource.type}`;
  }
}

/**
 * Learning TreeView Data Provider
 */
export class LearningTreeProvider implements vscode.TreeDataProvider<Resource> {
  private _onDidChangeTreeData = new vscode.EventEmitter<
    Resource | undefined | null
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private resources: Resource[] = [];

  constructor(private context: vscode.ExtensionContext) {
    this.resources = this.loadResources();
  }

  /**
   * Load learning resources
   */
  private loadResources(): Resource[] {
    return [
      {
        id: "javascript-fundamentals",
        title: "JavaScript Fundamentals",
        description: "Core concepts every developer should know",
        type: "resource",
        topic: "JavaScript",
        difficulty: "beginner",
        children: [
          {
            id: "js-variables",
            title: "Variables (const, let, var)",
            description: "Understanding variable declaration",
            type: "resource",
            topic: "JavaScript",
            difficulty: "beginner",
            content: `
# Variables in JavaScript

## const (Recommended)
- **Immutable**: Cannot be reassigned
- **Block-scoped**: Limited to nearest block
- **Use by default** for clarity and safety

\`\`\`javascript
const PI = 3.14159;
const user = { name: "Alice", age: 25 };
\`\`\`

## let (When needed)
- **Mutable**: Can be reassigned
- **Block-scoped**: Limited to nearest block
- **Use when** variable will change

\`\`\`javascript
let counter = 0;
counter++; // OK
\`\`\`

## var (Avoid)
- **Avoid in modern code**
- Function-scoped (confusing)
- Use \`const\` or \`let\` instead

---
**Best Practice**: Start with \`const\`. Use \`let\` only when reassignment is needed. Never use \`var\`.
`,
          },
          {
            id: "js-functions",
            title: "Functions & Arrow Functions",
            description: "Writing reusable code blocks",
            type: "resource",
            topic: "JavaScript",
            difficulty: "beginner",
            content: `
# Functions in JavaScript

## Function Declaration
\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

## Arrow Function (Modern)
\`\`\`javascript
const greet = (name) => \`Hello, \${name}!\`;
\`\`\`

## When to Use Arrow Functions
- **Callbacks**: \`array.map((x) => x * 2)\`
- **Promises**: \`.then((result) => console.log(result))\`
- **Shorter syntax**: For single-line functions

## Important: Arrow Functions and 'this'
Arrow functions inherit \`this\` from parent scope (unlike regular functions).

---
**Best Practice**: Use arrow functions for callbacks. Use regular functions for methods in objects.
`,
          },
        ],
      },
      {
        id: "practice-problems",
        title: "Practice Problems",
        description: "Hands-on coding challenges",
        type: "resource",
        topic: "Practice",
        children: [
          {
            id: "problem-sum-array",
            title: "Sum Array Elements",
            description: "Add all numbers in an array",
            type: "problem",
            topic: "JavaScript",
            difficulty: "beginner",
            content: `
# Problem: Sum Array Elements

## Challenge
Write a function that returns the sum of all numbers in an array.

\`\`\`javascript
function sumArray(arr) {
  // TODO: Your code here
}

// Test cases
console.log(sumArray([1, 2, 3, 4, 5])); // Expected: 15
console.log(sumArray([10, 20])); // Expected: 30
\`\`\`

## Hints
1. Use a loop or reduce() method
2. Start with a total = 0
3. Add each element to total

## Solution (Click to reveal)
\`\`\`javascript
function sumArray(arr) {
  return arr.reduce((sum, num) => sum + num, 0);
}
\`\`\`

## What You Learned
- **Array methods**: reduce() transforms an array into a single value
- **Accumulator pattern**: Starting with an initial value and building up
- **Arrow functions**: Concise syntax for callbacks
`,
          },
          {
            id: "problem-filter-even",
            title: "Filter Even Numbers",
            description: "Keep only even numbers from array",
            type: "problem",
            topic: "JavaScript",
            difficulty: "beginner",
            content: `
# Problem: Filter Even Numbers

## Challenge
Write a function that returns only even numbers from an array.

\`\`\`javascript
function filterEven(arr) {
  // TODO: Your code here
}

// Test cases
console.log(filterEven([1, 2, 3, 4, 5, 6])); // Expected: [2, 4, 6]
console.log(filterEven([1, 3, 5])); // Expected: []
\`\`\`

## Solution
\`\`\`javascript
function filterEven(arr) {
  return arr.filter(num => num % 2 === 0);
}
\`\`\`

## What You Learned
- **Array.filter()**: Creates new array with elements that pass a test
- **Modulo operator (%)**: Returns remainder (num % 2 === 0 means even)
- **Functional programming**: Transforming data without mutation
`,
          },
        ],
      },
      {
        id: "project-templates",
        title: "Project Templates",
        description: "Starter projects for learning",
        type: "resource",
        topic: "Templates",
        children: [
          {
            id: "template-todo",
            title: "Todo App (Vanilla JS)",
            description: "Simple todo list project",
            type: "template",
            topic: "Project",
            difficulty: "beginner",
            url: "https://github.com/devpilot/template-todo",
          },
          {
            id: "template-calculator",
            title: "Calculator (HTML/CSS/JS)",
            description: "Build a working calculator",
            type: "template",
            topic: "Project",
            difficulty: "beginner",
            url: "https://github.com/devpilot/template-calculator",
          },
        ],
      },
    ];
  }

  /**
   * Get tree item
   */
  getTreeItem(resource: Resource): vscode.TreeItem {
    const state = resource.children
      ? vscode.TreeItemCollapsibleState.Collapsed
      : vscode.TreeItemCollapsibleState.None;

    return new LearningTreeItem(resource, state);
  }

  /**
   * Get children of resource
   */
  getChildren(resource?: Resource): Resource[] {
    if (!resource) {
      return this.resources;
    }
    return resource.children || [];
  }

  /**
   * Get parent of resource
   */
  getParent(resource: Resource): Resource | undefined {
    return undefined;
  }

  /**
   * Refresh tree
   */
  refresh(): void {
    this._onDidChangeTreeData.fire(null);
  }
}

/**
 * Register learning TreeView
 */
export function registerLearningTreeView(
  context: vscode.ExtensionContext
): void {
  const treeProvider = new LearningTreeProvider(context);

  const treeView = vscode.window.createTreeView("devpilot.learning", {
    treeDataProvider: treeProvider,
    showCollapseAll: true,
  });

  context.subscriptions.push(treeView);

  // Command: Open resource
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "devpilot.openLearningResource",
      async (resource: Resource) => {
        if (resource.url) {
          vscode.env.openExternal(vscode.Uri.parse(resource.url));
        } else if (resource.content) {
          const doc = await vscode.workspace.openTextDocument({
            language: "markdown",
            content: resource.content,
          });
          vscode.window.showTextDocument(doc, vscode.ViewColumn.Two);
          logger.info("Learning resource opened", { resourceId: resource.id });
        }
      }
    )
  );

  logger.info("Learning TreeView registered");
}
