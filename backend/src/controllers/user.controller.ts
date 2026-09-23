import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import * as userService from "../services/user.service";
import { recordAuditLog } from "../services/auditLog.service";
import { sendBusinessApprovalEmail } from "../services/mailer.service";
import { AuditAction, Role, BusinessApprovalStatus } from "../types";

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const { role, businessApproval, page, limit } = req.query as {
    role?: Role;
    businessApproval?: BusinessApprovalStatus;
    page?: number;
    limit?: number;
  };

  const result = await userService.listUsers({ role, businessApproval, page, limit });

  res.status(200).json({
    success: true,
    data: {
      users: result.users,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        pages: result.pages,
      },
    },
  });
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.getUserById(req.params.id);
  res.status(200).json({ success: true, data: { user } });
});

export const updateUserStatus = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }

  const { isActive } = req.body as { isActive: boolean };
  const user = await userService.updateUserStatus(req.params.id, isActive, req.user._id.toString());

  await recordAuditLog({
    actor: req.user._id,
    action: AuditAction.USER_STATUS_CHANGED,
    targetUser: user._id,
    ip: req.ip,
    userAgent: req.get("user-agent"),
    metadata: { isActive },
  });

  res.status(200).json({ success: true, message: "User status updated", data: { user } });
});

export const updateUserRole = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }

  const { role } = req.body as { role: Role };
  const user = await userService.updateUserRole(req.params.id, role, req.user._id.toString());

  await recordAuditLog({
    actor: req.user._id,
    action: AuditAction.USER_ROLE_CHANGED,
    targetUser: user._id,
    ip: req.ip,
    userAgent: req.get("user-agent"),
    metadata: { role },
  });

  res.status(200).json({ success: true, message: "User role updated", data: { user } });
});

export const updateBusinessApproval = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }

  const { status } = req.body as { status: BusinessApprovalStatus };
  const user = await userService.updateBusinessApproval(req.params.id, status, req.user._id.toString());

  sendBusinessApprovalEmail(user.email, status === BusinessApprovalStatus.APPROVED);

  await recordAuditLog({
    actor: req.user._id,
    action:
      status === BusinessApprovalStatus.APPROVED ? AuditAction.BUSINESS_APPROVED : AuditAction.BUSINESS_REJECTED,
    targetUser: user._id,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });

  res.status(200).json({ success: true, message: "Business approval updated", data: { user } });
});
