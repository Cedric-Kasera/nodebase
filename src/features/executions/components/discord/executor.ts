import type { NodeExecutor } from "@/features/executions/types";

// TODO: Implement Discord executor via custom backend API
export const discordExecutor: NodeExecutor = async ({ context }) => context;
