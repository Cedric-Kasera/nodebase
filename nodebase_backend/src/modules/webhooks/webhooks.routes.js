import { Router } from "express";
import * as webhooksController from "./webhooks.controller.js";

const router = Router();

// Google Form submission webhook
router.post("/google-form", webhooksController.handleGoogleFormWebhook);

// Stripe event webhook
router.post("/stripe", webhooksController.handleStripeWebhook);

export default router;
