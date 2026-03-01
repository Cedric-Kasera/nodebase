import type { NodeExecutor } from "@/features/executions/types";

// TODO: Implement Anthropic executor via custom backend AI API
export const anthropicExecutor: NodeExecutor = async ({ context }) => context;
