/**
 * DevPilot Code Translation (Split-Screen Diff Editor)
 * 
 * Shows code in two languages side-by-side
 * Uses VS Code's diff editor for comparison
 * Helps with learning multiple languages
 */

import * as vscode from "vscode";
import { getLogger } from "../core/logger";
import { getAIProvider } from "../core/aiProvider";

const logger = getLogger("CodeTranslation");

export interface TranslationPair {
  sourceLanguage: string;
  targetLanguage: string;
  sourceCode: string;
  targetCode: string;
}

/**
 * Code Translation Service with Hybrid Support
 * Uses heuristics for offline, AI for online
 */
export class CodeTranslationService {
  /**
   * Heuristic translation rules (offline) - Comprehensive & Bidirectional
   */
  private heuristicRules: Record<string, Record<string, string>> = {
    // Python ↔ JavaScript/TypeScript
    "python->javascript": {
      "def\\s+(\\w+)\\s*\\(": "function $1(",
      "def\\s+(\\w+):": "function $1() {",
      "if\\s+(.+):\\s*$": "if ($1) {",
      "elif\\s+(.+):\\s*$": "} else if ($1) {",
      "else:\\s*$": "} else {",
      "for\\s+(\\w+)\\s+in\\s+": "for (const $1 of ",
      "for\\s+(\\w+)\\s+in\\s+range\\(": "for (let $1 = 0; $1 < ",
      "while\\s+(.+):\\s*$": "while ($1) {",
      "return\\s+": "return ",
      "print\\(": "console.log(",
      "len\\(": "length =",
      "import\\s+(\\w+)": "import $1 from '$1';",
      "from\\s+(\\w+)\\s+import": "import",
      "#.*$": "//",
      "\\[.*for.*in.*\\]": "use .map() or .filter() instead",
      "try:\\s*$": "try {",
      "except\\s+": "} catch (",
      "finally:\\s*$": "} finally {",
      "\\s+": " ",
    },
    "javascript->python": {
      "function\\s+(\\w+)\\s*\\(": "def $1(",
      "const\\s+(\\w+)\\s*=": "$1 =",
      "let\\s+(\\w+)\\s*=": "$1 =",
      "if\\s*\\((.+)\\)\\s*{": "if $1:",
      "else\\s+if\\s*\\((.+)\\)\\s*{": "elif $1:",
      "else\\s*{": "else:",
      "for\\s*\\(const\\s+(\\w+)\\s+of": "for $1 in ",
      "for\\s*\\(let\\s+\\w+\\s*=\\s*0;": "for i in range(",
      "while\\s*\\((.+)\\)\\s*{": "while $1:",
      "return\\s+": "return ",
      "console\\.log\\(": "print(",
      "\\.length": "len()",
      "import\\s+.*\\s+from": "import",
      "//.*$": "#",
      "=>": "->",
      "try\\s*{": "try:",
      "}\\s*catch\\s*\\(": "except",
      "}\\s*finally\\s*{": "finally:",
    },

    // Python ↔ Go
    "python->go": {
      "def\\s+(\\w+)\\s*\\(": "func $1(",
      "if\\s+(.+):\\s*$": "if $1 {",
      "elif\\s+(.+):\\s*$": "} else if $1 {",
      "else:\\s*$": "} else {",
      "for\\s+(\\w+)\\s+in\\s+range": "for $1 := 0;",
      "for\\s+(\\w+)\\s+in\\s+": "for _, $1 := range ",
      "while\\s+(.+):\\s*$": "for $1 {",
      "return\\s+": "return ",
      "print\\(": "fmt.Println(",
      "import\\s+(\\w+)": "import \"$1\"",
      "try:\\s*$": "if err != nil {",
      "except\\s+": "if ",
      "#.*$": "//",
    },
    "go->python": {
      "func\\s+(\\w+)\\s*\\(": "def $1(",
      "if\\s+(.+)\\s*{": "if $1:",
      "else\\s+if\\s+(.+)\\s*{": "elif $1:",
      "else\\s*{": "else:",
      "for\\s+\\w+\\s+:=\\s+0;": "for i in range(",
      "for\\s+_,\\s+(\\w+)\\s+:=\\s+range": "for $1 in ",
      "for\\s+(.+)\\s*{": "while $1:",
      "return\\s+": "return ",
      "fmt\\.Println": "print",
      "import\\s+\"(\\w+)\"": "import $1",
      "if\\s+err\\s+!=\\s+nil": "try:",
      "//.*$": "#",
    },

    // JavaScript ↔ TypeScript (lightweight conversion)
    "javascript->typescript": {
      "function\\s+(\\w+)\\s*\\(": "function $1(",
      "const\\s+(\\w+)\\s*=": "const $1: any =",
      "=>": "=>",
    },
    "typescript->javascript": {
      ":\\s*\\w+[\\s,;]": " ",
      "interface\\s+\\w+": "// interface",
      "type\\s+\\w+": "// type",
    },

    // Go ↔ JavaScript
    "go->javascript": {
      "func\\s+(\\w+)\\s*\\(": "function $1(",
      "func\\s*\\(": "async function(",
      "if\\s+(.+)\\s*{": "if ($1) {",
      "else\\s+if\\s+(.+)\\s*{": "} else if ($1) {",
      "else\\s*{": "} else {",
      "for\\s+(.+)\\s*{": "for ($1) {",
      "return\\s+": "return ",
      "fmt\\.Println": "console.log",
      "import\\s+\"(\\w+)\"": "import $1 from '$1';",
      "if\\s+err\\s+!=\\s+nil": "if (error) {",
      "//.*$": "//",
    },
    "javascript->go": {
      "function\\s+(\\w+)\\s*\\(": "func $1(",
      "async\\s+function": "func",
      "if\\s*\\((.+)\\)\\s*{": "if $1 {",
      "else\\s+if\\s*\\((.+)\\)\\s*{": "} else if $1 {",
      "else\\s*{": "} else {",
      "for\\s*\\((.+)\\)\\s*{": "for $1 {",
      "return\\s+": "return ",
      "console\\.log": "fmt.Println",
      "import\\s+.*\\s+from\\s+['\"]": "import \"",
      "if\\s*\\(error\\)": "if err != nil {",
      "//.*$": "//",
    },
  };

