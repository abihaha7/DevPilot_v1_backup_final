// src/components/figma-ui/features/HelpPanel.tsx
import React, { useState } from "react";
import { Card } from "../ui/card.js";
import { Button } from "../ui/button.js";
import { X, Minimize2 } from "lucide-react";

export interface HelpPanelProps {
  onClose: () => void;
  themeKind?: number; // ✅ added themeKind
}

export function HelpPanel({ onClose, themeKind }: HelpPanelProps) {
  const [isMinimized, setIsMinimized] = useState(false);

  const cardStyle: React.CSSProperties = {
    backgroundColor: "var(--vscode-editor-background)",
    color: "var(--vscode-editor-foreground)",
    border: "1px solid var(--vscode-panel-border)",
    borderRadius: 8,
    padding: 16,
    boxSizing: "border-box",
    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
    backdropFilter: "blur(6px)",
    width: isMinimized ? 192 : 320,
    height: isMinimized ? undefined : 300,
    display: "flex",
    flexDirection: "column",
  };

  if (isMinimized) {
    return (
      <Card style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12 }}>Help Panel</span>
          <div style={{ display: "flex", gap: 4 }}>
            <Button variant="ghost" size="sm" onClick={() => setIsMinimized(false)}>
              <Minimize2 className="w-3 h-3 rotate-180" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card style={cardStyle} role="region" aria-label="Help Panel Feature">
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <h3 style={{ fontSize: 13, fontWeight: 500 }}>Help Panel</h3>
        <div style={{ display: "flex", gap: 4 }}>
          <Button variant="ghost" size="sm" onClick={() => setIsMinimized(true)}>
            <Minimize2 className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <div style={{ flex: 1, fontSize: 12, lineHeight: 1.4, overflowY: "auto" }}>
        <p>Welcome to DevPilot! Here are some quick tips:</p>
        <ul style={{ paddingLeft: 16 }}>
          <li>Use the sidebar to select tools like Commit Generator, Chat, TODO Tracker, or Quizzes.</li>
          <li>Click on buttons within each tool to perform actions.</li>
          <li>Minimize any panel to keep your workspace clean.</li>
          <li>All tools integrate seamlessly with VSCode commands.</li>
        </ul>
        <p>For more info, check the documentation or contact support.</p>
      </div>
    </Card>
  );
}

export default HelpPanel;
