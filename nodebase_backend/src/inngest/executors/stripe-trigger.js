/**
 * Stripe trigger executor — passes through the webhook event payload.
 */
export const executeStripeTrigger = async ({ node, triggerPayload }) => {
  return {
    triggered: true,
    nodeId: node.id,
    type: node.type,
    payload: triggerPayload?.event ?? node.data?.payload ?? {},
    source: triggerPayload?.source ?? "manual",
    receivedAt: triggerPayload?.receivedAt ?? new Date().toISOString(),
  };
};
