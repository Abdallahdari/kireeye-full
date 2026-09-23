import { z } from "zod";
import { Role, BusinessApprovalStatus } from "../types";
import { Types } from "mongoose";

const objectIdSchema = z.string().refine((val) => Types.ObjectId.isValid(val), {
  message: "Invalid id",
});

export const userIdParamsSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

export const updateStatusSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    isActive: z.boolean(),
  }),
});

export const updateRoleSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    role: z.enum([Role.SUPER_ADMIN, Role.BUSINESS, Role.TENANT]),
  }),
});

export const listUsersQuerySchema = z.object({
  query: z.object({
    role: z.enum([Role.SUPER_ADMIN, Role.BUSINESS, Role.TENANT]).optional(),
    businessApproval: z
      .enum([BusinessApprovalStatus.PENDING, BusinessApprovalStatus.APPROVED, BusinessApprovalStatus.REJECTED])
      .optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});

export const updateBusinessApprovalSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    status: z.enum([BusinessApprovalStatus.APPROVED, BusinessApprovalStatus.REJECTED]),
  }),
});
