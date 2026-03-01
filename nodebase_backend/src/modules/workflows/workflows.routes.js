import { Router } from "express";
import * as workflowsController from "./workflows.controller.js";
import verifyToken from "../../middleware/auth.js";
import validate from "../../middleware/validate.js";
import {
  createWorkflowSchema,
  updateWorkflowNameSchema,
  saveWorkflowSchema,
} from "./workflows.validation.js";

const router = Router();

router.use(verifyToken);

router.get("/", workflowsController.getWorkflows);
router.post(
  "/",
  validate(createWorkflowSchema),
  workflowsController.createWorkflow,
);
router.get("/:id", workflowsController.getWorkflow);
router.patch(
  "/:id/name",
  validate(updateWorkflowNameSchema),
  workflowsController.updateWorkflowName,
);
router.put(
  "/:id",
  validate(saveWorkflowSchema),
  workflowsController.saveWorkflow,
);
router.delete("/:id", workflowsController.removeWorkflow);
router.post("/:id/execute", workflowsController.executeWorkflow);
router.get("/:id/stream", workflowsController.streamWorkflow);

export default router;
