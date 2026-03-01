import logger from "../../utils/logger.js";

/**
 * Discord executor — sends a message to a Discord webhook URL.
 *
 * Expected node.data shape:
 * {
 *   webhookUrl: string,
 *   content: string,
 *   username?: string,
 *   avatarUrl?: string,
 * }
 */
export const executeDiscord = async ({ node }) => {
  const { webhookUrl, content, username, avatarUrl } = node.data;

  if (!webhookUrl)
    throw new Error("Discord node requires a `webhookUrl` in data.");
  if (!content) throw new Error("Discord node requires `content` in data.");

  const payload = { content };
  if (username) payload.username = username;
  if (avatarUrl) payload.avatar_url = avatarUrl;

  logger.debug("Discord webhook", {
    webhookUrl: webhookUrl.slice(0, 40) + "...",
  });

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Discord webhook failed (${response.status}): ${text}`);
  }

  return { sent: true, status: response.status };
};
