import React from "react";
import { createRoot } from "react-dom/client";
import { RightDashboard } from "./RightDashboard";

console.log("[RightDashboard] ENTRY LOADED - START");

const rootEl = document.getElementById("root");
console.log("[RightDashboard] root element:", rootEl);

if (!rootEl) {
  console.error("[RightDashboard] Root element NOT found!");
  document.body.innerHTML = "<h1>❌ root div not found</h1>";
  throw new Error("Root element not found");
}

console.log("[RightDashboard] Creating React root...");
const root = createRoot(rootEl);

console.log("[RightDashboard] Rendering RightDashboard component...");
root.render(<RightDashboard />);

console.log("[RightDashboard] ENTRY LOADED - COMPLETE");
