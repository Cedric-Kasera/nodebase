import { Router } from "express";
import * as nodesController from "./nodes.controller.js";
import verifyToken from "../../middleware/auth.js";
import validate from "../../middleware/validate.js";
import { createNodeSchema, updateNodeSchema } from "./nodes.validation.js";

const router = Router();

router.use(verifyToken);

// Create a node inside a workflow
router.post(
  "/workflows/:workflowId/nodes",
  validate(createNodeSchema),
  nodesController.createNode,
);

// Update / delete a node by its own ID
router.patch("/:id", validate(updateNodeSchema), nodesController.updateNode);
router.delete("/:id", nodesController.removeNode);

export default router;
