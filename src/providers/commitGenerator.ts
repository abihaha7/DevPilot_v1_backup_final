/**
 * DevPilot Commit Message Generator
 * 
 * Integrates with VS Code Source Control input box
 * Provides quick commit message generation from git diff
 * Works inline without requiring a webview
 */

import * as vscode from "vscode";
import * as path from "path";
import simpleGit from "simple-git";
import { getLogger } from "../core/logger";
import { getAIProvider } from "../core/aiProvider";
import {
  analyzeDiff,
  generateCommitMessage as generateNativeCommit,
  generateQuickCommitMessage as generateNativeQuickCommit,
} from "../services/commits";

const logger = getLogger("CommitGenerator");

/**
 * Commit Generator Service
 * 
 * Handles all commit message generation logic
 */
export class CommitGeneratorService {
  private lastDiff: string = "";
  private lastAnalysis: any = null;

  /**
   * Get current git diff
   */
  async getCurrentDiff(): Promise<string> {
    try {
      const git = simpleGit();
      const diff = await git.diff();
      this.lastDiff = diff;
      return diff;
    } catch (error) {
      logger.warn("Failed to get git diff", { error: String(error) });
      return "";
    }
  }

  /**
   * Analyze diff for patterns
   */
  private analyzeDiff(diff: string): any {
    try {
      const analysis = analyzeDiff(diff);
      this.lastAnalysis = analysis;
      return analysis;
    } catch (error) {
      logger.error("Failed to analyze diff", { error: String(error) });
      return null;
    }
  }

  /**
   * Generate commit message using native analysis
   */
  async generateCommitMessage(useAI: boolean = false): Promise<string | null> {
    try {
      const diff = await this.getCurrentDiff();

      if (!diff) {
        return null;
      }

      // Always try native first (fast, offline)
      const native = generateNativeCommit(diff);
      if (!useAI || !native.startsWith("(fallback)")) {
        return native;
      }

      // If AI requested and available
      const aiProvider = getAIProvider();
      if (aiProvider.isAvailable) {
        const aiMessage = await aiProvider.generateCommitMessage({ diff });
        if (aiMessage) {
          return aiMessage;
        }
      }

      return native;
    } catch (error) {
      logger.error("Commit generation failed", { error: String(error) });
      return null;
    }
  }

  /**
   * Generate quick subject line only
   */
  async generateQuickCommit(useAI: boolean = false): Promise<string | null> {
    try {
      const diff = await this.getCurrentDiff();

      if (!diff) {
        return null;
      }

      // Native first
      const native = generateNativeQuickCommit(diff);
      if (!useAI) {
        return native;
      }

      // AI if requested
      const aiProvider = getAIProvider();
      if (aiProvider.isAvailable) {
        const aiMessage = await aiProvider.generateQuickCommit({ diff });
        if (aiMessage) {
          return aiMessage;
        }
      }

      return native;
    } catch (error) {
      logger.error("Quick commit generation failed", { error: String(error) });
      return null;
    }
  }

  /**
   * Get commit suggestions (3-5 variations)
   */
  async getCommitSuggestions(): Promise<string[]> {
    try {
      const diff = await this.getCurrentDiff();

      if (!diff) {
        return [];
      }

      const analysis = this.analyzeDiff(diff);
      if (!analysis) {
        return [];
      }

      const suggestions: string[] = [];

      // Generate variations based on detected keywords
      const keywords = Array.from(analysis.keywords).slice(0, 3);

      for (const keyword of keywords) {
        const keywordStr = String(keyword);
        const type = keywordStr.charAt(0).toUpperCase() + keywordStr.slice(1).toLowerCase();
        const scopeHint = analysis.filesModified[0]
          ? `(${path.basename(analysis.filesModified[0]).split(".")[0]})`
          : "";

        if (analysis.addedLines > analysis.deletedLines * 2) {
          suggestions.push(`feat${scopeHint}: Add ${keyword} support`);
        } else if (analysis.deletedLines > 0) {
          suggestions.push(`refactor${scopeHint}: Improve ${keyword} handling`);
        } else {
          suggestions.push(`chore${scopeHint}: Update ${keyword} logic`);
        }
      }

      return suggestions.slice(0, 5);
    } catch (error) {
      logger.error("Failed to get suggestions", { error: String(error) });
      return [];
    }
  }
}

