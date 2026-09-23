import { Schema, model, Document, Types } from "mongoose";
import bcrypt from "bcrypt";
import { Role, BusinessApprovalStatus } from "../types";

export interface IUser extends Document {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  // Chosen at registration; null for accounts created before cities existed
  // (and the seeded super admin).
  city: string | null;
  // Billing (BUSINESS only). listingsPublishedCount is a lifetime counter —
  // deleting a listing doesn't give a free slot back.
  listingsPublishedCount: number;
  subscriptionPaidUntil: Date | null;
  // Whether listing visibility was last synced for a paid subscription; the
  // expiry sweep uses it to find subscriptions that have just lapsed.
  billingSyncedPaid: boolean;
  password: string;
  role: Role;
  businessApproval: BusinessApprovalStatus | null;
  isEmailVerified: boolean;
  isActive: boolean;
  lastLoginAt: Date | null;
  emailVerificationTokenHash: string | null;
  emailVerificationExpires: Date | null;
  passwordResetTokenHash: string | null;
  passwordResetExpires: Date | null;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const BCRYPT_SALT_ROUNDS = 12;

const userSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 60 },
    lastName: { type: String, required: true, trim: true, maxlength: 60 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: { type: String, required: true, trim: true },
    city: { type: String, trim: true, default: null, index: true },
    listingsPublishedCount: { type: Number, default: 0, min: 0 },
    subscriptionPaidUntil: { type: Date, default: null },
    billingSyncedPaid: { type: Boolean, default: false, select: false },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: Object.values(Role),
      required: true,
      default: Role.TENANT,
    },
    // Only set for BUSINESS accounts (PENDING at registration) — null for
    // TENANT/SUPER_ADMIN, who don't need admin approval to use their account.
    businessApproval: {
      type: String,
      enum: Object.values(BusinessApprovalStatus),
      default: null,
    },
    isEmailVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
    emailVerificationTokenHash: { type: String, default: null, select: false },
    emailVerificationExpires: { type: Date, default: null, select: false },
    passwordResetTokenHash: { type: String, default: null, select: false },
    passwordResetExpires: { type: Date, default: null, select: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete (ret as Record<string, unknown>).password;
        delete (ret as Record<string, unknown>).emailVerificationTokenHash;
        delete (ret as Record<string, unknown>).emailVerificationExpires;
        delete (ret as Record<string, unknown>).passwordResetTokenHash;
        delete (ret as Record<string, unknown>).passwordResetExpires;
        delete (ret as Record<string, unknown>).billingSyncedPaid;
        delete (ret as Record<string, unknown>).__v;
        return ret;
      },
    },
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, BCRYPT_SALT_ROUNDS);
  next();
});

userSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

export const User = model<IUser>("User", userSchema);
