import React, { useEffect, useMemo, useState, Suspense } from "react";
import { Button } from "../ui/button.js";
import { postToExtension, onExtensionMessage } from "../../../utils/vscodeBridge";
import { dashboardData } from "../../../data/dashboard-data";
import { ErrorBoundary } from "../ErrorBoundary";

/* ---------------- LAZY FEATURES (OLD) ---------------- */

const CommitGenerator = React.lazy(() => import("../features/CommitGenerator.js"));
const LearningChatbot = React.lazy(() => import("../features/LearningChatbot.js"));
const TodoTracker = React.lazy(() => import("../features/TodoTracker.js"));
const QuizRunner = React.lazy(() => import("../features/QuizRunner.js"));
const HelpPanel = React.lazy(() => import("../features/HelpPanel.js"));

/* ---------------- LAZY FEATURES (PHASE 2) ---------------- */

const ChatFeature = React.lazy(() => import("./ChatFeature.js"));
const TestFeature = React.lazy(() => import("./TestFeature.js"));
const SnippetsFeature = React.lazy(() => import("./SnippetsFeature.js"));
const QuickFixFeature = React.lazy(() => import("./QuickFixFeature.js"));
const AchievementsView = React.lazy(() => import("./AchievementsView.js"));
const FigmaDashboard = React.lazy(() => import("./FigmaDashboard.js"));

/* ---------------- TYPES ---------------- */

interface RightDashboardProps {
  activeFeature?: string | null;
  themeKind?: number;
  onClose?: () => void;

  initialFeature?: string | null;
  initialThemeKind?: number;
}

/* ---------------- COMPONENT ---------------- */

