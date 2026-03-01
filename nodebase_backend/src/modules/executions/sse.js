import logger from "../../utils/logger.js";

/**
 * SSE Connection Manager
 *
 * Keeps a map of execution IDs → active SSE response objects so that
 * the Inngest background function can push real-time events to the
 * connected client.
 *
 * Also supports workflow-level subscriptions so that editors watching
 * a workflow are notified when a new execution starts (e.g. via webhook).
 */
class SSEManager {
  constructor() {
    /** @type {Map<string, import("express").Response[]>} */
    this.connections = new Map();

    /** @type {Map<string, import("express").Response[]>} */
    this.workflowConnections = new Map();
  }

  // ── Execution-level ────────────────────────────────────────────

  /**
   * Register a new SSE client for an execution.
   * @param {string} executionId
   * @param {import("express").Response} res
   */
  add(executionId, res) {
    if (!this.connections.has(executionId)) {
      this.connections.set(executionId, []);
    }
    this.connections.get(executionId).push(res);
    logger.debug("SSE client connected", { executionId });
  }

  /**
   * Remove a specific client (e.g. on disconnect).
   */
  remove(executionId, res) {
    const clients = this.connections.get(executionId);
    if (!clients) return;
    const idx = clients.indexOf(res);
    if (idx !== -1) clients.splice(idx, 1);
    if (clients.length === 0) this.connections.delete(executionId);
    logger.debug("SSE client disconnected", { executionId });
  }

  /**
   * Send an SSE event to all clients watching a given execution.
   * @param {string} executionId
   * @param {string} eventName  – e.g. "node:start", "execution:complete"
   * @param {object} data
   */
  send(executionId, eventName, data) {
    const clients = this.connections.get(executionId);
    if (!clients || clients.length === 0) return;

    const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const res of clients) {
      res.write(payload);
    }
  }

  /**
   * Close all SSE connections for an execution (workflow finished).
   */
  close(executionId) {
    const clients = this.connections.get(executionId);
    if (!clients) return;
    for (const res of clients) {
      res.write("event: done\ndata: {}\n\n");
      res.end();
    }
    this.connections.delete(executionId);
    logger.debug("SSE connections closed", { executionId });
  }

  // ── Workflow-level ─────────────────────────────────────────────

  /**
   * Register a new SSE client for a workflow (editor watching for new executions).
   * @param {string} workflowId
   * @param {import("express").Response} res
   */
  addWorkflow(workflowId, res) {
    if (!this.workflowConnections.has(workflowId)) {
      this.workflowConnections.set(workflowId, []);
    }
    this.workflowConnections.get(workflowId).push(res);
    logger.debug("SSE workflow client connected", { workflowId });
  }

  /**
   * Remove a workflow-level SSE client.
   */
  removeWorkflow(workflowId, res) {
    const clients = this.workflowConnections.get(workflowId);
    if (!clients) return;
    const idx = clients.indexOf(res);
    if (idx !== -1) clients.splice(idx, 1);
    if (clients.length === 0) this.workflowConnections.delete(workflowId);
    logger.debug("SSE workflow client disconnected", { workflowId });
  }

  /**
   * Send an SSE event to all workflow-level clients.
   * @param {string} workflowId
   * @param {string} eventName  – e.g. "execution:started"
   * @param {object} data
   */
  sendWorkflow(workflowId, eventName, data) {
    const clients = this.workflowConnections.get(workflowId);
    if (!clients || clients.length === 0) return;

    const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const res of clients) {
      res.write(payload);
    }
  }
}

export const sseManager = new SSEManager();
