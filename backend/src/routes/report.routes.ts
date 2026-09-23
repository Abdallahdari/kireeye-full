import { Router } from "express";
import * as reportController from "../controllers/report.controller";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/requireRole";
import { Role } from "../types";
import { createReportSchema, listReportsQuerySchema, updateReportStatusSchema } from "../validators/report.validators";

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /reports:
 *   post:
 *     tags: [Reports]
 *     summary: Report another user or a specific listing (any authenticated user)
 *     description: Send exactly one of reportedEmail or propertyId. A listing report is filed against the business that posted it.
 *     security: [{ cookieAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reportedEmail: { type: string, format: email }
 *               propertyId: { type: string }
 *               reason:
 *                 type: string
 *                 enum: [SCAM_OR_FRAUD, HARASSMENT, SUSPICIOUS_ACTIVITY, FAKE_LISTING, OTHER]
 *               details: { type: string }
 *     responses:
 *       201: { description: Report submitted }
 *       400: { description: Validation error, or reporting yourself / your own listing }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { description: No account found with that email, or listing not found }
 *       409: { description: You already have an open report on this listing }
 *   get:
 *     tags: [Reports]
 *     summary: List reports (SUPER_ADMIN only)
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [OPEN, RESOLVED, DISMISSED] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
 *     responses:
 *       200: { description: Paginated list of reports }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.post("/", validate(createReportSchema), reportController.createReport);
router.get(
  "/",
  requireRole(Role.SUPER_ADMIN),
  validate(listReportsQuerySchema),
  reportController.listReports
);

/**
 * @openapi
 * /reports/{id}/status:
 *   patch:
 *     tags: [Reports]
 *     summary: Update a report's status (SUPER_ADMIN only)
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, enum: [OPEN, RESOLVED, DISMISSED] }
 *     responses:
 *       200: { description: Report updated }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch(
  "/:id/status",
  requireRole(Role.SUPER_ADMIN),
  validate(updateReportStatusSchema),
  reportController.updateReportStatus
);

export default router;
