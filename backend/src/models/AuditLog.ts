import { Schema, model, Document, Types } from "mongoose";
import { AuditAction } from "../types";

export interface IAuditLog extends Document {
  actor: Types.ObjectId | null;
  action: AuditAction;
  targetUser: Types.ObjectId | null;
  ip: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    actor: { type: Schema.Types.ObjectId, ref: "User", default: null },
    action: { type: String, enum: Object.values(AuditAction), required: true },
    targetUser: { type: Schema.Types.ObjectId, ref: "User", default: null },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const AuditLog = model<IAuditLog>("AuditLog", auditLogSchema);
