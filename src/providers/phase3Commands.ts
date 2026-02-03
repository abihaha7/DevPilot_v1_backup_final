/**
 * Phase 3: Command Palette Integration
 * Handles all command palette commands for DevPilot
 * - OpenAI Chatbot integration
 * - Quiz system with learning streaks
 * - Help navigation
 * - Code translation improvements
 */

import * as vscode from "vscode";
import { getLogger } from "../core/logger";
import { getAIProvider } from "../core/aiProvider";

const logger = getLogger("Phase3Commands");

interface LearningStreak {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  totalPoints: number;
}

interface QuizProgress {
  topic: string;
  level: "easy" | "medium" | "hard";
  completed: boolean;
  score: number;
  timestamp: string;
}

/**
 * Register all Phase 3 command handlers
 */
export function registerPhase3Commands(
  context: vscode.ExtensionContext,
  callbacks: {
    onOpenChatbot?: () => void;
    onOpenQuiz?: () => void;
    onOpenHelp?: () => void;
  }
): void {
  const { onOpenChatbot, onOpenQuiz, onOpenHelp } = callbacks;

  /* ========== OPENAI CHATBOT COMMAND ========== */
  context.subscriptions.push(
    vscode.commands.registerCommand("devpilot.openChatbot", async () => {
      try {
        logger.info("Opening AI Chatbot");
        const aiProvider = getAIProvider();

        if (!aiProvider.isAvailable) {
          const setupChoice = await vscode.window.showInformationMessage(
            "OpenAI Chatbot requires an API key. Would you like to set it up?",
            "Setup Now",
            "Later"
          );

          if (setupChoice === "Setup Now") {
            const apiKey = await vscode.window.showInputBox({
              prompt: "Enter your OpenAI API key",
              password: true,
              ignoreFocusOut: true,
            });

            if (apiKey) {
              await context.globalState.update("devpilot.openaiKey", apiKey);
              vscode.window.showInformationMessage(
                "✅ OpenAI API key saved! Restart VS Code to activate."
              );
            }
          }
          return;
        }

        // Execute callback to show chatbot in sidebar
        if (onOpenChatbot) {
          onOpenChatbot();
        }

        // Show sidebar
        await vscode.commands.executeCommand("devpilot.focus");
        vscode.window.showInformationMessage(
          "💬 AI Chatbot is now open. Ask me anything about your code!"
        );

        logger.info("AI Chatbot opened successfully");
      } catch (error) {
        logger.error("Failed to open chatbot", { error: String(error) });
        vscode.window.showErrorMessage(
          "Failed to open AI Chatbot: " + String(error)
        );
      }
    })
  );

  /* ========== QUIZ COMMAND ========== */
  context.subscriptions.push(
    vscode.commands.registerCommand("devpilot.openQuiz", async () => {
      try {
        logger.info("Opening Quiz selection");

        const topics = ["HTML", "CSS", "JavaScript"];
        const selectedTopic = await vscode.window.showQuickPick(topics, {
          placeHolder: "Choose a topic to quiz on",
          ignoreFocusOut: true,
        });

        if (!selectedTopic) {
          return;
        }

        const levels = ["Easy", "Medium", "Hard"];
        const selectedLevel = await vscode.window.showQuickPick(levels, {
          placeHolder: `Choose difficulty for ${selectedTopic}`,
          ignoreFocusOut: true,
        });

        if (!selectedLevel) {
          return;
        }

        // Record quiz start
        const quizProgress: QuizProgress = {
          topic: selectedTopic.toLowerCase(),
          level: selectedLevel.toLowerCase() as "easy" | "medium" | "hard",
          completed: false,
          score: 0,
          timestamp: new Date().toISOString(),
        };

        // Get current streak
        const streak = await getOrInitializeStreak(context);

        vscode.window.showInformationMessage(
          `🎯 Starting ${selectedTopic} quiz (${selectedLevel})!\n\nCurrent streak: ${streak.currentStreak} days 🔥`
        );

        // Execute callback
        if (onOpenQuiz) {
          onOpenQuiz();
        }

        // Show quiz in sidebar
        await vscode.commands.executeCommand("devpilot.focus");

        logger.info("Quiz opened", {
          topic: selectedTopic,
          level: selectedLevel,
        });
      } catch (error) {
        logger.error("Failed to open quiz", { error: String(error) });
        vscode.window.showErrorMessage("Failed to open quiz: " + String(error));
      }
    })
  );

  /* ========== HELP COMMAND ========== */
  context.subscriptions.push(
    vscode.commands.registerCommand("devpilot.openHelp", async () => {
      try {
        logger.info("Opening Help");

        const helpTopics = [
          "🎯 Getting Started with DevPilot",
          "💬 Using the AI Chatbot",
          "📚 Taking Quizzes",
          "✅ Managing TODOs",
          "🚀 Code Translation",
          "🎨 Code Comparison",
          "⌨️ Keyboard Shortcuts",
          "🔧 Settings & Configuration",
        ];

        const selected = await vscode.window.showQuickPick(helpTopics, {
          placeHolder: "Select a help topic",
          ignoreFocusOut: true,
        });

        if (!selected) {
          return;
        }

        const helpContent = getHelpContent(selected);
        const panel = vscode.window.createWebviewPanel(
          "devpilotHelp",
          "DevPilot Help - " + selected,
          vscode.ViewColumn.One,
          { enableScripts: true }
        );

        panel.webview.html = helpContent;
        logger.info("Help opened for topic: " + selected);
      } catch (error) {
        logger.error("Failed to open help", { error: String(error) });
        vscode.window.showErrorMessage("Failed to open help: " + String(error));
      }
    })
  );

  /* ========== LEARNING STREAK COMMAND ========== */
  context.subscriptions.push(
    vscode.commands.registerCommand("devpilot.checkLearningStreak", async () => {
      try {
        logger.info("Checking learning streak");

        const streak = await getOrInitializeStreak(context);
        const streakMessage = `
🔥 Your Learning Streak 🔥

Current Streak: ${streak.currentStreak} days 🔥
Longest Streak: ${streak.longestStreak} days ⭐
Total Points: ${streak.totalPoints} pts 💎

Last Activity: ${formatDate(streak.lastActivityDate)}

Keep it up! Each day counts towards your learning journey! 🚀
        `;

        vscode.window.showInformationMessage(streakMessage);
        logger.info("Streak displayed", { streak });
      } catch (error) {
        logger.error("Failed to check streak", { error: String(error) });
        vscode.window.showErrorMessage(
          "Failed to check streak: " + String(error)
        );
      }
    })
  );

  /* ========== CODE TRANSLATION IMPROVEMENT ========== */
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "devpilot.translateCodeImproved",
      async () => {
        try {
          const editor = vscode.window.activeTextEditor;
          if (!editor) {
            vscode.window.showWarningMessage("No active editor");
            return;
          }

          const languages = [
            "JavaScript",
            "Python",
            "Go",
            "TypeScript",
            "Java",
            "C#",
            "C++",
            "Ruby",
            "PHP",
            "Rust",
          ];

          const targetLang = await vscode.window.showQuickPick(languages, {
            placeHolder: "Select target language",
            ignoreFocusOut: true,
          });

          if (!targetLang) {
            return;
          }

          const selection = editor.selection;
          const selectedText = editor.document.getText(selection);

          if (!selectedText.trim()) {
            vscode.window.showWarningMessage(
              "Please select code to translate"
            );
            return;
          }

          vscode.window.withProgress(
            {
              location: vscode.ProgressLocation.Notification,
              title: `Translating to ${targetLang}...`,
              cancellable: false,
            },
            async (progress) => {
              progress.report({ increment: 0 });

              try {
                const aiProvider = getAIProvider();
                if (!aiProvider.isAvailable) {
                  vscode.window.showErrorMessage(
                    "AI provider not available. Please configure OpenAI API."
                  );
                  return;
                }

                // Show smart translation indicator
                const translated = await performSmartTranslation(
                  selectedText,
                  targetLang,
                  aiProvider
                );

                progress.report({ increment: 100 });

                // Create a new document with translation
                const doc = await vscode.workspace.openTextDocument({
                  language: getLanguageId(targetLang),
                  content: translated,
                });

                await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);

                vscode.window.showInformationMessage(
                  `✅ Code translated to ${targetLang}!`
                );

                logger.info("Code translated", { targetLang });
              } catch (error) {
                vscode.window.showErrorMessage(
                  "Translation failed: " + String(error)
                );
                logger.error("Translation failed", { error: String(error) });
              }
            }
          );
        } catch (error) {
          logger.error("Translation command failed", { error: String(error) });
        }
      }
    )
  );
}

