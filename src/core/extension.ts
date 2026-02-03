/**
 * DevPilot Extension Entry Point (Refactored)
 * 
 * Editor-first, native VS Code APIs
 * All features integrated without heavy webviews
 * Marketplace-grade, Codespaces-optimized
 */

import * as vscode from "vscode";
import { getLogger, initializeLogging } from "./logger";
import { registerGlobalErrorHandler } from "./errorHandler";
import { initializeStateManager } from "./stateManager";
import { initializeWorkspaceContext } from "./workspaceContext";
import { NullAIProvider, setAIProvider, getAIProvider } from "./aiProvider";
import { OpenAIProvider } from "./openaiProvider";

// Native providers (editor-integrated)
import { registerLearningHoverProvider } from "../providers/learningHover";
import { registerInlineCompletionProvider } from "../providers/inline";
import { registerTodoTracker } from "../providers/todoTracker";
import { registerCommitGeneratorCommands } from "../providers/commitGenerator";
import { registerLearningTreeView } from "../providers/learningTreeView";
import { registerCodeTranslation } from "../providers/codeTranslation";
import { registerAchievements } from "../providers/achievements";
import { registerRefactoringCodeActionProvider } from "../providers/refactoringCodeAction";

// Phase 3 providers
import { registerPhase3Commands } from "../providers/phase3Commands";
import { registerWelcomeSidebar } from "../providers/welcomeSidebar";
import { registerTODOWorkflow } from "../providers/todoWorkflow";
import { registerInlineSuggestionsProvider } from "../providers/inlineSuggestions";

// Phase 4 providers
import { registerDashboardPanel } from "../providers/dashboardPanel";
import { registerTodoCommentParser } from "../providers/todoCommentParser";
import { registerEditorDecorations } from "../providers/editorDecorations";
import { registerHoverProviders } from "../providers/hoverProvider";
import { registerCodeLensProviders } from "../providers/codeLensProvider";
import { registerSuggestionFilter } from "../providers/suggestionFilter";
import { registerAchievementSystem } from "../providers/achievementSystem";

// UI providers
import { MinimalSidebarProvider } from "../providers/minimalSidebar";

// Services
import { GoogleAuthService } from "./authService";

const logger = getLogger("DevPilot");

// Global webview references for broadcaster pattern
let sidebarWebview: vscode.Webview | null = null;
let overlayWebview: vscode.Webview | null = null;
let rightDashboardWebview: vscode.Webview | null = null;

export function attachSidebar(view: vscode.WebviewView): void {
  sidebarWebview = view.webview;
}

export function attachOverlay(view: vscode.WebviewView): void {
  overlayWebview = view.webview;
}

export function attachRightDashboard(webview: vscode.Webview | null): void {
  rightDashboardWebview = webview;
}

/* ============================================================================
   EXTENSION ACTIVATION
   ============================================================================ */

