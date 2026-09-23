import { Schema, model, Document, Types } from "mongoose";
import { PaymentMethod, PaymentStatus } from "../types";

export interface IPayment extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  // Wallet number charged (E.164), for WaafiPay payments.
  phone: string | null;
  // Subscription period this payment bought; set once it succeeds.
  periodStart: Date | null;
  periodEnd: Date | null;
  // WaafiPay response details, kept for reconciliation and support.
  transactionId: string | null;
  responseCode: string | null;
  responseMessage: string | null;
  // Manual payments: the admin who recorded it, and their note.
  recordedBy: Types.ObjectId | null;
  note: string | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: "USD" },
    method: { type: String, enum: Object.values(PaymentMethod), required: true },
    status: { type: String, enum: Object.values(PaymentStatus), required: true, default: PaymentStatus.PENDING },
    phone: { type: String, default: null },
    periodStart: { type: Date, default: null },
    periodEnd: { type: Date, default: null },
    transactionId: { type: String, default: null },
    responseCode: { type: String, default: null },
    responseMessage: { type: String, default: null },
    recordedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    note: { type: String, default: null, maxlength: 500 },
    completedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete (ret as Record<string, unknown>).__v;
        return ret;
      },
    },
  }
);

paymentSchema.index({ user: 1, status: 1 });
// At most one in-flight payment per user, enforced by the database so two
// quick clicks can't start two charges.
paymentSchema.index({ user: 1 }, { unique: true, partialFilterExpression: { status: "PENDING" }, name: "one_pending_per_user" });
paymentSchema.index({ createdAt: -1 });

export const Payment = model<IPayment>("Payment", paymentSchema);