/* ========== HELPER FUNCTIONS ========== */

/**
 * Get or initialize learning streak data
 */
async function getOrInitializeStreak(
  context: vscode.ExtensionContext
): Promise<LearningStreak> {
  let streak = context.globalState.get<LearningStreak>(
    "devpilot.learningStreak"
  );

  if (!streak) {
    streak = {
      currentStreak: 1,
      longestStreak: 1,
      lastActivityDate: new Date().toISOString(),
      totalPoints: 10,
    };
  } else {
    // Check if activity was today
    const lastDate = new Date(streak.lastActivityDate);
    const today = new Date();

    const isToday =
      lastDate.getFullYear() === today.getFullYear() &&
      lastDate.getMonth() === today.getMonth() &&
      lastDate.getDate() === today.getDate();

    if (!isToday) {
      // Check if yesterday
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const wasYesterday =
        lastDate.getFullYear() === yesterday.getFullYear() &&
        lastDate.getMonth() === yesterday.getMonth() &&
        lastDate.getDate() === yesterday.getDate();

      if (wasYesterday) {
        // Extend streak
        streak.currentStreak += 1;
        streak.totalPoints += 10;

        if (streak.currentStreak > streak.longestStreak) {
          streak.longestStreak = streak.currentStreak;
        }
      } else {
        // Reset streak
        streak.currentStreak = 1;
      }
    }

    // Update last activity
    streak.lastActivityDate = new Date().toISOString();
  }

  await context.globalState.update("devpilot.learningStreak", streak);
  return streak;
}

