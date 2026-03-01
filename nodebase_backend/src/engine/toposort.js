import toposort from "toposort";

/**
 * Build an execution-order array from nodes + connections.
 *
 * @param {Array} nodes       – rows from the "node" table
 * @param {Array} connections – rows from the "connection" table
 * @returns {string[]}        – ordered node IDs (trigger first → leaf last)
 */
export const buildExecutionOrder = (nodes, connections) => {
  const nodeIds = new Set(nodes.map((n) => n.id));

  // Build edge list for toposort: [from, to]
  const edges = connections
    .filter((c) => nodeIds.has(c.from_node_id) && nodeIds.has(c.to_node_id))
    .map((c) => [c.from_node_id, c.to_node_id]);

  // toposort returns an array from sources → sinks
  const sorted = toposort.array([...nodeIds], edges);

  return sorted;
};
