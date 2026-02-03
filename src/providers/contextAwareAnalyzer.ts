/**
 * DevPilot Context-Aware Code Analyzer
 * 
 * Analyzes code context to provide intelligent, context-specific suggestions
 * Not just static explanations - truly understands what the developer is doing
 */

import * as vscode from "vscode";
import { getLogger } from "../core/logger";

const logger = getLogger("ContextAwareAnalyzer");

export interface CodeContext {
  language: string;
  isAsync: boolean;
  hasErrors: boolean;
  patterns: string[];
  functionDepth: number;
  inLoop: boolean;
  inCondition: boolean;
  usesTypeScript: boolean;
  suggestedPatterns: SuggestionPattern[];
}

export interface SuggestionPattern {
  pattern: string;
  explanation: string;
  suggestion: string;
  severity: "info" | "hint" | "warning";
  fixes: QuickFix[];
}

export interface QuickFix {
  title: string;
  description: string;
  edit: (document: vscode.TextDocument, range: vscode.Range) => string;
}

/**
 * Context-aware pattern suggestions
 * These suggest improvements based on actual code context
 */
export class ContextAwareAnalyzer {
  /**
   * Analyze code context at a specific position
   */
  analyzeContext(
    document: vscode.TextDocument,
    position: vscode.Position
  ): CodeContext {
    const text = document.getText();
    const line = document.lineAt(position).text;
    const beforeCursor = document.getText(
      new vscode.Range(new vscode.Position(0, 0), position)
    );

    // Detect language
    const language = document.languageId;
    const usesTypeScript = language === "typescript" || language === "typescriptreact";

    // Detect patterns
    const patterns = this.detectPatterns(text, language);
    const isAsync = /async\s+(function|\(|=>|\w+)/.test(text);
    const hasErrors = /console\.error|throw|Error|catch/.test(text);
    const inLoop = this.isInLoop(beforeCursor);
    const inCondition = this.isInCondition(beforeCursor);
    const functionDepth = this.calculateFunctionDepth(beforeCursor);

    // Get suggested patterns based on context
    const suggestedPatterns = this.getSuggestedPatterns(
      line,
      language,
      isAsync,
      patterns,
      inLoop,
      inCondition
    );

    return {
      language,
      isAsync,
      hasErrors,
      patterns,
      functionDepth,
      inLoop,
      inCondition,
      usesTypeScript,
      suggestedPatterns,
    };
  }

  /**
   * Detect code patterns in the file
   */
  private detectPatterns(text: string, language: string): string[] {
    const patterns: string[] = [];

    // JavaScript/TypeScript patterns
    if (["javascript", "typescript", "javascriptreact", "typescriptreact"].includes(language)) {
      if (/\bvar\s+\w+/.test(text)) patterns.push("var-usage");
      if (/\.then\(/.test(text)) patterns.push("promise-chains");
      if (/\bfunction\s+\w+\s*\(/.test(text)) patterns.push("function-declarations");
      if (/const\s+\w+\s*=\s*\(.*\)\s*=>/.test(text)) patterns.push("arrow-functions");
      if (/async\s+function/.test(text)) patterns.push("async-functions");
      if (/class\s+\w+/.test(text)) patterns.push("class-declarations");
      if (/\bfor\s*\(/.test(text)) patterns.push("for-loops");
      if (/\bwhile\s*\(/.test(text)) patterns.push("while-loops");
      if (/\.map\(/.test(text)) patterns.push("array-map");
      if (/\.filter\(/.test(text)) patterns.push("array-filter");
      if (/\.reduce\(/.test(text)) patterns.push("array-reduce");
      if (/import\s+/.test(text)) patterns.push("es6-imports");
      if (/require\(/.test(text)) patterns.push("commonjs-requires");
      if (/\bawait\s+/.test(text)) patterns.push("await-usage");
    }

    // Python patterns
    if (language === "python") {
      if (/^def\s+\w+/.test(text)) patterns.push("function-def");
      if (/^class\s+\w+/.test(text)) patterns.push("class-def");
      if (/^import\s+/.test(text)) patterns.push("imports");
      if (/^from\s+\w+\s+import/.test(text)) patterns.push("from-imports");
      if (/\bfor\s+\w+\s+in\s+/.test(text)) patterns.push("for-loops");
      if (/\bwhile\s+/.test(text)) patterns.push("while-loops");
      if (/\btry\s*:/.test(text)) patterns.push("try-except");
      if (/\basync\s+def/.test(text)) patterns.push("async-def");
      if (/\bawait\s+/.test(text)) patterns.push("await-usage");
      if (/\blambda\s+/.test(text)) patterns.push("lambda-functions");
      if (/\bwith\s+open/.test(text)) patterns.push("file-operations");
      if (/\blist\s*\(/.test(text)) patterns.push("list-comprehension");
    }

    // Go patterns
    if (language === "go") {
      if (/^func\s+\(/.test(text)) patterns.push("method-def");
      if (/^func\s+\w+/.test(text)) patterns.push("function-def");
      if (/\bgo\s+/.test(text)) patterns.push("goroutines");
      if (/\bmake\s*\(/.test(text)) patterns.push("make-statement");
      if (/\bdefer\s+/.test(text)) patterns.push("defer-usage");
      if (/<-\s*\w+/.test(text)) patterns.push("channel-operations");
      if (/\bfor\s+/.test(text)) patterns.push("for-loops");
    }

    return patterns;
  }

  /**
   * Get context-aware suggestions based on code analysis
   */
  private getSuggestedPatterns(
    line: string,
    language: string,
    isAsync: boolean,
    patterns: string[],
    inLoop: boolean,
    inCondition: boolean
  ): SuggestionPattern[] {
    const suggestions: SuggestionPattern[] = [];

    // JavaScript/TypeScript suggestions
    if (["javascript", "typescript", "javascriptreact", "typescriptreact"].includes(language)) {
      // Suggest moving from var to const/let
      if (/\bvar\s+/.test(line)) {
        suggestions.push({
          pattern: "var-usage",
          explanation:
            "🔒 **var** has function-level scoping and can be redeclared, causing bugs. Modern code uses **const** or **let**.",
          suggestion: "Replace 'var' with 'const' (if value doesn't change) or 'let' (if it does)",
          severity: "warning",
          fixes: [
            {
              title: "Change var to const",
              description: "Replace 'var' with 'const'",
              edit: (doc, range) => "const" + doc.getText(range).substring(3),
            },
            {
              title: "Change var to let",
              description: "Replace 'var' with 'let'",
              edit: (doc, range) => "let" + doc.getText(range).substring(3),
            },
          ],
        });
      }

      // Suggest async/await over .then()
      if (/\.then\(/.test(line) && isAsync) {
        suggestions.push({
          pattern: "promise-chains",
          explanation:
            "⏸️ **Promise chains** with **.then()** can be hard to read. **async/await** makes async code look synchronous.",
          suggestion: "Consider refactoring to use async/await for cleaner code",
          severity: "hint",
          fixes: [
            {
              title: "Convert to async/await",
              description: "Refactor .then() to async/await",
              edit: (doc, range) => {
                const text = doc.getText(range);
                return text.replace(/\.then\(\s*(\w+)\s*=>\s*/, "const $1 = await ");
              },
            },
          ],
        });
      }

      // Suggest const for non-reassigned variables
      if (/\blet\s+\w+\s*=/.test(line)) {
        const beforeLine = line.substring(0, line.indexOf("let"));
        if (beforeLine.match(/let\s+(\w+)\s*=/)) {
          suggestions.push({
            pattern: "const-over-let",
            explanation:
              "📌 **let** allows reassignment, but if this variable never changes, **const** is safer and clearer.",
            suggestion: "Use 'const' when the variable won't be reassigned",
            severity: "info",
            fixes: [
              {
                title: "Change let to const",
                description: "Replace 'let' with 'const'",
                edit: (doc, range) => "const" + doc.getText(range).substring(3),
              },
            ],
          });
        }
      }

      // Loop-specific suggestions
      if (inLoop && /\.forEach\(/.test(line)) {
        suggestions.push({
          pattern: "forEach-usage",
          explanation:
            "👣 **.forEach()** is fine for simple loops, but **for...of** is often cleaner and more flexible.",
          suggestion: "Consider using 'for...of' for better readability",
          severity: "info",
          fixes: [],
        });
      }

      // Suggest filter over manual loops
      if (inLoop && /\.push\(/.test(line) && patterns.includes("for-loops")) {
        suggestions.push({
          pattern: "manual-filtering",
          explanation:
            "🔍 **Manual filtering** with loops is verbose. **.filter()** is more declarative and clear.",
          suggestion: "Consider refactoring to use .filter() for cleaner code",
          severity: "hint",
          fixes: [],
        });
      }
    }

    // Python suggestions
    if (language === "python") {
      if (/\bfor\s+\w+\s+in\s+range\(len/.test(line)) {
        suggestions.push({
          pattern: "range-len-antipattern",
          explanation:
            "🔄 **for i in range(len(x))** is the old way. Modern Python uses **for item in x** or **enumerate(x)**.",
          suggestion: "Use 'for item in list' directly or enumerate() if you need indices",
          severity: "warning",
          fixes: [],
        });
      }

      if (/\btry\s*:/.test(line) && !line.includes("except")) {
        suggestions.push({
          pattern: "bare-except",
          explanation:
            "🛡️ **Bare except** (catching all exceptions) can hide bugs. Catch specific exceptions instead.",
          suggestion: "Specify which exceptions to catch: except ValueError:",
          severity: "warning",
          fixes: [],
        });
      }
    }

    return suggestions;
  }

  /**
   * Check if cursor is inside a loop
   */
  private isInLoop(beforeCursor: string): boolean {
    const forCount = (beforeCursor.match(/\bfor\s+/g) || []).length;
    const whileCount = (beforeCursor.match(/\bwhile\s+/g) || []).length;
    const forEnd = (beforeCursor.match(/^(?!.*for)[^]*$/m) || [""])[0].split("\n").length;
    return forCount > 0 || whileCount > 0;
  }

  /**
   * Check if cursor is inside a condition
   */
  private isInCondition(beforeCursor: string): boolean {
    const ifCount = (beforeCursor.match(/\bif\s+/g) || []).length;
    const ifEnd = (beforeCursor.match(/[;}]/g) || []).length;
    return ifCount > ifEnd;
  }

  /**
   * Calculate function nesting depth
   */
  private calculateFunctionDepth(beforeCursor: string): number {
    const openBraces = (beforeCursor.match(/{/g) || []).length;
    const closeBraces = (beforeCursor.match(/}/g) || []).length;
    return Math.max(0, openBraces - closeBraces);
  }

  /**
   * Get learning tip based on context
   */
  getLearningTip(context: CodeContext): string {
    const tips: string[] = [];

    if (context.inLoop) {
      tips.push(
        "💡 **In a loop?** Consider using array methods like **.map()**, **.filter()**, or **.reduce()** instead of manual loops."
      );
    }

    if (context.inCondition) {
      tips.push(
        "💡 **Complex condition?** Break it into smaller conditions or extract to a function for clarity."
      );
    }

    if (context.isAsync && context.patterns.includes("promise-chains")) {
      tips.push(
        "💡 **Promise chains?** Use **async/await** to make asynchronous code easier to read and debug."
      );
    }

    if (context.usesTypeScript) {
      tips.push(
        "💡 **TypeScript tip:** Add type annotations to function parameters for better IDE support and type checking."
      );
    }

    if (context.functionDepth > 5) {
      tips.push(
        "💡 **Deeply nested code?** Consider extracting inner functions to separate methods for better readability."
      );
    }

    return tips.length > 0 ? tips[Math.floor(Math.random() * tips.length)] : "";
  }
}

/**
 * Singleton instance
 */
let analyzerInstance: ContextAwareAnalyzer | null = null;

export function getContextAwareAnalyzer(): ContextAwareAnalyzer {
  if (!analyzerInstance) {
    analyzerInstance = new ContextAwareAnalyzer();
  }
  return analyzerInstance;
}
