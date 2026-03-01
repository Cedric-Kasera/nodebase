import { useExecutionsParams } from "./use-executions-params";

// Stubbed types matching the original API shape
// TODO: Replace with real API calls when custom backend is ready
export type Execution = {
  id: string;
  workflowId: string;
  status: "RUNNING" | "SUCCESS" | "FAILED";
  startedAt: Date;
  completedAt: Date | null;
  error: string | null;
  output: unknown;
};

export const useSuspenseExecutions = () => {
  const [params] = useExecutionsParams();
  void params;
  return { data: { items: [] as Execution[], total: 0 } };
};

export const useSuspenseExecution = (_id: string) => ({
  data: null as Execution | null,
});
