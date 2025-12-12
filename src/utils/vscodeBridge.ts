// src/utils/vscodeBridge.ts
declare global {
  interface Window {
    acquireVsCodeApi?: () => {
      postMessage: (msg: any) => void;
      getState?: () => any;
      setState?: (state: any) => void;
    };
  }
}

export type MessageHandler = (payload: any) => void;

const handlers: Record<string, MessageHandler[]> = {};

/**
 * Sends a message from the webview to the VS Code extension backend.
 */
export function postToExtension(type: string, payload: any = {}) {
  const vscode = window.acquireVsCodeApi?.();
  if (!vscode) {
    console.warn("⚠️ VS Code API not available — running in browser preview?");
    return;
  }
  vscode.postMessage({
    type,
    payload, // ALWAYS wrap in payload
  });
}

/**
 * Registers a listener for messages coming from the VS Code extension.
 * Handlers receive the payload only.
 */
export function onExtensionMessage(type: string, handler: MessageHandler) {
  if (!handlers[type]) {
    handlers[type] = [];
  }
  handlers[type].push(handler);
}

/**
 * Global listener — receives all messages from the extension backend.
 * Expects messages in shape: { type, payload }
 */
window.addEventListener("message", (event) => {
  const message = event.data;
  if (!message?.type) return;

  const { type, payload } = message;

  if (handlers[type]) {
    handlers[type].forEach((fn) => fn(payload));
  }
});

