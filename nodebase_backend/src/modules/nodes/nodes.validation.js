import { z } from "zod";
import { NodeType } from "../../config/constants.js";

const nodeTypeValues = Object.values(NodeType);

export const createNodeSchema = z.object({
  name: z.string().min(1, "Node name is required").max(255),
  type: z.enum(nodeTypeValues, {
    errorMap: () => ({ message: "Invalid node type" }),
  }),
  position: z.object({ x: z.number(), y: z.number() }),
  data: z.record(z.any()).optional().default({}),
  credentialId: z.string().nullable().optional(),
});

export const updateNodeSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  position: z.object({ x: z.number(), y: z.number() }).optional(),
  data: z.record(z.any()).optional(),
  credentialId: z.string().nullable().optional(),
});
