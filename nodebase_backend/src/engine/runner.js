import { buildExecutionOrder } from "./toposort.js";
import { resolveTemplates } from "./template.js";
import { getExecutorForType } from "../inngest/executors/index.js";
import logger from "../utils/logger.js";

/**
 * Run a workflow to completion, executing each node in topological order.
 *
 * @param {object}   opts
 * @param {object}   opts.workflow       – { id, nodes, connections }
 * @param {object}   opts.credentials    – { [nodeId]: decryptedCredentialValue }
 * @param {Function} opts.onNodeStart    – (nodeId) => void
 * @param {Function} opts.onNodeComplete – (nodeId, output) => void
 * @param {Function} opts.onNodeError    – (nodeId, error) => void
 * @returns {object} – final context with all node outputs
 */
export const runWorkflow = async ({
  workflow,
  credentials,
  triggerPayload = {},
  onNodeStart,
  onNodeComplete,
  onNodeError,
}) => {
  const { nodes, connections } = workflow;
  const orderedIds = buildExecutionOrder(nodes, connections);

  // Lookup map: nodeId → node row
  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));

  // Execution context accumulates outputs keyed by node ID
  const context = { nodes: {} };

  for (const nodeId of orderedIds) {
    const node = nodeMap[nodeId];
    if (!node) continue;

    // Skip the INITIAL placeholder node — it carries no logic
    if (node.type === "INITIAL") continue;

    await onNodeStart?.(nodeId);

    try {
      // Resolve {{template}} placeholders in node.data using prior outputs
      const resolvedData = resolveTemplates(node.data ?? {}, context);

      const executor = getExecutorForType(node.type);

      const output = await executor({
        node: { ...node, data: resolvedData },
        credential: credentials[nodeId] ?? null,
        context,
        triggerPayload,
      });

      context.nodes[nodeId] = { output };
      await onNodeComplete?.(nodeId, output);
    } catch (err) {
      logger.error(`Node ${nodeId} (${node.type}) failed`, {
        error: err.message,
      });
      await onNodeError?.(nodeId, err);

      // Abort the rest of the workflow on first failure
      throw err;
    }
  }

  return context;
};
