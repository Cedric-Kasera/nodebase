import type { NodeExecutor } from "@/features/executions/types";

// TODO: Implement manual trigger via custom backend websocket/SSE
export const manualTriggerExecutor: NodeExecutor = async ({ context }) => context;
