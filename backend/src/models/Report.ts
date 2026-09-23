import { Schema, model, Document, Types } from "mongoose";
import { ReportReason, ReportStatus } from "../types";

export interface IReport extends Document {
  _id: Types.ObjectId;
  reporter: Types.ObjectId;
  reportedUser: Types.ObjectId;
  // Set when the report is about a specific listing; reportedUser is then
  // the business that posted it.
  property: Types.ObjectId | null;
  reason: ReportReason;
  details: string;
  status: ReportStatus;
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<IReport>(
  {
    reporter: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reportedUser: { type: Schema.Types.ObjectId, ref: "User", required: true },
    property: { type: Schema.Types.ObjectId, ref: "Property", default: null, index: true },
    reason: { type: String, enum: Object.values(ReportReason), required: true },
    details: { type: String, required: true, trim: true, maxlength: 1000 },
    status: { type: String, enum: Object.values(ReportStatus), default: ReportStatus.OPEN },
  },
  { timestamps: true }
);

export const Report = model<IReport>("Report", reportSchema);
