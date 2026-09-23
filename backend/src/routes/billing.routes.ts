import { Router } from "express";
import * as billingController from "../controllers/billing.controller";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/requireRole";
import { Role } from "../types";
import {
  startPaymentSchema,
  paymentIdParamsSchema,
  listBillingQuerySchema,
  exportBillingQuerySchema,
  recordManualPaymentSchema,
} from "../validators/billing.validators";

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /billing/me:
 *   get:
 *     tags: [Billing]
 *     summary: The current business's billing status, allowance and payment history
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: Billing summary }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get("/me", requireRole(Role.BUSINESS), billingController.getMyBilling);

/**
 * @openapi
 * /billing/payments:
 *   post:
 *     tags: [Billing]
 *     summary: Pay one month of subscription via WaafiPay (EVC Plus / ZAAD / SAHAL)
 *     description: Returns 202 with a PENDING payment immediately; the customer approves on their phone. Poll GET /billing/payments/{id} for the result.
 *     security: [{ cookieAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone]
 *             properties:
 *               phone: { type: string, example: "+252611234567" }
 *     responses:
 *       202: { description: Payment started }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       409: { description: A payment is already in progress }
 *       503: { description: Online payments are not configured }
 */
router.post("/payments", requireRole(Role.BUSINESS), validate(startPaymentSchema), billingController.startPayment);

/**
 * @openapi
 * /billing/payments/{id}:
 *   get:
 *     tags: [Billing]
 *     summary: Status of one of your payments (PENDING, SUCCEEDED, FAILED)
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: The payment }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get("/payments/:id", requireRole(Role.BUSINESS), validate(paymentIdParamsSchema), billingController.getPayment);

/**
 * @openapi
 * /billing/businesses:
 *   get:
 *     tags: [Billing]
 *     summary: Every business with billing status, listings and amount paid (SUPER_ADMIN only)
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [FREE, PAID, UNPAID] }
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Name, email, phone or city
 *     responses:
 *       200: { description: Paginated businesses plus totals }
 */
router.get(
  "/businesses",
  requireRole(Role.SUPER_ADMIN),
  validate(listBillingQuerySchema),
  billingController.listBusinesses
);

/**
 * @openapi
 * /billing/businesses/export:
 *   get:
 *     tags: [Billing]
 *     summary: Download businesses and their payments as Excel (SUPER_ADMIN only)
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200:
 *         description: .xlsx with "Businesses" and "Payments" sheets
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema: { type: string, format: binary }
 */
router.get(
  "/businesses/export",
  requireRole(Role.SUPER_ADMIN),
  validate(exportBillingQuerySchema),
  billingController.exportBusinesses
);

/**
 * @openapi
 * /billing/businesses/{id}/payments:
 *   post:
 *     tags: [Billing]
 *     summary: Record an off-app payment (cash, bank, direct transfer) — adds one month (SUPER_ADMIN only)
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               note: { type: string }
 *     responses:
 *       201: { description: Payment recorded }
 *       404: { description: Business not found }
 */
router.post(
  "/businesses/:id/payments",
  requireRole(Role.SUPER_ADMIN),
  validate(recordManualPaymentSchema),
  billingController.recordManualPayment
);

export default router;