export async function activate(context: vscode.ExtensionContext) {
  console.log("✨ DevPilot activating...");

  // Initialize infrastructure
  initializeLogging(context);
  registerGlobalErrorHandler();
  initializeStateManager(context);
  initializeWorkspaceContext();

  logger.info("DevPilot extension starting");

  /* ========== Initialize Services ==========*/

  // Auth service (manages learning progress)
  const authService = new GoogleAuthService(context);

  // AI Provider (start with offline mode)
  setAIProvider(new NullAIProvider());

  // Check for saved OpenAI key
  const openaiKey = context.globalState.get<string>("devpilot.openaiKey");
  if (openaiKey) {
    try {
      const aiProvider = new OpenAIProvider(openaiKey);
      if (aiProvider.isReady()) {
        setAIProvider(aiProvider);
        logger.info("OpenAI provider initialized");
      }
    } catch (error) {
      logger.warn("Failed to initialize OpenAI", { error: String(error) });
    }
  }

  /* ========== Register Native Providers ==========*/

  // Learning hover explanations (inline)
  try {
    const hoverDisposable = registerLearningHoverProvider(context);
    context.subscriptions.push(hoverDisposable);
    logger.info("Learning hover provider registered");
  } catch (error) {
    logger.warn("Failed to register hover provider", { error: String(error) });
  }

  // Inline completions (context-aware, learning-focused)
  try {
    const inlineDisposable = registerInlineCompletionProvider(context);
    context.subscriptions.push(inlineDisposable);
    logger.info("Inline completion provider registered");
  } catch (error) {
    logger.warn("Failed to register inline provider", { error: String(error) });
  }

  // TODO tracker (CodeLens + Diagnostics)
  try {
    const todoDisposable = registerTodoTracker(context);
    context.subscriptions.push(todoDisposable);
    logger.info("TODO tracker registered");
  } catch (error) {
    logger.warn("Failed to register TODO tracker", { error: String(error) });
  }

  /* ========== Register Commands ==========*/

  // Commit message generation (native + AI)
  try {
    registerCommitGeneratorCommands(context);
    logger.info("Commit generator registered");
  } catch (error) {
    logger.warn("Failed to register commit generator", { error: String(error) });
  }

  // Code translation (split-screen)
  try {
    registerCodeTranslation(context);
    logger.info("Code translation registered");
  } catch (error) {
    logger.warn("Failed to register code translation", { error: String(error) });
  }

  // Refactoring code action provider (lightbulb for refactorings)
  try {
    registerRefactoringCodeActionProvider(context);
    logger.info("Refactoring code action provider registered");
  } catch (error) {
    logger.warn("Failed to register refactoring code action provider", {
      error: String(error),
    });
  }

  // Learning TreeView
  try {
    registerLearningTreeView(context);
    logger.info("Learning TreeView registered");
  } catch (error) {
    logger.warn("Failed to register learning TreeView", { error: String(error) });
  }

  // Achievements and badges
  try {
    registerAchievements(context, authService);
    logger.info("Achievements system registered");
  } catch (error) {
    logger.warn("Failed to register achievements", { error: String(error) });
  }

  // Phase 3: Command Palette Integration
  try {
    registerPhase3Commands(context, {
      onOpenChatbot: () => {
        vscode.commands.executeCommand("devpilot.focus");
      },
      onOpenQuiz: () => {
        vscode.commands.executeCommand("devpilot.focus");
      },
      onOpenHelp: () => {
        // Help opens in separate webview
      },
    });
    logger.info("Phase 3 commands registered");
  } catch (error) {
    logger.warn("Failed to register Phase 3 commands", { error: String(error) });
  }

  // Phase 3: Welcome Sidebar
  try {
    registerWelcomeSidebar(context);
    logger.info("Welcome sidebar registered");
  } catch (error) {
    logger.warn("Failed to register welcome sidebar", { error: String(error) });
  }

  // Phase 3: TODO Workflow System
  try {
    registerTODOWorkflow(context);
    logger.info("TODO workflow system registered");
  } catch (error) {
    logger.warn("Failed to register TODO workflow", { error: String(error) });
  }

  // Phase 3: Inline Suggestions with Heuristics
  try {
    const suggestionsDisposable = registerInlineSuggestionsProvider(context);
    context.subscriptions.push(suggestionsDisposable);
    logger.info("Inline suggestions provider registered");
  } catch (error) {
    logger.warn("Failed to register inline suggestions", { error: String(error) });
  }

  // Phase 4: Unified Dashboard Panel
  try {
    registerDashboardPanel(context);
    logger.info("Dashboard panel registered");
  } catch (error) {
    logger.warn("Failed to register dashboard panel", { error: String(error) });
  }

  // Phase 4: TODO Comment Parser
  try {
    registerTodoCommentParser(context);
    logger.info("TODO comment parser registered");
  } catch (error) {
    logger.warn("Failed to register TODO comment parser", { error: String(error) });
  }

  // Phase 4: Editor Decorations
  try {
    registerEditorDecorations(context);
    logger.info("Editor decorations registered");
  } catch (error) {
    logger.warn("Failed to register editor decorations", { error: String(error) });
  }

  // Phase 4: Hover Providers
  try {
    registerHoverProviders(context);
    logger.info("Hover providers registered");
  } catch (error) {
    logger.warn("Failed to register hover providers", { error: String(error) });
  }

  // Phase 4: CodeLens Providers
  try {
    registerCodeLensProviders(context);
    logger.info("CodeLens providers registered");
  } catch (error) {
    logger.warn("Failed to register CodeLens providers", { error: String(error) });
  }

  // Phase 4: Suggestion Filter
  try {
    registerSuggestionFilter(context);
    logger.info("Suggestion filter registered");
  } catch (error) {
    logger.warn("Failed to register suggestion filter", { error: String(error) });
  }

  // Phase 4: Achievement System
  try {
    registerAchievementSystem(context);
    logger.info("Achievement system registered");
  } catch (error) {
    logger.warn("Failed to register achievement system", { error: String(error) });
  }

  /* ========== Register UI Components ==========*/

  // Minimal sidebar (navigation only)
  const sidebar = new MinimalSidebarProvider(context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      MinimalSidebarProvider.viewType,
      sidebar
    )
  );
  logger.info("Minimal sidebar provider registered");

  /* ========== Core Commands ==========*/

  const register = (cmd: string, cb: (...args: any[]) => any) =>
    context.subscriptions.push(vscode.commands.registerCommand(cmd, cb));

  // Quick Fix: Remove unused variable
  register("devpilot.removeUnusedVariable", async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage("No active editor");
      return;
    }

    try {
      const selection = editor.selection;
      const selectedText = editor.document.getText(selection);
      const newText = selectedText
        .replace(/const\s+\w+\s*=\s*/, "")
        .replace(/let\s+\w+\s*=\s*/, "");

      const edit = new vscode.WorkspaceEdit();
      edit.replace(editor.document.uri, selection, newText);
      await vscode.workspace.applyEdit(edit);

      vscode.window.showInformationMessage("✅ Removed unused variable");
      logger.info("Unused variable removed via quick fix");
    } catch (error) {
      logger.error("Failed to remove unused variable", { error: String(error) });
      vscode.window.showErrorMessage("Failed to remove unused variable");
    }
  });

  // Quick Fix: Add type annotation
  register("devpilot.addTypeAnnotation", async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage("No active editor");
      return;
    }

    try {
      const selection = editor.selection;
      const selectedText = editor.document.getText(selection);

      // Simple heuristic: detect variable type from assignment
      if (selectedText.includes("=")) {
        let typeAnnotation = ": any";

        if (selectedText.includes('"') || selectedText.includes("'")) {
          typeAnnotation = ": string";
        } else if (selectedText.includes("[")) {
          typeAnnotation = ": any[]";
        } else if (selectedText.includes("{")) {
          typeAnnotation = ": Record<string, any>";
        } else if (!isNaN(Number(selectedText.split("=")[1]))) {
          typeAnnotation = ": number";
        }

        const newText = selectedText.replace(/(\w+)(\s*)=/, `$1${typeAnnotation}$2=`);
        const edit = new vscode.WorkspaceEdit();
        edit.replace(editor.document.uri, selection, newText);
        await vscode.workspace.applyEdit(edit);

        vscode.window.showInformationMessage(`✅ Added type annotation: ${typeAnnotation}`);
        logger.info("Type annotation added via quick fix", { type: typeAnnotation });
      }
    } catch (error) {
      logger.error("Failed to add type annotation", { error: String(error) });
      vscode.window.showErrorMessage("Failed to add type annotation");
    }
  });

  // Quick Fix: Fix type mismatch
  register("devpilot.fixTypeMismatch", async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage("No active editor");
      return;
    }

    try {
      const selection = editor.selection;
      const selectedText = editor.document.getText(selection);

      // Simple fix: add type conversion
      let fixed = selectedText;
      if (selectedText.includes("number") && selectedText.includes('"')) {
        fixed = `parseInt(${selectedText})`;
      } else if (selectedText.includes("string")) {
        fixed = `String(${selectedText})`;
      } else if (selectedText.includes("boolean")) {
        fixed = `Boolean(${selectedText})`;
      }

      const edit = new vscode.WorkspaceEdit();
      edit.replace(editor.document.uri, selection, fixed);
      await vscode.workspace.applyEdit(edit);

      vscode.window.showInformationMessage("✅ Fixed type mismatch");
      logger.info("Type mismatch fixed via quick fix");
    } catch (error) {
      logger.error("Failed to fix type mismatch", { error: String(error) });
      vscode.window.showErrorMessage("Failed to fix type mismatch");
    }
  });

  // Quick Fix: Add await
  register("devpilot.addAwait", async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage("No active editor");
      return;
    }

    try {
      const selection = editor.selection;
      const selectedText = editor.document.getText(selection);

      if (!selectedText.trim().startsWith("await ")) {
        const newText = `await ${selectedText}`;
        const edit = new vscode.WorkspaceEdit();
        edit.replace(editor.document.uri, selection, newText);
        await vscode.workspace.applyEdit(edit);

        vscode.window.showInformationMessage("✅ Added await keyword");
        logger.info("Await keyword added via quick fix");
      }
    } catch (error) {
      logger.error("Failed to add await", { error: String(error) });
      vscode.window.showErrorMessage("Failed to add await");
    }
  });

  // Quick Fix: Add optional chaining
  register("devpilot.addOptionalChaining", async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage("No active editor");
      return;
    }

    try {
      const selection = editor.selection;
      const selectedText = editor.document.getText(selection);

      // Replace . with ?. for optional chaining
      if (selectedText.includes(".") && !selectedText.includes("?.")) {
        const newText = selectedText.replace(/\.(?!\.)/g, "?.");
        const edit = new vscode.WorkspaceEdit();
        edit.replace(editor.document.uri, selection, newText);
        await vscode.workspace.applyEdit(edit);

        vscode.window.showInformationMessage("✅ Added optional chaining");
        logger.info("Optional chaining added via quick fix");
      }
    } catch (error) {
      logger.error("Failed to add optional chaining", { error: String(error) });
      vscode.window.showErrorMessage("Failed to add optional chaining");
    }
  });

  // Set OpenAI API Key
  register("devpilot.setOpenAIKey", async () => {
    const key = await vscode.window.showInputBox({
      prompt: "Enter your OpenAI API key",
      password: true,
      title: "DevPilot: Set OpenAI API Key",
    });

    if (key) {
      await context.globalState.update("devpilot.openaiKey", key);
      try {
        const provider = new OpenAIProvider(key);
        if (provider.isReady()) {
          setAIProvider(provider);
          vscode.window.showInformationMessage(
            "✅ OpenAI API key set successfully!"
          );
          logger.info("OpenAI key configured");
        }
      } catch (error) {
        vscode.window.showErrorMessage(
          "Invalid API key. Check the key and try again."
        );
        logger.error("Invalid OpenAI key", { error: String(error) });
      }
    }
  });

  // Google Sign In
  register("devpilot.signInGoogle", async () => {
    const profile = await authService.signInWithGoogle();
    if (profile) {
      vscode.window.showInformationMessage(
        `✨ Signed in as ${profile.displayName || profile.email}`
      );
      logger.info("User signed in", { email: profile.email });
    }
  });

  // Sign Out
  register("devpilot.signOut", async () => {
    await authService.signOut();
  });

  // Track learning activity
  register("devpilot.trackLearningActivity", async (duration: number) => {
    await authService.trackActivity("learning", duration);
    logger.info("Learning activity tracked", { duration });
  });

  /* ========== Status Bar ==========*/

  try {
    const statusBar = vscode.window.createStatusBarItem(
      "devpilot.status",
      vscode.StatusBarAlignment.Left,
      100
    );
    statusBar.text = "$(rocket) DevPilot";
    statusBar.tooltip = "DevPilot: Editor-first AI learning assistant";
    statusBar.command = "devpilot.showTodos";
    statusBar.show();
    context.subscriptions.push(statusBar);
    logger.info("Status bar item created");
  } catch (error) {
    logger.warn("Failed to create status bar", { error: String(error) });
  }

  logger.info("DevPilot activation complete");
  console.log("✨ DevPilot ready!");
  vscode.window.showInformationMessage(
    "✨ DevPilot active! Use Command Palette (Ctrl+Shift+P) to access features."
  );
}

export function deactivate() {
  logger.info("DevPilot deactivating");
}
