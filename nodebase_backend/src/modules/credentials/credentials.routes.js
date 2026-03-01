import { Router } from "express";
import * as credentialsController from "./credentials.controller.js";
import verifyToken from "../../middleware/auth.js";
import validate from "../../middleware/validate.js";
import {
  createCredentialSchema,
  updateCredentialSchema,
} from "./credentials.validation.js";

const router = Router();

router.use(verifyToken);

router.get("/", credentialsController.getCredentials);
router.post(
  "/",
  validate(createCredentialSchema),
  credentialsController.createCredential,
);
router.get("/type/:type", credentialsController.getCredentialsByType);
router.get("/:id", credentialsController.getCredential);
router.patch(
  "/:id",
  validate(updateCredentialSchema),
  credentialsController.updateCredential,
);
router.delete("/:id", credentialsController.removeCredential);

export default router;
