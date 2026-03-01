import { inngest } from "../client.js";
import { runWorkflow } from "../../engine/runner.js";
import * as executionsService from "../../modules/executions/executions.service.js";
import * as workflowsService from "../../modules/workflows/workflows.service.js";
import { getCredentialsForWorkflow } from "../../modules/credentials/credentials.service.js";
import { sseManager } from "../../modules/executions/sse.js";
import logger from "../../utils/logger.js";

/**
 * Inngest function: "workflow.execute"
 *
 * Triggered when a user runs a workflow (POST /api/workflows/:id/execute).
 * Uses durable steps so each node execution is individually retryable.
 */
export const executeWorkflow = inngest.createFunction(
  {
    id: "execute-workflow",
    retries: 0, // workflow-level retries off — individual nodes can retry inside
  },
  { event: "workflow/execute" },
  async ({ event, step }) => {
    const { executionId, workflowId, userId, triggerPayload } = event.data;

    logger.info("Inngest: starting workflow execution", {
      executionId,
      workflowId,
    });

    // Notify any workflow-level SSE subscribers (e.g. editor open on this workflow)
    // so they can auto-subscribe to the execution-level stream.
    sseManager.sendWorkflow(workflowId, "execution:started", {
      executionId,
      workflowId,
    });

    // ── Step 1: Load the workflow graph + credentials
    const { workflow, credentials } = await step.run(
      "load-workflow",
      async () => {
        const wf = await workflowsService.getWorkflowById(workflowId, userId);
        const creds = await getCredentialsForWorkflow(wf.nodes, userId);
        return { workflow: wf, credentials: creds };
      },
    );

    // ── Step 2: Run the workflow engine
    try {
      const context = await step.run("run-engine", async () => {
        return runWorkflow({
          workflow,
          credentials,
          triggerPayload: triggerPayload ?? {},

          onNodeStart: async (nodeId) => {
            await executionsService.createNodeExecution(executionId, nodeId);
            sseManager.send(executionId, "node:start", { nodeId });
          },

          onNodeComplete: async (nodeId, output) => {
            await executionsService.updateNodeExecution(
              executionId,
              nodeId,
              "SUCCESS",
              output,
            );
            sseManager.send(executionId, "node:complete", { nodeId, output });
          },

          onNodeError: async (nodeId, error) => {
            await executionsService.updateNodeExecution(
              executionId,
              nodeId,
              "FAILED",
              null,
              error.message,
            );
            sseManager.send(executionId, "node:error", {
              nodeId,
              error: error.message,
            });
          },
        });
      });

      // ── Step 3: Mark execution as SUCCESS
      await step.run("mark-success", async () => {
        await executionsService.updateExecution(
          executionId,
          "SUCCESS",
          context,
        );
        sseManager.send(executionId, "execution:complete", {
          status: "SUCCESS",
        });
        sseManager.close(executionId);
      });

      return { success: true, executionId };
    } catch (err) {
      // ── Mark execution as FAILED
      await step.run("mark-failed", async () => {
        await executionsService.updateExecution(
          executionId,
          "FAILED",
          null,
          err.message,
          err.stack,
        );
        sseManager.send(executionId, "execution:error", {
          error: err.message,
        });
        sseManager.close(executionId);
      });

      logger.error("Workflow execution failed", {
        executionId,
        error: err.message,
      });
      return { success: false, executionId, error: err.message };
    }
  },
);
