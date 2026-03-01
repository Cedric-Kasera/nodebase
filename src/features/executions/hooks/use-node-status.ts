// Stub use-node-status hook — inngest/realtime removed
// TODO: Replace with custom backend SSE/WebSocket when implementing execution status streaming

export type NodeStatus = "idle" | "loading" | "success" | "error";

export const useNodeStatus = (_params: {
  nodeId: string;
  channel?: string;
  topic?: string;
}): NodeStatus => {
  // Real-time status tracking will be re-implemented with custom backend SSE or WebSocket
  return "idle";
};
