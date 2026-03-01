/**
 * Google Form trigger executor — passes through the webhook payload.
 */
export const executeGoogleFormTrigger = async ({ node, triggerPayload }) => {
  return {
    triggered: true,
    nodeId: node.id,
    type: node.type,
    payload: triggerPayload?.formData ?? node.data?.payload ?? {},
    source: triggerPayload?.source ?? "manual",
    receivedAt: triggerPayload?.receivedAt ?? new Date().toISOString(),
  };
};
