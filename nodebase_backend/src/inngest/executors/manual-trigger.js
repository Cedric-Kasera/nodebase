/**
 * Manual trigger executor — simply passes through.
 * The trigger has already fired; this is a no-op entry point.
 */
export const executeManualTrigger = async ({ node }) => {
  return { triggered: true, nodeId: node.id, type: node.type };
};