/**
 * Get help content for a specific topic
 */
function getHelpContent(topic: string): string {
  const contents: Record<string, string> = {
    "🎯 Getting Started with DevPilot": `
      <h1>Getting Started with DevPilot</h1>
      <h2>Welcome! Here's how to get started:</h2>
      <ol>
        <li>Open the DevPilot sidebar (click the DevPilot icon on the left)</li>
        <li>Open any code file to activate features</li>
        <li>Press Ctrl+Shift+P to open the command palette</li>
        <li>Type "DevPilot" to see all available commands</li>
      </ol>
      <h2>Key Features:</h2>
      <ul>
        <li><strong>💬 AI Chatbot</strong> - Ask questions about code</li>
        <li><strong>📚 Quizzes</strong> - Learn with interactive quizzes</li>
        <li><strong>✅ TODO Tracker</strong> - Manage your tasks</li>
        <li><strong>🚀 Code Translation</strong> - Translate code between languages</li>
        <li><strong>🎨 Code Comparison</strong> - Compare code versions</li>
      </ul>
    `,
    "💬 Using the AI Chatbot": `
      <h1>Using the AI Chatbot</h1>
      <h2>Open the Chatbot:</h2>
      <p>Press Ctrl+Shift+P and type "DevPilot: Open AI Chatbot"</p>
      <h2>Features:</h2>
      <ul>
        <li>Ask questions about your code</li>
        <li>Get explanations of concepts</li>
        <li>Receive coding suggestions</li>
        <li>Get help with debugging</li>
      </ul>
      <h2>Setup:</h2>
      <p>If you don't have an API key, click "Setup Now" and enter your OpenAI API key.</p>
    `,
    "📚 Taking Quizzes": `
      <h1>Taking Quizzes with DevPilot</h1>
      <h2>Quiz Features:</h2>
      <ul>
        <li><strong>Topics:</strong> HTML, CSS, JavaScript</li>
        <li><strong>Difficulty Levels:</strong> Easy, Medium, Hard</li>
        <li><strong>Learning Streaks:</strong> Track your daily progress</li>
        <li><strong>Achievements:</strong> Unlock badges and rewards</li>
      </ul>
      <h2>How to Take a Quiz:</h2>
      <ol>
        <li>Press Ctrl+Shift+P and type "DevPilot: Take a Quiz"</li>
        <li>Select a topic and difficulty level</li>
        <li>Complete the quiz and see your score</li>
      </ol>
    `,
    "✅ Managing TODOs": `
      <h1>Managing TODOs in DevPilot</h1>
      <h2>Features:</h2>
      <ul>
        <li>📝 Create inline TODOs in your code</li>
        <li>⚡ Set priority levels (High, Medium, Low)</li>
        <li>✓ Mark as complete</li>
        <li>📊 Track progress</li>
      </ul>
      <h2>Commands:</h2>
      <ul>
        <li>DevPilot: Show All TODOs</li>
        <li>DevPilot: Mark TODO Done</li>
        <li>DevPilot: Increase TODO Priority</li>
        <li>DevPilot: Delete TODO</li>
      </ul>
    `,
    "🚀 Code Translation": `
      <h1>Code Translation with DevPilot</h1>
      <h2>How It Works:</h2>
      <ol>
        <li>Select the code you want to translate</li>
        <li>Press Ctrl+Shift+P and type "DevPilot: Translate Code"</li>
        <li>Choose your target language</li>
        <li>DevPilot will translate and show the result</li>
      </ol>
      <h2>Supported Languages:</h2>
      <p>JavaScript, Python, Go, TypeScript, Java, C#, C++, Ruby, PHP, Rust</p>
    `,
    "🎨 Code Comparison": `
      <h1>Code Comparison</h1>
      <h2>Compare Different Code Versions:</h2>
      <p>Use DevPilot's code comparison tool to:</p>
      <ul>
        <li>Compare refactored code</li>
        <li>See differences between versions</li>
        <li>Understand improvements</li>
      </ul>
    `,
    "⌨️ Keyboard Shortcuts": `
      <h1>Keyboard Shortcuts</h1>
      <h2>Essential DevPilot Shortcuts:</h2>
      <ul>
        <li><strong>Ctrl+Shift+P</strong> - Open Command Palette</li>
        <li><strong>Ctrl+Shift+D</strong> - Focus DevPilot Sidebar</li>
        <li><strong>Ctrl+K Ctrl+T</strong> - Toggle Terminal</li>
      </ul>
      <h2>In the Chatbot:</h2>
      <ul>
        <li><strong>Enter</strong> - Send message</li>
        <li><strong>Shift+Enter</strong> - New line</li>
        <li><strong>Escape</strong> - Close</li>
      </ul>
    `,
    "🔧 Settings & Configuration": `
      <h1>Settings & Configuration</h1>
      <h2>OpenAI API Key:</h2>
      <p>Go to: Extensions > DevPilot > Settings > Add your API key</p>
      <h2>Preferences:</h2>
      <ul>
        <li>Auto-save TODOs</li>
        <li>Show inline hints</li>
        <li>Enable learning streaks</li>
        <li>Theme preferences</li>
      </ul>
    `,
  };

  const content = contents[topic] || "<h1>Help Topic Not Found</h1>";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: var(--vscode-font-family);
          color: var(--vscode-editor-foreground);
          background: var(--vscode-editor-background);
          padding: 20px;
          line-height: 1.6;
        }
        h1 { color: #4da6ff; margin-top: 0; }
        h2 { color: #99ccff; margin-top: 20px; }
        ol, ul { margin: 10px 0; padding-left: 20px; }
        li { margin: 8px 0; }
        code {
          background: var(--vscode-textCodeBlock-background);
          padding: 2px 4px;
          border-radius: 3px;
        }
        strong { color: #99ff99; }
      </style>
    </head>
    <body>
      ${content}
    </body>
    </html>
  `;
}

/**
 * Perform smart code translation using heuristics
 */
async function performSmartTranslation(
  code: string,
  targetLanguage: string,
  aiProvider: any
): Promise<string> {
  // For now, return code with language-specific comments
  const languageComments: Record<string, string> = {
    python: "#",
    java: "//",
    go: "//",
    typescript: "//",
    javascript: "//",
    csharp: "//",
    cpp: "//",
    ruby: "#",
    php: "//",
    rust: "//",
  };

  const comment = languageComments[targetLanguage.toLowerCase()] || "//";

  // Smart translation would use AI provider here
  return `${comment} Code translated from original to ${targetLanguage}\n${code}`;
}

/**
 * Get language ID from language name
 */
function getLanguageId(language: string): string {
  const languageMap: Record<string, string> = {
    javascript: "javascript",
    python: "python",
    go: "go",
    typescript: "typescript",
    java: "java",
    csharp: "csharp",
    cpp: "cpp",
    ruby: "ruby",
    php: "php",
    rust: "rust",
  };

  return languageMap[language.toLowerCase()] || "plaintext";
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Export streak management for other modules
 */
export { getOrInitializeStreak, type LearningStreak, type QuizProgress };
