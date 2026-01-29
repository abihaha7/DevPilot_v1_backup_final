/**
 * DevPilot Hover Provider
 * Provides on-hover explanations using native heuristics
 * No LLM calls - purely deterministic
 */

import * as vscode from "vscode";
import { getHeuristic, searchHeuristics } from "../knowledge/heuristics";
import { getWordAtPosition, isInString, isInComment } from "../utils/utils";

export class HoverProvider implements vscode.HoverProvider {
  async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Promise<vscode.Hover | undefined> {
    // Don't provide hover in strings or comments
    const offset = document.offsetAt(position);
    const text = document.getText();

    if (isInString(text, offset) || isInComment(text, offset)) {
      return undefined;
    }

    // Get word at cursor
    const { word, start, end } = getWordAtPosition(
      text.substring(0, offset),
      offset
    );

    if (!word || word.length < 2) {
      return undefined;
    }

    // Try exact match first
    let heuristic = getHeuristic(word);

    // If no exact match, try searching
    if (!heuristic) {
      const matches = searchHeuristics(word);
      if (matches.length > 0) {
        heuristic = matches[0];
      }
    }

    if (!heuristic) {
      return undefined;
    }

    // Build hover content
    const content = new vscode.MarkdownString();
    content.appendMarkdown(`### \`${heuristic.name}\`\n\n`);
    content.appendMarkdown(`**${heuristic.category}** • ${heuristic.explanation}\n\n`);

    // Add examples if available
    if (heuristic.examples && heuristic.examples.length > 0) {
      content.appendMarkdown("**Examples:**\n\n");
      heuristic.examples.forEach((example) => {
        content.appendMarkdown(`\`\`\`javascript\n${example}\n\`\`\`\n\n`);
      });
    }

    // Add source indicator
    content.appendMarkdown("---\n");
    content.appendMarkdown("*DevPilot Native Mode • Deterministic Knowledge Base*");

    return new vscode.Hover(content);
  }
}

/**
 * Register hover provider for multiple languages
 */
export function registerHoverProvider(
  context: vscode.ExtensionContext
): vscode.Disposable {
  const hoverProvider = new HoverProvider();

  const languages = [
    "javascript",
    "typescript",
    "javascriptreact",
    "typescriptreact",
    "python",
    "java",
    "cpp",
    "csharp",
    "go",
  ];

  const disposables = languages.map((lang) =>
    vscode.languages.registerHoverProvider(lang, hoverProvider)
  );

  return vscode.Disposable.from(...disposables);
}
