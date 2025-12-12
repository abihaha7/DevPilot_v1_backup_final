import { Card } from '../ui/card.js';
import { Button } from '../ui/button.js';
import { Input } from '../ui/input.js';
import { Badge } from '../ui/badge.js';
import { Avatar, AvatarFallback } from '../ui/avatar.js';
import { Bot, User, Send, RefreshCw, X, Minimize2, Maximize2 } from 'lucide-react';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { postToExtension, onExtensionMessage } from '../../../utils/vscodeBridge';

interface LearningChatbotProps {
  onClose: () => void;
  onSend?: (text: string) => void;
  reply?: string; // optional prop-based reply (keeps existing architecture compatible)
}

export function LearningChatbot({ onClose, onSend, reply }: LearningChatbotProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const [messages, setMessages] = useState<{ sender: 'bot' | 'user'; text: string }[]>([
    { sender: 'bot', text: "Hi! I'm DevPilot, your coding assistant. Ask me anything about code." }
  ]);

  // ref to messages container for auto-scroll
  const messagesRef = useRef<HTMLDivElement | null>(null);

  // helper to safely push a bot reply without duplicates
  const pushBotReply = useCallback((text: string) => {
    if (!text) return;
    setMessages(prev => {
      const last = prev[prev.length - 1];
      // avoid duplicate bot replies (same text as last)
      if (last?.sender === 'bot' && last?.text === text) {
        return prev;
      }
      return [...prev, { sender: 'bot', text }];
    });
    setIsTyping(false);
  }, []);

  // send a message to extension
  const sendMessage = () => {
    if (!inputMessage.trim()) return;

    const text = inputMessage.trim();

    // add user message locally
    setMessages((m) => [...m, { sender: 'user', text }]);
    setInputMessage('');
    setIsTyping(true);

    // send to extension (Option A)
    postToExtension('chatMessage', { text });

    // notify parent if present (keeps parent-driven flow)
    if (onSend) onSend(text);
  };

  // 1) Listen for direct extension responses (safer if dashboard-to-prop has timing issues)
  useEffect(() => {
    const handler = (payload: any) => {
      // payload is expected to be { text: string } based on your bridge contract
      const text = payload?.text ?? payload;
      if (typeof text === 'string') {
        pushBotReply(text);
      }
    };

    onExtensionMessage('chatReply', handler);

    // cleanup: remove handler by filtering it out (we don't have remove API on your bridge,
    // but your bridge stores handlers per-type. To avoid memory bleed, we attempt to remove
    // by accessing the handlers record is not available here; if your bridge exposes a remove,
    // replace this cleanup accordingly. For now ensure we do not add duplicates by design.)
    return () => {
      // No explicit remove API in existing bridge — leaving a safe no-op cleanup.
      // If you add an "offExtensionMessage" later, call it here to remove handler.
    };
  }, [pushBotReply]);

  // 2) Support incoming reply via props (keeps FigmaDashboard -> reply prop working)
  useEffect(() => {
    if (!reply) return;
    pushBotReply(reply);
  }, [reply, pushBotReply]);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    const node = messagesRef.current;
    if (!node) return;
    // small timeout ensures DOM updated
    requestAnimationFrame(() => {
      node.scrollTop = node.scrollHeight;
    });
  }, [messages]);

  // Allow Enter to send from input (keeps your existing behavior)
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  };

  // MINIMIZED VIEW
  if (isMinimized) {
    return (
      <Card className="w-64 bg-gray-900/95 border-gray-700 p-2 rounded-md shadow-lg backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="w-4 h-4 text-purple-400" />
            <span className="text-gray-300 text-sm">DevPilot Chat</span>
          </div>
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(false)}
              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-200"
            >
              <Maximize2 className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-200"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // MAIN CHAT WINDOW
  return (
    <Card className="w-80 h-96 bg-gray-900/95 border-gray-700 rounded-md shadow-lg backdrop-blur-sm flex flex-col">
      <div className="p-3 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bot className="w-4 h-4 text-purple-400" />
          <h3 className="text-gray-200 text-sm font-medium">DevPilot Chat</h3>
        </div>
        <div className="flex space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(true)}
            className="h-6 w-6 p-0 text-gray-400 hover:text-gray-200"
          >
            <Minimize2 className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0 text-gray-400 hover:text-gray-200"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* CHAT MESSAGES */}
      <div
        ref={messagesRef}
        className="flex-1 overflow-y-auto p-3 space-y-2"
        aria-live="polite"
      >
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`p-2 rounded-md ${m.sender === 'user'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-200'}`}
            >
              {m.text}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="text-xs text-gray-400 italic">
            DevPilot is typing...
          </div>
        )}
      </div>

      {/* INPUT AREA */}
      <div className="p-3 border-t border-gray-700 flex space-x-2">
        <Input
          placeholder="Ask about code..."
          value={inputMessage}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputMessage(e.target.value)}
          onKeyDown={onKeyDown}
          className="flex-1 bg-gray-800/50 border-gray-600 text-gray-200 placeholder-gray-500 text-xs h-8"
        />

        <Button
          onClick={sendMessage}
          disabled={!inputMessage.trim()}
          className="bg-purple-600 hover:bg-purple-700 text-white px-2 h-8"
        >
          {isTyping ? (
            <RefreshCw className="w-3 h-3 animate-spin" />
          ) : (
            <Send className="w-3 h-3" />
          )}
        </Button>
      </div>
    </Card>
  );
}






