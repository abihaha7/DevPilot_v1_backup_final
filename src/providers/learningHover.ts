/**
 * DevPilot Learning Hover Provider
 * 
 * Provides inline hover explanations (why/how, not just what)
 * Learning-focused: explains concepts before providing code
 * Context-aware: Adapts to actual code patterns and usage
 */

import * as vscode from "vscode";
import { getLogger } from "../core/logger";
import { getLanguageAnalyzer } from "../core/multiLanguage";
import { getAIProvider } from "../core/aiProvider";
import { getContextAwareAnalyzer } from "./contextAwareAnalyzer";

const logger = getLogger("LearningHoverProvider");

interface CodeElement {
  word: string;
  range: vscode.Range;
  type: "keyword" | "function" | "variable" | "pattern" | "unknown";
}

/**
 * Native (Offline) Explanations
 * 
 * Provides instant, deterministic explanations for common patterns
 * No network calls, no latency
 */
const NATIVE_EXPLANATIONS: Record<string, string> = {
  // JavaScript/TypeScript Keywords
  const:
    "🔒 **const**: Creates a constant variable that cannot be reassigned. Use it by default to prevent accidental changes.",
  let: "✏️ **let**: Creates a block-scoped variable that can be reassigned. Use when the value will change.",
  var: "⚠️ **var**: Creates a function-scoped variable (older style). Avoid - use `const` or `let` instead.",
  function: "🔧 **function**: Defines a reusable block of code. Good for organizing logic into named blocks.",
  "=>":
    "⚡ **Arrow function**: Compact syntax for functions. Useful for callbacks and shorter functions.",
  if: "❓ **if**: Executes code only when a condition is true. Used for decision-making in code.",
  else: "↔️ **else**: Executes code when the `if` condition is false. Provides an alternative path.",
  for: "🔄 **for**: Repeats code multiple times. Useful for processing items in a list or counting.",
  while: "⏰ **while**: Repeats code as long as a condition is true. Stop it with a condition change.",
  switch: "🔀 **switch**: Chooses between multiple options. More readable than many `if` statements.",
  "try...catch":
    "🛡️ **try...catch**: Safely handles errors. Code in `try` runs; if error occurs, `catch` handles it.",
  return: "↩️ **return**: Sends a result back from a function. Stops the function execution.",
  class: "🏗️ **class**: Blueprint for creating objects. Organizes related data and functions together.",
  async: "⏳ **async**: Makes a function handle time-consuming tasks. Allows `await` keyword inside.",
  await: "⏸️ **await**: Waits for an async operation to complete before continuing. Must be in async function.",
  Promise:
    "📦 **Promise**: Represents a future result (success or failure). Core of async JavaScript.",
  "...":
    "📌 **Spread operator**: Expands array/object contents. Useful for copying or combining collections.",

  // Common Patterns
  "array.map":
    "🗺️ **map()**: Transforms each item in an array. Returns a new array with transformed items.",
  "array.filter":
    "🔍 **filter()**: Keeps only items matching a condition. Returns new array with matching items.",
  "array.reduce":
    "🔢 **reduce()**: Combines array items into a single value. Used for sum, count, merging.",
  "array.forEach":
    "👣 **forEach()**: Runs code for each item. Like a `for` loop but more modern. Doesn't return.",
  "object.keys":
    "🔑 **keys()**: Gets all property names from an object. Returns them as an array.",
  "JSON.parse":
    "📖 **JSON.parse()**: Converts text to JavaScript object. Essential for reading API responses.",
  "JSON.stringify":
    "✍️ **JSON.stringify()**: Converts object to text. Essential for sending data to servers.",

  // HTML/CSS
  div: "📦 **div**: Container element. Used to group and style other elements.",
  span: "📝 **span**: Inline container. Used for styling text without line breaks.",
  button:
    "🔘 **button**: Clickable element. Triggers actions when clicked (forms, interactions).",
  input: "⌨️ **input**: Text field. Lets users type or select values.",
  p: "📄 **p**: Paragraph text. Use for blocks of text content.",
  h1: "📌 **h1**: Heading (largest). Use one per page for the main title.",
  cssClass: "🏷️ **class**: Applies CSS styling. Reusable way to style multiple elements.",
  id: "🎯 **id**: Unique identifier. Used to target one specific element (CSS or JavaScript).",
  "z-index":
    "📚 **z-index**: Controls layering. Higher numbers appear on top of lower numbers.",
  flexbox:
    "📐 **flexbox**: Layout system. Makes responsive, flexible layouts easy.",
  grid: "🟦 **grid**: Layout system. Creates rows and columns for complex layouts.",

  // Python
  "def":
    "🔧 **def**: Defines a function. Reusable block of code with a name.",
  "import":
    "📥 **import**: Loads code from other files. Lets you use libraries and modules.",
  pythonClass:
    "🏗️ **class**: Blueprint for objects. Groups data and functions together.",
  "for i in":
    "🔄 **for loop**: Repeats for each item in a sequence. Standard way to iterate.",
  "if __name__":
    "🚀 **name guard**: Runs code only when script is executed directly, not imported.",
  "with open":
    "📂 **with open**: Opens files safely. Automatically closes file when done.",
  "try except":
    "🛡️ **try except**: Handles errors gracefully. Prevents crashes from unexpected issues.",

  // Go
  func: "🔧 **func**: Defines a function. Core building block of Go programs.",
  "defer":
    "⏰ **defer**: Schedules code to run later (when function ends). Good for cleanup.",
  "goroutine":
    "🔀 **goroutine**: Lightweight concurrent task. Lets multiple things run simultaneously.",
  "channel":
    "🔗 **channel**: Communication between goroutines. Safe way to share data.",
};