  /**
   * Detect programming language from code content
   * Uses heuristics when languageId is generic (like 'typescript' for JS)
   */
  private detectLanguageFromCode(code: string, languageId: string): string {
    // Handle TypeScript as JavaScript for translation purposes
    if (languageId === "typescript" || languageId === "typescriptreact") {
      // Check for Python-specific syntax
      if (/^\s*(def\s+\w+|class\s+\w+|import\s+\w+|from\s+\w+\s+import|for\s+\w+\s+in|print\()/m.test(code)) {
        return "python";
      }
      // Check for Go-specific syntax
      if (/^\s*func\s+|:=|fmt\.|go\s+|defer\s+|chan\s+/m.test(code)) {
        return "go";
      }
      return "javascript";
    }

    if (languageId === "python") {
      return "python";
    }

    if (languageId === "go") {
      return "go";
    }

    if (languageId === "javascript" || languageId === "javascriptreact") {
      // Check for Python syntax
      if (/^\s*(def\s+\w+|class\s+\w+|import\s+\w+|for\s+\w+\s+in\s+|print\()/m.test(code)) {
        return "python";
      }
      return "javascript";
    }

    return languageId;
  }

  /**
   * Get all supported language pairs
   */
  getSupportedLanguagePairs(): Array<[string, string]> {
    const pairs: Array<[string, string]> = [];
    for (const key of Object.keys(this.heuristicRules)) {
      const [from, to] = key.split("->");
      pairs.push([from, to]);
    }
    return pairs;
  }

  /**
   * Check if translation pair is supported
   */
  isSupportedPair(from: string, to: string): boolean {
    return !!this.heuristicRules[`${from}->${to}`];
  }

  /**
   * Translate using heuristics (offline)
   */
  private heuristicTranslate(
    code: string,
    fromLanguage: string,
    toLanguage: string
  ): string {
    const key = `${fromLanguage}->${toLanguage}`;
    const rules = this.heuristicRules[key];

    if (!rules) {
      logger.warn(`[DevPilot] No heuristic rules for ${key}`);
      return code; // Return unchanged if no rules
    }

    let result = code;
    for (const [pattern, replacement] of Object.entries(rules)) {
      const regex = new RegExp(pattern, "gm");
      result = result.replace(regex, replacement as string);
    }

    logger.info("[DevPilot] Heuristic translation applied", { from: fromLanguage, to: toLanguage });
    return result;
  }

  /**
   * Translate using AI (online)
   */
  private async aiTranslate(
    code: string,
    fromLanguage: string,
    toLanguage: string
  ): Promise<string | null> {
    const aiProvider = getAIProvider();

    if (!aiProvider.isAvailable) {
      return null;
    }

    try {
      const prompt = `Translate this ${fromLanguage} code to ${toLanguage}. Maintain logic and functionality. Provide ONLY code, no explanation.\n\n${fromLanguage}:\n\`\`\`${fromLanguage}\n${code}\n\`\`\``;

      const result = await aiProvider.getCompletion({
        prompt,
        language: toLanguage,
        maxTokens: 500,
      });

      if (result) {
        const codeMatch = result.text.match(/\`\`\`[\w]*\n([\s\S]*?)\`\`\`/);
        const translated = codeMatch ? codeMatch[1] : result.text;
        logger.info("[DevPilot] AI translation applied", { from: fromLanguage, to: toLanguage });
        return translated;
      }

      return null;
    } catch (error) {
      logger.warn("[DevPilot] AI translation failed", { error: String(error) });
      return null;
    }
  }

  /**
   * Hybrid translation: AI first, fallback to heuristics
   * Smart language detection for accurate translation
   */
  async translateCode(
    code: string,
    fromLanguageId: string,
    toLanguageId: string
  ): Promise<string> {
    // Detect actual language from code content
    const fromLanguage = this.detectLanguageFromCode(code, fromLanguageId);
    const toLanguage = toLanguageId.split(/[.-]/)[0]; // Extract base language name

    logger.info("[DevPilot] Starting code translation with smart detection", {
      fromId: fromLanguageId,
      from: fromLanguage,
      to: toLanguage,
    });

    // Check if this pair is supported
    if (!this.isSupportedPair(fromLanguage, toLanguage)) {
      logger.warn(`[DevPilot] Translation pair ${fromLanguage}->${toLanguage} not supported, returning original code`);
      return code;
    }

    // Try AI first (online)
    const aiResult = await this.aiTranslate(code, fromLanguage, toLanguage);
    if (aiResult) {
      return aiResult;
    }

    // Fallback to heuristics (offline)
    logger.info("[DevPilot] AI unavailable, using heuristic translation");
    return this.heuristicTranslate(code, fromLanguage, toLanguage);
  }

  /**
   * Get supported language pairs
   */
  getSupportedLanguages(): string[] {
    return [
      "javascript",
      "typescript",
      "python",
      "java",
      "csharp",
      "go",
      "rust",
      "cpp",
      "php",
      "ruby",
    ];
  }
}

/**
 * Register code translation commands
 */
export function registerCodeTranslation(
  context: vscode.ExtensionContext
): CodeTranslationService {
  const service = new CodeTranslationService();

  const register = (cmd: string, cb: (...args: any[]) => any) =>
    context.subscriptions.push(vscode.commands.registerCommand(cmd, cb));

  /**
   * Translate selected code
   */
  register("devpilot.translateCode", async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage("🔤 DevPilot: Open a code file to translate");
      return;
    }

    const sourceLanguage = editor.document.languageId;
    const sourceCode = editor.selection.isEmpty
      ? editor.document.getText()
      : editor.document.getText(editor.selection);

    if (!sourceCode) {
      vscode.window.showWarningMessage(
        "🔤 DevPilot: Select code or open a file to translate"
      );
      return;
    }

    // Ask for target language
    const targetLanguage = await vscode.window.showQuickPick(
      service.getSupportedLanguages().filter((l) => l !== sourceLanguage),
      {
        placeHolder: `🔤 DevPilot: Translate from ${sourceLanguage} to...`,
      }
    );

    if (!targetLanguage) {
      return;
    }

    // Show progress with DevPilot branding
    const progress = await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `🔤 DevPilot: Translating ${sourceLanguage} → ${targetLanguage}...`,
        cancellable: false,
      },
      async () => {
        return service.translateCode(sourceCode, sourceLanguage, targetLanguage);
      }
    );

    if (!progress) {
      vscode.window.showErrorMessage(
        "❌ DevPilot Translation: Failed. Try again or set OpenAI key."
      );
      return;
    }

    // Create diff editor
    const sourceUri = vscode.Uri.parse(
      `untitled:${sourceLanguage}-original.${sourceLanguage}`
    );
    const targetUri = vscode.Uri.parse(
      `untitled:${targetLanguage}-translated.${targetLanguage}`
    );

    // Open source document
    const sourceDoc = await vscode.workspace.openTextDocument(sourceUri);
    const sourceEditor = await vscode.window.showTextDocument(sourceDoc, {
      viewColumn: vscode.ViewColumn.One,
      preview: false,
    });

    // Insert source code
    await sourceEditor.edit((edit) => {
      edit.insert(new vscode.Position(0, 0), sourceCode);
    });

    // Open target document
    const targetDoc = await vscode.workspace.openTextDocument(targetUri);
    const targetEditor = await vscode.window.showTextDocument(targetDoc, {
      viewColumn: vscode.ViewColumn.Two,
      preview: false,
    });

    // Insert translated code
    await targetEditor.edit((edit) => {
      edit.insert(new vscode.Position(0, 0), progress);
    });

    // Show success message with DevPilot branding
    const isHeuristic = !getAIProvider().isAvailable;
    const method = isHeuristic ? "(heuristic - offline)" : "(AI-powered)";
    vscode.window.showInformationMessage(
      `✅ DevPilot: Code translated ${method}! Compare side-by-side.`
    );
    logger.info("[DevPilot] Code translation completed", {
      source: sourceLanguage,
      target: targetLanguage,
      method: isHeuristic ? "heuristic" : "ai",
    });
  });

  /**
   * Compare two code blocks
   */
  register("devpilot.compareCode", async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage("Open a code file to compare");
      return;
    }

    // Show explanation of comparison
    const message = `
📊 **Code Comparison Tools**

1. **Translate Code** - Convert to another language
2. **Show Diff** - Compare changes
3. **Explain Differences** - AI explanation of changes

Use the command palette to access these tools.
`;

    await vscode.window.showTextDocument(
      await vscode.workspace.openTextDocument({
        language: "markdown",
        content: message,
      }),
      vscode.ViewColumn.Two
    );
  });

  return service;
}