/**
 * Register commit generator commands
 */
export function registerCommitGeneratorCommands(
  context: vscode.ExtensionContext
): CommitGeneratorService {
  const service = new CommitGeneratorService();

  const register = (cmd: string, cb: (...args: any[]) => any) =>
    context.subscriptions.push(vscode.commands.registerCommand(cmd, cb));

  /**
   * Generate and suggest commit message
   */
  register("devpilot.generateCommitMessage", async () => {
    try {
      const scmInput = vscode.window.visibleTextEditors.find(
        (e) => e.document.languageId === "scminput"
      );

      if (!scmInput) {
        vscode.window.showWarningMessage(
          "Open Source Control panel and focus commit input to generate message"
        );
        return;
      }

      const message = await service.generateCommitMessage(false);

      if (message) {
        // Insert into SCM input
        const editor = scmInput;
        const doc = editor.document;
        const range = new vscode.Range(
          0,
          0,
          doc.lineCount - 1,
          doc.lineAt(doc.lineCount - 1).text.length
        );

        const edit = new vscode.WorkspaceEdit();
        edit.replace(doc.uri, range, message);
        await vscode.workspace.applyEdit(edit);

        vscode.window.showInformationMessage(
          "✅ Commit message generated and inserted"
        );
        logger.info("Commit message inserted into SCM input");
      } else {
        vscode.window.showInformationMessage(
          "No changes to commit. Stage files first."
        );
      }
    } catch (error) {
      logger.error("Commit generation failed", { error: String(error) });
      vscode.window.showErrorMessage(
        "Failed to generate commit message. Check logs."
      );
    }
  });

  /**
   * Show commit message suggestions
   */
  register("devpilot.showCommitSuggestions", async () => {
    try {
      const suggestions = await service.getCommitSuggestions();

      if (suggestions.length === 0) {
        vscode.window.showInformationMessage(
          "No staged changes. Stage files to see suggestions."
        );
        return;
      }

      const selected = await vscode.window.showQuickPick(suggestions, {
        placeHolder: "Select a commit message template",
      });

      if (selected) {
        const scmInput = vscode.window.visibleTextEditors.find(
          (e) => e.document.languageId === "scminput"
        );

        if (scmInput) {
          const doc = scmInput.document;
          const range = new vscode.Range(
            0,
            0,
            doc.lineCount - 1,
            doc.lineAt(doc.lineCount - 1).text.length
          );

          const edit = new vscode.WorkspaceEdit();
          edit.replace(doc.uri, range, selected);
          await vscode.workspace.applyEdit(edit);

          logger.info("Commit suggestion inserted", { suggestion: selected });
        }
      }
    } catch (error) {
      logger.error("Failed to show suggestions", { error: String(error) });
    }
  });

  /**
   * Quick analyze staged changes
   */
  register("devpilot.analyzeStagedChanges", async () => {
    try {
      const diff = await service.getCurrentDiff();

      if (!diff) {
        vscode.window.showInformationMessage("No staged changes to analyze.");
        return;
      }

      const analysis = service["lastAnalysis"] || analyzeDiff(diff);

      const firstKeyword = Array.from(analysis.keywords)[0];
      const message = `
📊 **Staged Changes Analysis**

📝 **Files Modified**: ${analysis.filesModified.length}
✨ **Files Added**: ${analysis.filesAdded.length}
➕ **Lines Added**: ${analysis.addedLines}
➖ **Lines Deleted**: ${analysis.deletedLines}
🏷️ **Keywords**: ${Array.from(analysis.keywords).join(", ") || "none"}

**Detected Change Type**: ${String(firstKeyword).toUpperCase() || "refactor"}
`;

      vscode.window.showInformationMessage(message, { modal: true });
    } catch (error) {
      logger.error("Analysis failed", { error: String(error) });
    }
  });

  return service;
}
