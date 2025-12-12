// src/components/figma-ui/dashboard/EditorOverlay.tsx

import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { postToExtension, onExtensionMessage } from "../../../utils/vscodeBridge";
import { Button } from "../ui/button.js";

/* ------------------------ Fix Window Type ------------------------ */
declare global {
  interface Window {
    initialThemeKind?: number;
  }
}

/**
 * EditorOverlay — matches EditorOverlayProvider.ts (webview)
 * Handles:
 * - active editor metadata
 * - cursor selections
 * - diff preview
 * - todos
 * - commit suggestion
 * - theme sync from extension
 */
export const EditorOverlay: React.FC = () => {
  const [active, setActive] = useState<any>(null);
  const [selections, setSelections] = useState<any[]>([]);
  const [fileDiff, setFileDiff] = useState<string>("");
  const [todos, setTodos] = useState<any[]>([]);
  const [commitSuggestion, setCommitSuggestion] = useState<string>("");
  const [themeKind, setThemeKind] = useState<number>(
    window.initialThemeKind ?? 2 // fallback: light/dark/high contrast
  );

  useEffect(() => {
    postToExtension("requestActiveEditor");

    // ---- MESSAGE SUBSCRIPTIONS ----
    const offActive = onExtensionMessage("activeEditor", (payload) => setActive(payload));
    const offSel = onExtensionMessage("cursorSelection", (payload) =>
      setSelections(payload?.selections || [])
    );
    const offDiff = onExtensionMessage("fileDiff", (payload) =>
      setFileDiff(payload?.diff || "")
    );
    const offTodos = onExtensionMessage("todosResult", (payload) =>
      setTodos(payload?.todos || [])
    );
    const offCommit = onExtensionMessage("commitResult", (payload) =>
      setCommitSuggestion(payload?.text || "")
    );
    const offTheme = onExtensionMessage("theme", (payload) => {
      if (typeof payload?.kind === "number") setThemeKind(payload.kind);
      else setThemeKind(window.initialThemeKind ?? 2);
    });

    return () => {
      offActive?.();
      offSel?.();
      offDiff?.();
      offTodos?.();
      offCommit?.();
      offTheme?.();
    };
  }, []);

  // ---- INTERACTIONS ----
  const requestCommit = () => postToExtension("generateCommit", {});
  const openFile = () => {
    if (active?.uri) postToExtension("openFile", { uri: active.uri });
  };

  const containerStyle: React.CSSProperties = {
    border: "1px solid var(--vscode-panel-border)",
    backgroundColor: "var(--vscode-editorHoverWidget-background)",
    color: "var(--vscode-editor-foreground)",
    padding: 12,
    borderRadius: 8,
    width: 340,
    boxSizing: "border-box",
  };

  return (
    <div style={{ padding: 8, boxSizing: "border-box" }}>
      <div style={containerStyle}>
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{active?.fileName || "No file"}</div>
            <div style={{ fontSize: 11, color: "var(--vscode-descriptionForeground)" }}>
              {active?.languageId
                ? `${active.languageId} • ${active?.lineCount ?? 0} lines`
                : ""}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <Button onClick={openFile} className="text-xs h-8">
              Open
            </Button>
            <Button onClick={requestCommit} className="text-xs h-8">
              Suggest Commit
            </Button>
          </div>
        </div>

        {/* STATS */}
        <div
          style={{
            fontSize: 12,
            color: "var(--vscode-descriptionForeground)",
            marginBottom: 8,
          }}
        >
          Selections: {selections.length} • TODOs: {todos.length}
        </div>

        {/* COMMIT SUGGESTION */}
        {commitSuggestion ? (
          <div
            style={{
              marginTop: 8,
              padding: 8,
              borderRadius: 6,
              backgroundColor: "var(--vscode-editor-background)",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 600 }}>Commit suggestion</div>
            <div style={{ fontSize: 12, marginTop: 6 }}>{commitSuggestion}</div>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: "var(--vscode-descriptionForeground)" }}>
            No commit suggestion yet — click “Suggest Commit”.
          </div>
        )}

        {/* DIFF PREVIEW */}
        {fileDiff && (
          <pre
            style={{
              marginTop: 8,
              fontSize: 11,
              maxHeight: 120,
              overflow: "auto",
              backgroundColor: "transparent",
              border: "none",
            }}
          >
            {fileDiff.slice(0, 1000)}
          </pre>
        )}

        {/* THEME INFO */}
        <div style={{ marginTop: 12, fontSize: 12, color: "var(--vscode-descriptionForeground)" }}>
          Theme: {themeKind}
        </div>
      </div>
    </div>
  );
};

/* ----------------------- Webview-Safe Mount ----------------------- */
function renderOverlay() {
  const root = document.getElementById("root");
  if (!root) return console.error(" #root not found for EditorOverlay");

  const app = ReactDOM.createRoot(root);
  app.render(<EditorOverlay />);
}

window.addEventListener("DOMContentLoaded", renderOverlay);

export default EditorOverlay;
