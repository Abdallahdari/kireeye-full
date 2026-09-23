import { Types } from "mongoose";
import { AuditLog } from "../models/AuditLog";
import { AuditAction } from "../types";

interface RecordAuditLogInput {
  actor?: Types.ObjectId | string | null;
  action: AuditAction;
  targetUser?: Types.ObjectId | string | null;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}

export async function recordAuditLog(input: RecordAuditLogInput): Promise<void> {
  await AuditLog.create({
    actor: input.actor ?? null,
    action: input.action,
    targetUser: input.targetUser ?? null,
    ip: input.ip ?? null,
    userAgent: input.userAgent ?? null,
    metadata: input.metadata ?? {},
  });
}
