import { Router } from "express";
import * as blogController from "../controllers/blog.controller";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/requireRole";
import { uploadBlogImage, discardUploadsOnError } from "../middleware/upload";
import { Role } from "../types";
import {
  createBlogPostSchema,
  updateBlogPostSchema,
  blogPostIdParamsSchema,
  blogPostSlugParamsSchema,
  listBlogPostsQuerySchema,
} from "../validators/blog.validators";

const router = Router();

/**
 * @openapi
 * /blog:
 *   get:
 *     tags: [Blog]
 *     summary: Published posts, newest first, without the full text (public)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 50, default: 9 }
 *     responses:
 *       200: { description: Paginated list of posts }
 *   post:
 *     tags: [Blog]
 *     summary: Create a post (SUPER_ADMIN only)
 *     security: [{ cookieAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [title, excerpt, content]
 *             properties:
 *               title: { type: string }
 *               excerpt: { type: string }
 *               content: { type: string, description: Plain text; blank lines separate paragraphs }
 *               isPublished: { type: boolean }
 *               image: { type: string, format: binary, description: Optional cover, JPEG/PNG/WebP, 2MB max }
 *     responses:
 *       201: { description: Post created }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get("/", validate(listBlogPostsQuerySchema), blogController.listPublishedPosts);
router.post(
  "/",
  authenticate,
  requireRole(Role.SUPER_ADMIN),
  uploadBlogImage,
  validate(createBlogPostSchema),
  blogController.createPost
);

/**
 * @openapi
 * /blog/all:
 *   get:
 *     tags: [Blog]
 *     summary: Every post, including drafts (SUPER_ADMIN only)
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: Paginated list of posts }
 */
router.get(
  "/all",
  authenticate,
  requireRole(Role.SUPER_ADMIN),
  validate(listBlogPostsQuerySchema),
  blogController.listAllPosts
);

/**
 * @openapi
 * /blog/posts/{id}:
 *   patch:
 *     tags: [Blog]
 *     summary: Edit, publish or unpublish a post (SUPER_ADMIN only)
 *     description: Send a new image to replace the cover, or removeImage=true to drop it.
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: Post updated }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   delete:
 *     tags: [Blog]
 *     summary: Delete a post and its cover image (SUPER_ADMIN only)
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: Post deleted }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch(
  "/posts/:id",
  authenticate,
  requireRole(Role.SUPER_ADMIN),
  uploadBlogImage,
  validate(updateBlogPostSchema),
  blogController.updatePost
);
router.delete(
  "/posts/:id",
  authenticate,
  requireRole(Role.SUPER_ADMIN),
  validate(blogPostIdParamsSchema),
  blogController.deletePost
);

/**
 * @openapi
 * /blog/{slug}:
 *   get:
 *     tags: [Blog]
 *     summary: A single published post with its full text (public)
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: The post }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get("/:slug", validate(blogPostSlugParamsSchema), blogController.getPublishedPost);

router.use(discardUploadsOnError);

export default router;
