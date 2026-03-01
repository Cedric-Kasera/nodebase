import logger from "../../utils/logger.js";

/**
 * Slack executor — sends a message to a Slack webhook URL.
 *
 * Expected node.data shape:
 * {
 *   webhookUrl: string,
 *   text: string,
 *   blocks?: Array  (Slack Block Kit blocks, optional)
 * }
 */
export const executeSlack = async ({ node }) => {
  const { webhookUrl, text, blocks } = node.data;

  if (!webhookUrl)
    throw new Error("Slack node requires a `webhookUrl` in data.");
  if (!text && !blocks)
    throw new Error("Slack node requires `text` or `blocks` in data.");

  const payload = {};
  if (text) payload.text = text;
  if (blocks) payload.blocks = blocks;

  logger.debug("Slack webhook", {
    webhookUrl: webhookUrl.slice(0, 40) + "...",
  });

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Slack webhook failed (${response.status}): ${body}`);
  }

  return { sent: true, status: response.status };
};
