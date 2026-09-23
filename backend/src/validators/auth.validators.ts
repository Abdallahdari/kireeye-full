import { z } from "zod";
import { Role } from "../types";
import { normalizeSomaliPhone } from "../utils/somaliPhone";
import { SOMALI_CITIES } from "../utils/somaliCities";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128)
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[0-9]/, "Password must contain a number");

export const somaliPhoneSchema = z
  .string()
  .trim()
  .min(6)
  .max(20)
  .transform((val, ctx) => {
    const normalized = normalizeSomaliPhone(val);
    if (!normalized) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter a valid Somali mobile number" });
      return z.NEVER;
    }
    if (!normalized.provider) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Unrecognized mobile network prefix",
      });
      return z.NEVER;
    }
    return normalized.e164;
  });

export const registerSchema = z.object({
  body: z.object({
    firstName: z.string().trim().min(1).max(60),
    lastName: z.string().trim().min(1).max(60),
    email: z.string().trim().email().max(255),
    phone: somaliPhoneSchema,
    city: z.enum(SOMALI_CITIES, { errorMap: () => ({ message: "Please choose a city from the list" }) }),
    password: passwordSchema,
    role: z.enum([Role.BUSINESS, Role.TENANT]),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email(),
    password: z.string().min(1, "Password is required"),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().trim().email(),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, "Token is required"),
    password: passwordSchema,
  }),
});

export const verifyEmailSchema = z.object({
  body: z.object({
    token: z.string().min(1, "Token is required"),
  }),
});

export const resendVerificationSchema = z.object({
  body: z.object({
    email: z.string().trim().email(),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>["body"];
export type LoginInput = z.infer<typeof loginSchema>["body"];
