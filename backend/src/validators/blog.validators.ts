import { z } from "zod";
import { Types } from "mongoose";

const objectIdSchema = z.string().refine((val) => Types.ObjectId.isValid(val), {
  message: "Invalid id",
});

// Multipart form fields arrive as strings.
const formBoolean = z.preprocess((val) => (val === "true" ? true : val === "false" ? false : val), z.boolean());

const fields = {
  title: z.string().trim().min(3).max(160),
  excerpt: z.string().trim().min(10, "Please write a short summary").max(300),
  content: z.string().trim().min(50, "Please write a bit more").max(20_000),
  isPublished: formBoolean,
  // true removes the current cover image (when no new one is uploaded).
  removeImage: formBoolean,
};

export const createBlogPostSchema = z.object({
  body: z.object({
    title: fields.title,
    excerpt: fields.excerpt,
    content: fields.content,
    isPublished: fields.isPublished.optional(),
  }),
});

export const updateBlogPostSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    title: fields.title.optional(),
    excerpt: fields.excerpt.optional(),
    content: fields.content.optional(),
    isPublished: fields.isPublished.optional(),
    removeImage: fields.removeImage.optional(),
  }),
});

export const blogPostIdParamsSchema = z.object({
  params: z.object({ id: objectIdSchema }),
});

export const blogPostSlugParamsSchema = z.object({
  params: z.object({ slug: z.string().trim().min(1).max(200) }),
});

export const listBlogPostsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
  }),
});

export type CreateBlogPostInput = z.infer<typeof createBlogPostSchema>["body"];
export type UpdateBlogPostInput = z.infer<typeof updateBlogPostSchema>["body"];
