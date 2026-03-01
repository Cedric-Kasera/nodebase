import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import logger from "../../utils/logger.js";

/**
 * OpenAI executor — uses the Vercel AI SDK's `generateText` for a
 * single-turn completion.
 *
 * Expected node.data shape:
 * {
 *   model?: string        (default "gpt-4o-mini"),
 *   userPrompt: string,   (or legacy `prompt`)
 *   systemPrompt?: string,
 *   temperature?: number,
 *   maxTokens?: number,
 * }
 *
 * credential: the user's decrypted OpenAI API key string.
 */
export const executeOpenAI = async ({ node, credential }) => {
  if (!credential)
    throw new Error("OpenAI node requires an API key credential.");

  const {
    model = "gpt-4o-mini",
    userPrompt,
    prompt,
    systemPrompt,
    temperature,
    maxTokens,
  } = node.data;

  // Accept userPrompt (from frontend dialog) or legacy prompt field
  const resolvedPrompt = userPrompt || prompt;
  if (!resolvedPrompt)
    throw new Error("OpenAI node requires a user prompt in data.");

  const openai = createOpenAI({ apiKey: credential });

  logger.debug("OpenAI generateText", { model });

  // Build messages array for proper system + user prompt handling
  const messages = [];
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: resolvedPrompt });

  const result = await generateText({
    model: openai(model),
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
