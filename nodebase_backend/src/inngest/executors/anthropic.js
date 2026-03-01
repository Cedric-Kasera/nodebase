import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import logger from "../../utils/logger.js";

/**
 * Anthropic executor — uses the Vercel AI SDK's `generateText`.
 *
 * Expected node.data shape:
 * {
 *   model?: string        (default "claude-sonnet-4-20250514"),
 *   userPrompt: string,   (or legacy `prompt`)
 *   systemPrompt?: string,
 *   temperature?: number,
 *   maxTokens?: number,
 * }
 *
 * credential: the user's decrypted Anthropic API key string.
 */
export const executeAnthropic = async ({ node, credential }) => {
  if (!credential)
    throw new Error("Anthropic node requires an API key credential.");

  const {
    model = "claude-sonnet-4-20250514",
    userPrompt,
    prompt,
    systemPrompt,
    temperature,
    maxTokens,
  } = node.data;

  // Accept userPrompt (from frontend dialog) or legacy prompt field
  const resolvedPrompt = userPrompt || prompt;
  if (!resolvedPrompt)
    throw new Error("Anthropic node requires a user prompt in data.");

  const anthropic = createAnthropic({ apiKey: credential });

  logger.debug("Anthropic generateText", { model });

  // Build messages array for proper system + user prompt handling
  const messages = [];
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: resolvedPrompt });

  const result = await generateText({
    model: anthropic(model),
    messages,
    temperature,
    maxTokens,
  });

  return {
    text: result.text,
    usage: result.usage,
    model,
  };
};
