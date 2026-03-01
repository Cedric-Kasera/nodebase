import type { NodeExecutor } from "@/features/executions/types";

// TODO: Implement Gemini executor via custom backend AI API
export const geminiExecutor: NodeExecutor = async ({ context }) => context;
