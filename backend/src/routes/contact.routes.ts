import { Router } from "express";
import * as contactController from "../controllers/contact.controller";
import { validate } from "../middleware/validate";
import { authRateLimiter } from "../middleware/rateLimit";
import { contactSchema } from "../validators/contact.validators";

const router = Router();

/**
 * @openapi
 * /contact:
 *   post:
 *     tags: [Contact]
 *     summary: Send a message to the Kireeye team (public)
 *     description: Emails the message to CONTACT_EMAIL (falls back to SMTP_USER). Replies go to the sender's email.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, topic, message]
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               phone: { type: string }
 *               topic: { type: string, enum: [GENERAL, RENTING, LISTING, BILLING, SUPPORT] }
 *               message: { type: string }
 *     responses:
 *       200: { description: Message sent }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       429: { $ref: '#/components/responses/TooManyRequests' }
 */
router.post("/", authRateLimiter, validate(contactSchema), contactController.submitContact);

export default router;
