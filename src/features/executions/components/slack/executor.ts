import type { NodeExecutor } from "@/features/executions/types";

// TODO: Implement Slack executor via custom backend API
export const slackExecutor: NodeExecutor = async ({ context }) => context;
