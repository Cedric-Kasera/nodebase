import { z } from "zod";

export const createConnectionSchema = z.object({
  fromNodeId: z.string().min(1, "fromNodeId is required"),
  toNodeId: z.string().min(1, "toNodeId is required"),
  fromOutput: z.string().default("main"),
  toInput: z.string().default("main"),
});
