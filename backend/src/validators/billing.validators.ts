import { z } from "zod";
import { Types } from "mongoose";
import { somaliPhoneSchema } from "./auth.validators";
import { BillingStatus } from "../types";

const objectIdSchema = z.string().refine((val) => Types.ObjectId.isValid(val), {
  message: "Invalid id",
});

export const startPaymentSchema = z.object({
  body: z.object({
    // The EVC Plus / ZAAD / SAHAL wallet number to charge.
    phone: somaliPhoneSchema,
  }),
});

export const paymentIdParamsSchema = z.object({
  params: z.object({ id: objectIdSchema }),
});

const billingFilters = {
  q: z.string().trim().max(100).optional(),
  status: z.enum([BillingStatus.FREE, BillingStatus.PAID, BillingStatus.UNPAID]).optional(),
};

export const listBillingQuerySchema = z.object({
  query: z.object({
    ...billingFilters,
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});

export const exportBillingQuerySchema = z.object({
  query: z.object(billingFilters),
});

export const recordManualPaymentSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    note: z.string().trim().max(500).optional(),
  }),
});
