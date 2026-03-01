import { Router } from "express";
import * as executionsController from "./executions.controller.js";
import verifyToken from "../../middleware/auth.js";

const router = Router();

router.use(verifyToken);

router.get("/", executionsController.getExecutions);
router.get("/:id", executionsController.getExecution);
router.get("/:id/nodes", executionsController.getNodeExecutions);
router.get("/:id/stream", executionsController.streamExecution);

export default router;
