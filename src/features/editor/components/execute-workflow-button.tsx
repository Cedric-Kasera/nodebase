import { Button } from "@/components/ui/button";
import { useExecuteWorkflow } from "@/features/workflows/hooks/use-workflows";
import { useExecutionStream } from "@/features/editor/hooks/use-execution-stream";
import { FlaskConicalIcon } from "lucide-react";

export const ExecuteWorkflowButton = ({
  workflowId,
}: {
  workflowId: string;
}) => {
  const executeWorkflow = useExecuteWorkflow();
  const { connect } = useExecutionStream();

  const handleExecute = async () => {
    const execution = await executeWorkflow.mutateAsync({ id: workflowId });
    if (execution?.id) {
      connect(execution.id);
    }
  };

  return (
    <Button
      size="lg"
      onClick={handleExecute}
      disabled={executeWorkflow.isPending}
    >
      <FlaskConicalIcon className="size-4" />
      Execute workflow
    </Button>
  );
};
