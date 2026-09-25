import { Router } from "express";
import * as propertyController from "../controllers/property.controller";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/requireRole";
import { uploadPropertyImages, discardUploadsOnError } from "../middleware/upload";
import { requirePublishAllowance } from "../controllers/billing.controller";
import { Role } from "../types";
import {
  createPropertySchema,
  listPropertiesQuerySchema,
  adminListPropertiesQuerySchema,
  exportPropertiesQuerySchema,
  propertyIdParamsSchema,
} from "../validators/property.validators";

const router = Router();

/**
 * @openapi
 * /properties:
 *   get:
 *     tags: [Properties]
 *     summary: List published listings (public)
 *     description: Includes the poster's name and phone. Listings from suspended accounts are hidden.
 *     parameters:
 *       - in: query
 *         name: city
 *         schema: { type: string }
 *         description: Exact match, case-insensitive
 *       - in: query
 *         name: neighborhood
 *         schema: { type: string }
 *         description: Partial match, case-insensitive
 *       - in: query
 *         name: minPrice
 *         schema: { type: number }
 *       - in: query
 *         name: maxPrice
 *         schema: { type: number }
 *       - in: query
 *         name: minRooms
 *         schema: { type: integer }
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 50, default: 12 }
 *     responses:
 *       200: { description: Paginated list of listings }
 *   post:
 *     tags: [Properties]
 *     summary: Create a listing with images (approved BUSINESS only)
 *     security: [{ cookieAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [city, neighborhood, description, phone, rooms, bathrooms, price, deposit, images]
 *             properties:
 *               city: { type: string }
 *               neighborhood: { type: string }
 *               description: { type: string }
 *               phone: { type: string, example: "+252612345678" }
 *               rooms: { type: integer }
 *               bathrooms: { type: integer }
 *               price: { type: number, description: Monthly rent in USD }
 *               deposit: { type: number, description: Security deposit in USD }
 *               images:
 *                 type: array
 *                 description: 1–4 JPEG/PNG/WebP images, 2MB each
 *                 items: { type: string, format: binary }
 *     responses:
 *       201: { description: Listing published }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       402: { description: Free listings used up and no active subscription }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get("/", validate(listPropertiesQuerySchema), propertyController.listPublicProperties);
router.post(
  "/",
  authenticate,
  requireRole(Role.BUSINESS),
  // Checked before the upload so a blocked business isn't made to upload first.
  requirePublishAllowance,
  uploadPropertyImages,
  validate(createPropertySchema),
  propertyController.createProperty
);

/**
 * @openapi
 * /properties/mine:
 *   get:
 *     tags: [Properties]
 *     summary: List the current business's own listings
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: Paginated list of listings }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get(
  "/mine",
  authenticate,
  requireRole(Role.BUSINESS),
  validate(listPropertiesQuerySchema),
  propertyController.listMyProperties
);

/**
 * @openapi
 * /properties/all:
 *   get:
 *     tags: [Properties]
 *     summary: List every listing with full poster details (SUPER_ADMIN only)
 *     description: Accepts the public filters plus q (poster name/email/phone or listing phone) and provider (mobile network, e.g. Hormuud).
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *       - in: query
 *         name: provider
 *         schema: { type: string, example: Hormuud }
 *       - in: query
 *         name: city
 *         schema: { type: string }
 *     responses:
 *       200: { description: Paginated list of listings }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get(
  "/all",
  authenticate,
  requireRole(Role.SUPER_ADMIN),
  validate(adminListPropertiesQuerySchema),
  propertyController.listAllProperties
);

/**
 * @openapi
 * /properties/export:
 *   get:
 *     tags: [Properties]
 *     summary: Download listings and poster details as an Excel file (SUPER_ADMIN only)
 *     description: Same filters as /properties/all (without paging). Each download is recorded in the audit log.
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200:
 *         description: .xlsx workbook
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema: { type: string, format: binary }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get(
  "/export",
  authenticate,
  requireRole(Role.SUPER_ADMIN),
  validate(exportPropertiesQuerySchema),
  propertyController.exportProperties
);

/**
 * @openapi
 * /properties/{id}:
 *   get:
 *     tags: [Properties]
 *     summary: Get a single listing with its poster's name and phone (public)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: The listing }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   delete:
 *     tags: [Properties]
 *     summary: Delete a listing and its images (owner or SUPER_ADMIN)
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Listing deleted }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get("/:id", validate(propertyIdParamsSchema), propertyController.getProperty);
router.delete(
  "/:id",
  authenticate,
  requireRole(Role.BUSINESS, Role.SUPER_ADMIN),
  validate(propertyIdParamsSchema),
  propertyController.deleteProperty
);

router.use(discardUploadsOnError);

export default router;
