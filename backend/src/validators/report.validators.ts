import { z } from "zod";
import { Types } from "mongoose";
import { ReportReason, ReportStatus } from "../types";

const objectIdSchema = z.string().refine((val) => Types.ObjectId.isValid(val), {
  message: "Invalid id",
});

// A report targets either a user (by email) or a listing (by id) — exactly one.
export const createReportSchema = z.object({
  body: z
    .object({
      reportedEmail: z.string().trim().email().optional(),
      propertyId: objectIdSchema.optional(),
      reason: z.enum([
        ReportReason.SCAM_OR_FRAUD,
        ReportReason.HARASSMENT,
        ReportReason.SUSPICIOUS_ACTIVITY,
        ReportReason.FAKE_LISTING,
        ReportReason.OTHER,
      ]),
      details: z.string().trim().min(10, "Please provide a bit more detail").max(1000),
    })
    .refine((body) => Boolean(body.reportedEmail) !== Boolean(body.propertyId), {
      message: "Provide either reportedEmail or propertyId",
    }),
});

export const listReportsQuerySchema = z.object({
  query: z.object({
    status: z.enum([ReportStatus.OPEN, ReportStatus.RESOLVED, ReportStatus.DISMISSED]).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});

export const updateReportStatusSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    status: z.enum([ReportStatus.OPEN, ReportStatus.RESOLVED, ReportStatus.DISMISSED]),
  }),
});

export type CreateReportInput = z.infer<typeof createReportSchema>["body"];
