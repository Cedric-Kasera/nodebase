import type { NodeExecutor } from "@/features/executions/types";

// TODO: Implement OpenAI executor via custom backend AI API
export const openAiExecutor: NodeExecutor = async ({ context }) => context;