/**
 * Extract code element from position
 */
function extractCodeElement(
  document: vscode.TextDocument,
  position: vscode.Position
): CodeElement | null {
  const word = document.getWordRangeAtPosition(position);
  if (!word) {
    return null;
  }

  const wordText = document.getText(word);
  const line = document.lineAt(position.line).text;

  // Determine element type
  let type: "keyword" | "function" | "variable" | "pattern" | "unknown" =
    "unknown";

  const keywords = new Set([
    "const",
    "let",
    "var",
    "function",
    "if",
    "else",
    "for",
    "while",
    "switch",
    "try",
    "catch",
    "finally",
    "return",
    "new",
    "this",
    "class",
    "async",
    "await",
    "Promise",
    "def",
    "import",
    "with",
    "except",
    "func",
    "defer",
    "go",
  ]);

  if (keywords.has(wordText)) {
    type = "keyword";
  } else if (/\(/.test(line.substring(word.end.character))) {
    type = "function";
  } else if (wordText[0] === wordText[0].toUpperCase()) {
    type = "pattern";
  } else {
    type = "variable";
  }

  return {
    word: wordText,
    range: word,
    type,
  };
}

/**
 * Get native explanation for code element
 */
function getNativeExplanation(element: CodeElement): string | null {
  // Check direct matches
  if (NATIVE_EXPLANATIONS[element.word]) {
    return NATIVE_EXPLANATIONS[element.word];
  }

  // Check pattern matches
  for (const [pattern, explanation] of Object.entries(NATIVE_EXPLANATIONS)) {
    if (pattern.includes(".") && element.word.includes(pattern.split(".")[1])) {
      return explanation;
    }
  }

  return null;
}

/**
 * Learning Hover Provider with Squiggle Diagnostics
 * Provides learning-focused explanations + diagnostic suggestions
 */
export class LearningHoverProvider implements vscode.HoverProvider {
  private diagnosticCollection: vscode.DiagnosticCollection;

  constructor() {
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection(
      "devpilot-learning"
    );
  }

  async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Promise<vscode.Hover | null> {
    const element = extractCodeElement(document, position);
    if (!element) {
      return null;
    }

    // Get context-aware analysis
    const analyzer = getContextAwareAnalyzer();
    const context = analyzer.analyzeContext(document, position);

    // Check for context-aware suggestions first
    if (context.suggestedPatterns.length > 0) {
      const suggestion = context.suggestedPatterns[0];
      const message = `**🔧 DevPilot Learning**\n\n${suggestion.explanation}\n\n**Suggestion:** ${suggestion.suggestion}`;
      return new vscode.Hover(new vscode.MarkdownString(message));
    }

    // Try native explanation (instant) with DevPilot branding
    const nativeExplanation = getNativeExplanation(element);
    if (nativeExplanation) {
      const contextTip = analyzer.getLearningTip(context);
      const message = `**🔧 DevPilot Learning**\n\n${nativeExplanation}${contextTip ? "\n\n" + contextTip : ""}`;
      return new vscode.Hover(new vscode.MarkdownString(message));
    }

    // Try AI explanation if available (async)
    try {
      const aiProvider = getAIProvider();
      if (aiProvider.isAvailable && !token.isCancellationRequested) {
        const explanation = await aiProvider.getExplanation({
          code: element.word,
          language: document.languageId,
          type: "what",
        });

        if (explanation) {
          const contextTip = analyzer.getLearningTip(context);
          const message = `**🔧 DevPilot Learning (AI)**\n\n💡 ${explanation}${contextTip ? "\n\n" + contextTip : ""}`;
          return new vscode.Hover(new vscode.MarkdownString(message));
        }
      }
    } catch (error) {
      logger.warn("[DevPilot] AI explanation failed", { error: String(error) });
    }

    // Fallback with DevPilot branding and context
    const contextTip = analyzer.getLearningTip(context);
    const genericMsg = `**🔧 DevPilot Learning Hover**

📖 **${element.word}** (${element.type})

**Patterns detected in this file:**
${context.patterns.map((p) => `• ${p}`).join("\n")}

${contextTip}

✨ DevPilot provides intelligent, context-aware learning suggestions.

**Tips**:
- Right-click → "Go to Definition" for more details
- Open DevPilot Learning Panel for comprehensive guides
- Set OpenAI Key to enable AI-powered explanations`;

    return new vscode.Hover(new vscode.MarkdownString(genericMsg));
  }

  /**
   * Provide squiggle diagnostics with DevPilot suggestions
   */
  provideSuggestionsForFile(document: vscode.TextDocument): void {
    const diagnostics: vscode.Diagnostic[] = [];
    const text = document.getText();
    const lines = text.split("\n");

    lines.forEach((line, lineIndex) => {
      // Suggest against 'var'
      const varMatch = /\bvar\s+\w+/.exec(line);
      if (varMatch) {
        const range = new vscode.Range(
          lineIndex,
          varMatch.index,
          lineIndex,
          varMatch.index + varMatch[0].length
        );
        const diag = new vscode.Diagnostic(
          range,
          "🔧 DevPilot: Avoid 'var'; use 'const' or 'let' for better scoping",
          vscode.DiagnosticSeverity.Hint
        );
        diag.source = "DevPilot Learning";
        diagnostics.push(diag);
      }

      // Suggest async/await over .then()
      const thenMatch = /\.then\(/.exec(line);
      if (thenMatch && !line.includes("//")) {
        const range = new vscode.Range(
          lineIndex,
          thenMatch.index,
          lineIndex,
          thenMatch.index + thenMatch[0].length
        );
        const diag = new vscode.Diagnostic(
          range,
          "🔧 DevPilot: Consider async/await instead of .then() for cleaner code",
          vscode.DiagnosticSeverity.Hint
        );
        diag.source = "DevPilot Learning";
        diagnostics.push(diag);
      }
    });

    this.diagnosticCollection.set(document.uri, diagnostics);
  }

  dispose(): void {
    this.diagnosticCollection.dispose();
  }
}

/**
 * Register learning hover provider with squiggle diagnostics
 */
export function registerLearningHoverProvider(
  context: vscode.ExtensionContext
): vscode.Disposable {
  const provider = new LearningHoverProvider();

  const hoverDisposable = vscode.languages.registerHoverProvider(
    { scheme: "file", pattern: "**/*.{js,ts,jsx,tsx,py,go,html,css}" },
    provider
  );

  // Update squiggle diagnostics on file open
  vscode.workspace.onDidOpenTextDocument((doc) => {
    if (
      ["javascript", "typescript", "javascriptreact", "typescriptreact"].includes(
        doc.languageId
      )
    ) {
      provider.provideSuggestionsForFile(doc);
    }
  });

  // Update squiggle diagnostics on text change
  vscode.workspace.onDidChangeTextDocument((event) => {
    if (
      ["javascript", "typescript", "javascriptreact", "typescriptreact"].includes(
        event.document.languageId
      )
    ) {
      provider.provideSuggestionsForFile(event.document);
    }
  });

  // Initial diagnostics for open files
  vscode.workspace.textDocuments.forEach((doc) => {
    if (
      ["javascript", "typescript", "javascriptreact", "typescriptreact"].includes(
        doc.languageId
      )
    ) {
      provider.provideSuggestionsForFile(doc);
    }
  });

  context.subscriptions.push(hoverDisposable, provider as any);
  logger.info("[DevPilot] Learning Hover Provider registered with squiggle diagnostics");

  return hoverDisposable;
}
