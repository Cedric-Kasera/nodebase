import { Router } from "express";
import * as usersController from "./users.controller.js";
import verifyToken from "../../middleware/auth.js";

const router = Router();

router.use(verifyToken);

router.get("/me", usersController.getMe);
router.patch("/me", usersController.updateMe);

export default router;
