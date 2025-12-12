import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";

// ✅ Import CSS as text for runtime injection
import globalsCSS from "../styles/globals.css";

import { RightDashboard } from "./RightDashboard.js";
import { CommitGenerator } from "../features/CommitGenerator.js";
import { TodoTracker } from "../features/TodoTracker.js";
import { LearningChatbot } from "../features/LearningChatbot.js";
import { Button } from "../ui/button.js";

import { GitCommit, AlertTriangle, MessageCircle, Plus } from "lucide-react";
import { postToExtension, onExtensionMessage } from "../../../utils/vscodeBridge";
import { cn } from "../ui/utils";

console.log("✅ DevPilot Dashboard script loaded successfully");

/* ✅ Inject global CSS at runtime */
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = globalsCSS;
  document.head.appendChild(style);
  console.log("✅ Global CSS injected");
}

function App() {
  const [showCommitGenerator, setShowCommitGenerator] = useState(true);
  const [showTodoTracker, setShowTodoTracker] = useState(true);
  const [showLearningChatbot, setShowLearningChatbot] = useState(true);

  const [commitResult, setCommitResult] = useState("");
  const [todos, setTodos] = useState<any[]>([]);
  const [chatReply, setChatReply] = useState("");

  useEffect(() => {
    onExtensionMessage("commitResult", (data: any) =>
      setCommitResult(data.text)
    );
    onExtensionMessage("todosResult", (data: any) =>
      setTodos(data.todos)
    );
    onExtensionMessage("chatReply", (data: any) =>
      setChatReply(data.text)
    );

    console.log("✅ DevPilot Dashboard Mounted");
  }, []);

  const handleGenerateCommit = () => postToExtension("generateCommit");
  const handleScanTodos = () => postToExtension("scanTODOs");
  const handleChatMessage = (text: string) =>
    postToExtension("chatMessage", { text });

  const handleMessageTest = () => {
    postToExtension("helloFromDashboard", {
      message: "Dashboard is active and communicating!",
    });
  };

  return (
    <div
      className={cn(
        "relative w-full h-full min-h-screen bg-black text-white overflow-hidden flex"
      )}
    >
      {/* ✅ Debug Overlay */}
      <div className="absolute top-2 left-2 text-lime-400 text-xs z-[9999]">
        Dashboard Loaded
      </div>

      {/* ✅ Main Dashboard Area */}
      <div className="flex-1 h-full overflow-hidden">
        <RightDashboard />
      </div>

      {/* ✅ Floating Left Widgets */}
      <div className="fixed bottom-6 left-6 z-20">
        <div className="space-y-3">
          {showCommitGenerator && (
            <CommitGenerator
              onClose={() => setShowCommitGenerator(false)}
              onGenerate={handleGenerateCommit}
              result={commitResult}
            />
          )}

          {showTodoTracker && (
            <TodoTracker
              onClose={() => setShowTodoTracker(false)}
              onScan={handleScanTodos}
              todos={todos}
            />
          )}
        </div>
      </div>

      {/* ✅ Learning Chatbot */}
      {showLearningChatbot && (
        <div className="fixed bottom-6 right-6 z-20">
          <LearningChatbot
            onClose={() => setShowLearningChatbot(false)}
            onSend={handleChatMessage}
            reply={chatReply}
          />
        </div>
      )}

      {/* ✅ Floating Action Button */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
        <div className="relative">
          <Button
            className="bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-full w-10 h-10 p-0"
            onClick={() => {
              setShowCommitGenerator(true);
              setShowTodoTracker(true);
              setShowLearningChatbot(true);
            }}
          >
            <Plus className="w-4 h-4 text-gray-300" />
          </Button>

          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 space-y-2">
            {!showCommitGenerator && (
              <Button
                onClick={() => setShowCommitGenerator(true)}
                className="bg-gray-800/90 hover:bg-gray-700 border border-gray-600 text-gray-300 hover:text-white text-xs h-8 px-2"
              >
                <GitCommit className="w-3 h-3 mr-1" />
                Commit
              </Button>
            )}

            {!showTodoTracker && (
              <Button
                onClick={() => setShowTodoTracker(true)}
                className="bg-gray-800/90 hover:bg-gray-700 border border-gray-600 text-gray-300 hover:text-white text-xs h-8 px-2"
              >
                <AlertTriangle className="w-3 h-3 mr-1" />
                TODO
              </Button>
            )}

            {!showLearningChatbot && (
              <Button
                onClick={() => setShowLearningChatbot(true)}
                className="bg-gray-800/90 hover:bg-gray-700 border border-gray-600 text-gray-300 hover:text-white text-xs h-8 px-2"
              >
                <MessageCircle className="w-3 h-3 mr-1" />
                Chat
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ✅ Branding */}
      <div className="fixed top-4 right-4 z-20">
        <div className="bg-gray-900/95 border border-gray-700 rounded-md px-3 py-1.5 backdrop-blur-sm">
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
            <span className="text-gray-300 text-xs font-medium">
              DevPilot v2.1.0
            </span>
          </div>
        </div>
      </div>

      {/* ✅ Test Button */}
      <div className="fixed top-4 left-4 z-20">
        <Button
          onClick={handleMessageTest}
          className="bg-purple-600 hover:bg-purple-700 border border-gray-600 text-white text-xs h-8 px-3 rounded-md"
        >
          Test VS Code Link
        </Button>
      </div>
    </div>
  );
}

/* ✅ Webview-Safe Mount */
function renderDashboard() {
  console.log("🚀 Attempting to mount React App...");

  const rootEl = document.getElementById("root");
  if (!rootEl) {
    console.error("❌ #root not found");
    return;
  }

  console.log("✅ Found #root — Mounting React App!");
  const root = ReactDOM.createRoot(rootEl);
  root.render(<App />);
}

window.addEventListener("DOMContentLoaded", renderDashboard);
