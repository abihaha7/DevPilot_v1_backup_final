// src/components/figma-ui/dashboard/RightDashboard.tsx
console.log("RightDashboard mounted");

import React, { useEffect, useMemo, useState, Suspense } from "react";
import { Button } from "../ui/button.js";
import { postToExtension, onExtensionMessage } from "../../../utils/vscodeBridge";
import { dashboardData } from "../../../data/dashboard-data";

// ─────────────────────────────────────────────────────────────────────────────
// Lazy-loaded feature modules (default exports only)
// ─────────────────────────────────────────────────────────────────────────────
const CommitGenerator = React.lazy(() => import("../features/CommitGenerator.js"));
const LearningChatbot = React.lazy(() => import("../features/LearningChatbot.js"));
const TodoTracker = React.lazy(() => import("../features/TodoTracker.js"));
const QuizRunner = React.lazy(() => import("../features/QuizRunner.js"));
const HelpPanel = React.lazy(() => import("../features/HelpPanel.js"));

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface RightDashboardProps {
  /** Provider-controlled mode (preferred) */
  activeFeature?: string | null;
  themeKind?: number;
  onClose?: () => void;

  /** Legacy / standalone mode (DO NOT REMOVE) */
  initialFeature?: string | null;
  initialThemeKind?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export const RightDashboard: React.FC<RightDashboardProps> = ({
  activeFeature: controlledFeature,
  themeKind: controlledThemeKind,
  onClose,
  initialFeature = null,
  initialThemeKind = 2,
}) => {
  // ── Internal fallback state (used only when uncontrolled)
  const [internalFeature, setInternalFeature] = useState<string | null>(initialFeature);
  const [internalThemeKind, setInternalThemeKind] = useState<number>(initialThemeKind);

  const activeFeature = controlledFeature !== undefined ? controlledFeature : internalFeature;
  const themeKind = controlledThemeKind !== undefined ? controlledThemeKind : internalThemeKind;
  useEffect(() => {
  if (activeFeature != null) return;

  // Default feature on first mount
  postToExtension("command", {
    command: "devpilot.setActiveFeature",
    args: [{ feature: "chat" }],
  });
}, []); // run once

  // ── Extension message bindings (legacy + safety)
  useEffect(() => {
    if (controlledFeature !== undefined) return;

    const offSwitch = onExtensionMessage("switchFeature", (payload: any) => {
      const f = payload?.feature ?? payload ?? null;
      setInternalFeature(f);
    });

    const offTheme = onExtensionMessage("theme", (payload: any) => {
      if (typeof payload?.kind === "number") setInternalThemeKind(payload.kind);
      else if (typeof payload === "number") setInternalThemeKind(payload);
    });

    const offRestore = onExtensionMessage("restoreFeature", (payload: any) => {
      const f = payload?.feature ?? payload;
      if (f) setInternalFeature(f);
    });

    return () => {
      offSwitch?.();
      offTheme?.();
      offRestore?.();
    };
  }, [controlledFeature]);

  // ── Commands
  const openFeature = (feature: string) => {
    postToExtension("command", {
      command: "devpilot.setActiveFeature",
      args: [{ feature }],
    });
  };

  const closeFeature = () => {
    if (onClose) return onClose();
    postToExtension("command", {
      command: "devpilot.setActiveFeature",
      args: [{ feature: null }],
    });
    setInternalFeature(null);
  };

  const sendChat = (text: string) => {
    postToExtension("chatMessage", { text });
  };

  // ── Derived quiz config
  const quizQuestions = useMemo(() => {
    if (!activeFeature?.startsWith("quiz-")) return [];
    return (
      dashboardData.practiceProblems.find((p) => p.id === activeFeature)?.questions || []
    );
  }, [activeFeature]);

  // ── Animation helpers (CSS-driven, provider-safe)
  const featureKey = activeFeature ?? "home";

  return (
    <div
      role="region"
      aria-label="DevPilot Right Dashboard"
      className="devpilot-right-dashboard"
    >
      <Suspense fallback={<div className="dp-loading">Loading…</div>}>
        <div key={featureKey} className="dp-feature-surface">
          {activeFeature === "commit" && (
            <CommitGenerator onClose={closeFeature} themeKind={themeKind} />
          )}

          {activeFeature === "chat" && (
            <LearningChatbot
              onClose={closeFeature}
              onSend={sendChat}
              reply={""}
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
                <Button onClick={() => openFeature("help")} size="sm">
                  Help
                </Button>
              </div>
            </div>
          )}
        </div>
      </Suspense>
    </div>
  );
};

export default RightDashboard;