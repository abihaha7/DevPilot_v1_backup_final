/**
 * DevPilot LLM Module
 * Phase-2 feature - currently feature-flagged OFF
 * When enabled, provides AI-powered completions and explanations
 */

import OpenAI from "openai";
import { shouldUseLLM } from "./config";

export interface LLMCompletionOptions {
  prompt: string;
  language: string;
  maxTokens?: number;
  temperature?: number;
}

export interface LLMResult {
  text: string;
  reasoning: string;
  confidence: number;
}

let openaiClient: OpenAI | null = null;

/**
 * Initialize LLM client with API key
 */
export function initializeLLM(apiKey: string): void {
  if (!shouldUseLLM()) {
    console.warn("LLM mode is disabled. Use native mode instead.");
    return;
  }

  openaiClient = new OpenAI({
    apiKey,
  });
}

/**
 * Get code completion from LLM
 * Used for commit generation and other features that benefit from AI
 */
export async function getLLMCompletion(
  options: LLMCompletionOptions
): Promise<LLMResult | null> {
  // Hybrid mode: LLM available if API key provided and enabled
  if (!shouldUseLLM() || !openaiClient) {
    return null;
  }

  try {
    const prompt = `
You are a code completion assistant for ${options.language}.
Complete the following code snippet with a single, concise line or block:

\`\`\`${options.language}
${options.prompt}
\`\`\`

Provide only the completion, no explanation.
`;

    const response = await openaiClient.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a code completion expert. Provide concise, accurate code completions. No explanations.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: options.maxTokens || 150,
      temperature: options.temperature || 0.3,
    });

    const text = response.choices[0]?.message?.content?.trim() || "";

    return {
      text,
      reasoning: "LLM-generated completion",
      confidence: 0.7,
    };
  } catch (error) {
    console.error("LLM completion failed:", error);
    return null;
  }
}

/**
 * Get code explanation from LLM
 */
export async function getLLMExplanation(code: string): Promise<string | null> {
  // Phase-2: Currently disabled
  if (!shouldUseLLM() || !openaiClient) {
    return null;
  }

  try {
    const response = await openaiClient.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a code explanation expert. Provide concise, clear explanations.",
        },
        {
          role: "user",
          content: `Explain this code in 2-3 sentences:\n\n\`\`\`\n${code}\n\`\`\``,
        },
      ],
      max_tokens: 200,
      temperature: 0.5,
    });

    return response.choices[0]?.message?.content?.trim() || null;
  } catch (error) {
    console.error("LLM explanation failed:", error);
    return null;
  }
}

/**
 * Check if LLM is available
 */
export function isLLMAvailable(): boolean {
  return shouldUseLLM() && !!openaiClient;
}

/**
 * Cleanup LLM client
 */
export function cleanupLLM(): void {
  openaiClient = null;
}
