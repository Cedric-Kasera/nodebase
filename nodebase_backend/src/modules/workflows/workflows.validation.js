import { z } from "zod";

export const createWorkflowSchema = z.object({
  name: z.string().min(1, "Workflow name is required").max(255),
});

export const saveWorkflowSchema = z.object({
  nodes: z.array(
    z.object({
      id: z.string().min(1),
      type: z.string().min(1),
      name: z.string().default(""),
      position: z.object({ x: z.number(), y: z.number() }),
      data: z.record(z.string(), z.any()).default({}),
      credential_id: z.string().nullable().optional(),
    }),
  ),
  connections: z.array(
    z.object({
      id: z.string().min(1),
      from_node_id: z.string().min(1),
      to_node_id: z.string().min(1),
      from_output: z.string().default("main"),
      to_input: z.string().default("main"),
    }),
  ),
});

export const updateWorkflowNameSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
});
