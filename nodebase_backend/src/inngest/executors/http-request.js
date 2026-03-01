import logger from "../../utils/logger.js";

/**
 * HTTP Request executor.
 *
 * Expected node.data shape:
 * {
 *   url: string,
 *   method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
 *   headers?: Record<string, string>,
 *   body?: any,
 *   timeout?: number  (ms, default 30 000)
 * }
 */
export const executeHttpRequest = async ({ node }) => {
  const {
    url,
    method = "GET",
    headers = {},
    body,
    timeout = 30_000,
  } = node.data;

  if (!url) throw new Error("HTTP Request node requires a `url` in data.");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const fetchOpts = {
      method: method.toUpperCase(),
      headers: { "Content-Type": "application/json", ...headers },
      signal: controller.signal,
    };

    if (body && !["GET", "HEAD"].includes(fetchOpts.method)) {
      fetchOpts.body = typeof body === "string" ? body : JSON.stringify(body);
    }

    logger.debug("HTTP Request", { url, method: fetchOpts.method });

    const response = await fetch(url, fetchOpts);
    const contentType = response.headers.get("content-type") || "";
    let data;

    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    return {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data,
    };
  } finally {
    clearTimeout(timer);
  }
};
