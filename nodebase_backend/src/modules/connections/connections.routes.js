import { Router } from "express";
import * as connectionsController from "./connections.controller.js";
import verifyToken from "../../middleware/auth.js";
import validate from "../../middleware/validate.js";
import { createConnectionSchema } from "./connections.validation.js";

const router = Router();

router.use(verifyToken);

// Create a connection inside a workflow
router.post(
  "/workflows/:workflowId/connections",
  validate(createConnectionSchema),
  connectionsController.createConnection,
);

// Delete a connection by its own ID
router.delete("/:id", connectionsController.removeConnection);

export default router;
