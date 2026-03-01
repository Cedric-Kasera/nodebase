import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import logger from "../../utils/logger.js";

/**
 * Gemini executor — uses the Vercel AI SDK's `generateText`.
 *
 * Expected node.data shape:
 * {
 *   model?: string        (default "gemini-2.5-flash"),
 *   userPrompt: string,   (or legacy `prompt`)
 *   systemPrompt?: string,
 *   temperature?: number,
 *   maxTokens?: number,
 * }
 *
 * credential: the user's decrypted Google AI API key string.
 */
export const executeGemini = async ({ node, credential }) => {
  if (!credential)
    throw new Error("Gemini node requires an API key credential.");

  const {
    model = "gemini-2.5-flash",
    userPrompt,
    prompt,
    systemPrompt,
    temperature,
    maxTokens,
  } = node.data;

  // Accept userPrompt (from frontend dialog) or legacy prompt field
  const resolvedPrompt = userPrompt || prompt;
  if (!resolvedPrompt)
    throw new Error("Gemini node requires a user prompt in data.");

  const google = createGoogleGenerativeAI({ apiKey: credential });

  logger.debug("Gemini generateText", { model });

  // Build messages array for proper system + user prompt handling
  const messages = [];
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: resolvedPrompt });

  const result = await generateText({
    model: google(model),
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
