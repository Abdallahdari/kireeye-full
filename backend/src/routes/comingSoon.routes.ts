import { Router } from "express";
import * as comingSoonController from "../controllers/comingSoon.controller";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/requireRole";
import { uploadComingSoonImage, discardUploadsOnError } from "../middleware/upload";
import { Role } from "../types";
import {
  createComingSoonSchema,
  updateComingSoonSchema,
  comingSoonIdParamsSchema,
} from "../validators/comingSoon.validators";

const router = Router();

/**
 * @openapi
 * /coming-soon:
 *   get:
 *     tags: [Coming soon]
 *     summary: Active "Coming soon" slides for the home page hero (public)
 *     responses:
 *       200: { description: Slides sorted by order }
 *   post:
 *     tags: [Coming soon]
 *     summary: Add a slide (SUPER_ADMIN only)
 *     security: [{ cookieAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [title, image]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               location: { type: string }
 *               link: { type: string, description: Internal path (/...) or http(s) URL }
 *               isActive: { type: boolean }
 *               order: { type: integer }
 *               image: { type: string, format: binary, description: JPEG/PNG/WebP, 2MB max }
 *     responses:
 *       201: { description: Slide added }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get("/", comingSoonController.listPublicComingSoon);
router.post(
  "/",
  authenticate,
  requireRole(Role.SUPER_ADMIN),
  uploadComingSoonImage,
  validate(createComingSoonSchema),
  comingSoonController.createComingSoon
);

/**
 * @openapi
 * /coming-soon/all:
 *   get:
 *     tags: [Coming soon]
 *     summary: Every slide, including hidden ones (SUPER_ADMIN only)
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: Slides sorted by order }
 */
router.get("/all", authenticate, requireRole(Role.SUPER_ADMIN), comingSoonController.listAllComingSoon);

/**
 * @openapi
 * /coming-soon/{id}:
 *   patch:
 *     tags: [Coming soon]
 *     summary: Edit a slide; send a new image to replace it (SUPER_ADMIN only)
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: Slide updated }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   delete:
 *     tags: [Coming soon]
 *     summary: Delete a slide and its image (SUPER_ADMIN only)
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: Slide deleted }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch(
  "/:id",
  authenticate,
  requireRole(Role.SUPER_ADMIN),
  uploadComingSoonImage,
  validate(updateComingSoonSchema),
  comingSoonController.updateComingSoon
);
router.delete(
  "/:id",
  authenticate,
  requireRole(Role.SUPER_ADMIN),
  validate(comingSoonIdParamsSchema),
  comingSoonController.deleteComingSoon
);

router.use(discardUploadsOnError);

export default router;
