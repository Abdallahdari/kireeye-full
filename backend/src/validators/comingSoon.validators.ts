import { z } from "zod";
import { Types } from "mongoose";

const objectIdSchema = z.string().refine((val) => Types.ObjectId.isValid(val), {
  message: "Invalid id",
});

// Multipart form fields arrive as strings.
const formBoolean = z.preprocess((val) => (val === "true" ? true : val === "false" ? false : val), z.boolean());
const formInt = z.preprocess(
  (val) => (typeof val === "string" && val.trim() === "" ? undefined : val === undefined ? val : Number(val)),
  z.number({ invalid_type_error: "Must be a number" }).int().min(0).max(1000)
);

// An internal path ("/properties?city=Mogadishu") or an absolute http(s) URL.
const linkSchema = z
  .string()
  .trim()
  .max(300)
  .refine((val) => val === "" || (val.startsWith("/") && !val.startsWith("//")) || /^https?:\/\//i.test(val), {
    message: "Link must start with / or http(s)://",
  });

const fields = {
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(300),
  location: z.string().trim().max(80),
  link: linkSchema,
  isActive: formBoolean,
  order: formInt,
};

export const createComingSoonSchema = z.object({
  body: z.object({
    title: fields.title,
    description: fields.description.optional(),
    location: fields.location.optional(),
    link: fields.link.optional(),
    isActive: fields.isActive.optional(),
    order: fields.order.optional(),
  }),
});

export const updateComingSoonSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    title: fields.title.optional(),
    description: fields.description.optional(),
    location: fields.location.optional(),
    link: fields.link.optional(),
    isActive: fields.isActive.optional(),
    order: fields.order.optional(),
  }),
});

export const comingSoonIdParamsSchema = z.object({
  params: z.object({ id: objectIdSchema }),
});

export type CreateComingSoonInput = z.infer<typeof createComingSoonSchema>["body"];
export type UpdateComingSoonInput = z.infer<typeof updateComingSoonSchema>["body"];
