import { z } from "zod";

export const CONTACT_TOPICS = ["GENERAL", "RENTING", "LISTING", "BILLING", "SUPPORT"] as const;

export const contactSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, "Please enter your name").max(100),
    email: z.string().trim().email("Please enter a valid email"),
    phone: z.string().trim().max(30).optional().or(z.literal("")),
    topic: z.enum(CONTACT_TOPICS),
    message: z.string().trim().min(10, "Please write a bit more").max(2000),
  }),
});

export type ContactInput = z.infer<typeof contactSchema>["body"];
