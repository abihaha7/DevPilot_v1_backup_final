// src/utils/vscodeBridge.ts

export type MessageHandler = (payload: any) => void;

const handlers: Record<string, MessageHandler[]> = {};

/**
 * Get the already-acquired VS Code API instance.
 * It MUST be created once in HTML and attached to window.vscode
 */
function getVSCodeApi():
  | {
      postMessage: (msg: any) => void;
      getState?: () => any;
      setState?: (state: any) => void;
    }
  | undefined {
  const vscode = (window as any).vscode;

  if (!vscode) {
    console.warn("⚠️ VS Code API not found on window. Did HTML bootstrap run?");
    return;
  }

  return vscode;
}

/**
 * Sends a message from the webview to the VS Code extension backend.
 */
export function postToExtension(type: string, payload: any = {}) {
  const vscode = getVSCodeApi();
  if (!vscode) {return;}

  vscode.postMessage({
    type,
    payload, // ALWAYS wrapped
  });
}

/**
 * Registers a listener for messages coming from the VS Code extension.
 * Returns a cleanup function to unregister the handler.
 */
export function onExtensionMessage(
  type: string,
  handler: MessageHandler
): () => void {
  if (!handlers[type]) {
    handlers[type] = [];
  }

  handlers[type].push(handler);

  return () => {
    handlers[type] = handlers[type].filter((h) => h !== handler);
  };
}

/**
 * Global listener — receives all messages from the extension backend.
 * Expects messages in shape: { type, payload }
 */
window.addEventListener("message", (event) => {
  const message = event.data;
  if (!message?.type) {return;}

  const { type, payload } = message;

  handlers[type]?.forEach((fn) => fn(payload));
});
