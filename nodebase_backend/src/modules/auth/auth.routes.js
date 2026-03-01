import { Router } from "express";
import * as authController from "./auth.controller.js";
import validate from "../../middleware/validate.js";
import verifyToken from "../../middleware/auth.js";
import { registerSchema, loginSchema } from "./auth.validation.js";

const router = Router();

router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);
router.post("/logout", verifyToken, authController.logout);
router.get("/me", verifyToken, authController.me);

export default router;
