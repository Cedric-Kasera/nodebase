import type { NodeExecutor } from "@/features/executions/types";

// TODO: Implement HTTP request executor via custom backend
export const httpRequestExecutor: NodeExecutor = async ({ context }) => context;
