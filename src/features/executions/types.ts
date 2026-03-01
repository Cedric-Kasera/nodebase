// Stubbed types — inngest/realtime removed
// TODO: Replace with custom backend realtime types when implementing execution status streaming
export type WorkflowContext = Record<string, unknown>;

// Simplified NodeExecutor type without inngest step/publish parameters
export interface NodeExecutorParams<TData = Record<string, unknown>> {
  data: TData;
  nodeId: string;
  userId?: string;
  context: WorkflowContext;
  // step and publish removed — re-add when custom backend realtime is integrated
};

export type NodeExecutor<TData = Record<string, unknown>> = (
  params: NodeExecutorParams<TData>,
) => Promise<WorkflowContext>;