export function RightDashboard({
  activeFeature: controlledFeature,
  onClose,
  initialFeature = null,
  initialThemeKind = 2,
  themeKind: controlledThemeKind,
}: RightDashboardProps) {
  const [internalFeature, setInternalFeature] =
    useState<string | null>(initialFeature);
  const [internalThemeKind, setInternalThemeKind] =
    useState<number>(initialThemeKind);
  const [chatReply, setChatReply] = useState("");

  const activeFeature =
    controlledFeature !== undefined
      ? controlledFeature
      : internalFeature;

  const themeKind =
    controlledThemeKind !== undefined
      ? controlledThemeKind
      : internalThemeKind;

  /* ---------------- READY ---------------- */

  useEffect(() => {
    postToExtension("ready", {});
  }, []);

  /* ---------------- MESSAGE BINDINGS ---------------- */

  useEffect(() => {
    const offSwitch = onExtensionMessage("switchFeature", (payload: any) => {
      if (!payload) return;
      if (typeof payload === "string") {
        setInternalFeature(payload);
      } else if (payload.feature) {
        setInternalFeature(payload.feature);
      }
    });

    const offTheme = onExtensionMessage("theme", (payload: any) => {
      if (typeof payload?.kind === "number") {
        setInternalThemeKind(payload.kind);
      }
    });

    const offChatReply = onExtensionMessage("chatReply", (payload: any) => {
      if (typeof payload?.text === "string") {
        setChatReply(payload.text);
      }
    });

    return () => {
      offSwitch?.();
      offTheme?.();
      offChatReply?.();
    };
  }, []);

  useEffect(() => {
  if (!activeFeature?.startsWith("quiz-")) return;

  // expected format: quiz-html-easy
  const [, topic, level] = activeFeature.split("-");

  if (
    (topic === "html" || topic === "css" || topic === "js") &&
    (level === "easy" || level === "medium" || level === "hard")
  ) {
    setQuizPath({ topic, level });
  }
}, [activeFeature]);

/* ---------------- COMMAND HELPERS ---------------- */

  const openFeature = (feature: string) => {
    postToExtension("command", {
      command: "devpilot.setActiveFeature",
      args: [{ feature }],
    });
  };

  const closeFeature = () => {
    if (onClose) return onClose();
    setInternalFeature(null);
  };

  const sendChat = (text: string) => {
    postToExtension("chatMessage", { text });
  };

  /* ---------------- DERIVED DATA ---------------- */
  const [quizPath, setQuizPath] = useState<{
    topic: "html" | "css" | "js";
    level: "easy" | "medium" | "hard";
  } | null>(null);

  const quizQuestions = useMemo(() => {
    if (!quizPath) return [];

    const { topic, level } = quizPath;
    const problems = dashboardData.practiceProblems[topic];

    if (!problems) return [];

    if (level in problems) {
      return problems[level as keyof typeof problems];
    }

    return [];
  }, [quizPath]);

  /* ---------------- RENDER ---------------- */

  return (
  //   <div style={{ color: "red", padding: 20, fontSize: 14 }}>
  //   DEBUG: RightDashboard rendered
  //   <br />
  //   activeFeature = {String(activeFeature)}
  // </div>

    <div className="devpilot-right-dashboard">

      <Suspense fallback={<div className="dp-loading">Loading…</div>}>
        <ErrorBoundary>
          <div className="dp-feature-surface">
            {activeFeature === "commit" && (
              <CommitGenerator onClose={closeFeature} themeKind={themeKind} />
            )}

            {activeFeature === "chat" && (
              <LearningChatbot
                onClose={closeFeature}
                onSend={sendChat}
                reply={chatReply}
                autoFocus
                themeKind={themeKind}
              />
            )}

            {activeFeature === "todo" && (
              <TodoTracker onClose={closeFeature} themeKind={themeKind} />
            )}

            {activeFeature?.startsWith("quiz-") && (
              <QuizRunner
                onClose={closeFeature}
                themeKind={themeKind}
                questions={quizQuestions}
              />
            )}

            {activeFeature === "help" && (
              <HelpPanel onClose={closeFeature} themeKind={themeKind} />
            )}

            {/* PHASE 2 FEATURES */}

            {activeFeature === "code-chat" && (
              <ChatFeature />
            )}

            {activeFeature === "test-runner" && (
              <TestFeature />
            )}

            {activeFeature === "snippets" && (
              <SnippetsFeature />
            )}

            {activeFeature === "quick-fixes" && (
              <QuickFixFeature />
            )}

            {activeFeature === "achievements" && (
              <AchievementsView />
            )}

            {activeFeature === "dashboard" && (
              <FigmaDashboard onClose={closeFeature} />
            )}

            {!activeFeature && (
              <div className="dp-placeholder">
                <div className="dp-placeholder-title">Welcome to DevPilot</div>
                <div className="dp-placeholder-sub">
                  Choose a tool to get started — learn, build, and ship faster.
                </div>

                <div className="dp-actions">
                  <Button onClick={() => openFeature("commit")} size="sm">
                    Commit Generator
                  </Button>
                  <Button onClick={() => openFeature("chat")} size="sm">
                    Learning Chatbot
                  </Button>
                  <Button onClick={() => openFeature("todo")} size="sm">
                    Todo Tracker
                  </Button>
                  <Button onClick={() => openFeature("quiz-html-easy")} size="sm">
                    HTML (Easy)
                  </Button>

                  <Button onClick={() => openFeature("quiz-css-hard")} size="sm">
                    CSS (Hard)
                  </Button>

                  <Button onClick={() => openFeature("quiz-js-medium")} size="sm">
                    JS (Medium)
                  </Button>
                  <Button onClick={() => openFeature("help")} size="sm">
                    Help
                  </Button>

                  {/* PHASE 2 FEATURE BUTTONS */}
                  <Button onClick={() => openFeature("code-chat")} size="sm">
                    Code Chat
                  </Button>
                  <Button onClick={() => openFeature("test-runner")} size="sm">
                    Test Runner
                  </Button>
                  <Button onClick={() => openFeature("snippets")} size="sm">
                    Snippets
                  </Button>
                  <Button onClick={() => openFeature("quick-fixes")} size="sm">
                    Quick Fixes
                  </Button>
                  <Button onClick={() => openFeature("achievements")} size="sm">
                    Achievements
                  </Button>
                </div>
              </div>
            )}
          </div>
        </ErrorBoundary>
      </Suspense>
    </div>
 );
}

export default RightDashboard;
