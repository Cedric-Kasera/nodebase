import { NodeType } from "../../config/constants.js";
import { executeManualTrigger } from "./manual-trigger.js";
import { executeHttpRequest } from "./http-request.js";
import { executeOpenAI } from "./openai.js";
import { executeAnthropic } from "./anthropic.js";
import { executeGemini } from "./gemini.js";
import { executeDiscord } from "./discord.js";
import { executeSlack } from "./slack.js";
import { executeGoogleFormTrigger } from "./google-form-trigger.js";
import { executeStripeTrigger } from "./stripe-trigger.js";

const executorMap = {
  [NodeType.MANUAL_TRIGGER]: executeManualTrigger,
  [NodeType.HTTP_REQUEST]: executeHttpRequest,
  [NodeType.OPENAI]: executeOpenAI,
  [NodeType.ANTHROPIC]: executeAnthropic,
  [NodeType.GEMINI]: executeGemini,
  [NodeType.DISCORD]: executeDiscord,
  [NodeType.SLACK]: executeSlack,
  [NodeType.GOOGLE_FORM_TRIGGER]: executeGoogleFormTrigger,
  [NodeType.STRIPE_TRIGGER]: executeStripeTrigger,
};

/**
 * Return the executor function for a given node type.
 * @param {string} type – a NodeType enum value
 * @returns {Function}
 */
export const getExecutorForType = (type) => {
  const executor = executorMap[type];
  if (!executor) {
    throw new Error(`No executor registered for node type: ${type}`);
  }
  return executor;
};
