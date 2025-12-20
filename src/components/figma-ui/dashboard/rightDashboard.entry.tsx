import React from "react";
import { createRoot } from "react-dom/client";
import { RightDashboard } from "./RightDashboard";

console.log("[RightDashboard] ENTRY LOADED");

const rootEl = document.getElementById("root");

if (!rootEl) {
  document.body.innerHTML = "<h1>❌ root div not found</h1>";
  throw new Error("Root element not found");
}

createRoot(rootEl).render(<RightDashboard />);
