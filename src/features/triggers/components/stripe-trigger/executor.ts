import type { NodeExecutor } from "@/features/executions/types";

// TODO: Implement Stripe trigger via custom backend webhook
export const stripeTriggerExecutor: NodeExecutor = async ({ context }) => context;
