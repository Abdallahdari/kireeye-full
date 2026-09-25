import { User, IUser } from "../models/User";
import { AppError } from "../utils/AppError";
import { signToken } from "../utils/jwt";
import { generateSecureToken, hashToken } from "../utils/token";
import { sendVerificationEmail, sendPasswordResetEmail } from "./mailer.service";
import { RegisterInput } from "../validators/auth.validators";
import { env } from "../config/env";
import { Role, BusinessApprovalStatus } from "../types";

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

export async function registerUser(input: RegisterInput): Promise<IUser> {
  const existing = await User.findOne({ email: input.email.toLowerCase() });
  if (existing) {
    throw new AppError("An account with this email already exists", 409);
  }

  const user = await User.create({
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email.toLowerCase(),
    phone: input.phone,
    city: input.city,
    password: input.password,
    role: input.role,
    businessApproval: input.role === Role.BUSINESS ? BusinessApprovalStatus.PENDING : null,
    // No verification email is sent on sign-up, so accounts start out verified.
    isEmailVerified: true,
    isActive: true,
  });

  return user;
}

export async function loginUser(
  email: string,
  password: string
): Promise<{ user: IUser; token: string }> {
  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

  const genericError = () => new AppError("Invalid email or password", 401);

  if (!user) {
    throw genericError();
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw genericError();
  }

  if (!user.isActive) {
    throw new AppError("Your account has been suspended. Please contact support.", 403);
  }

  if (user.role === Role.BUSINESS) {
    if (user.businessApproval === BusinessApprovalStatus.PENDING) {
      throw new AppError(
        "Your business account is awaiting admin approval. We'll email you once it's reviewed.",
        403
      );
    }
    if (user.businessApproval === BusinessApprovalStatus.REJECTED) {
      throw new AppError("Your business registration wasn't approved. Contact support for details.", 403);
    }
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = signToken({ sub: user._id.toString(), role: user.role });

  return { user, token };
}

export async function requestPasswordReset(email: string): Promise<void> {
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    return;
  }

  const { raw, hash } = generateSecureToken();
  user.passwordResetTokenHash = hash;
  user.passwordResetExpires = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
  await user.save();

  const resetUrl = `${env.clientUrl}/reset-password?token=${raw}`;
  sendPasswordResetEmail(user.email, resetUrl);
}

export async function resetPassword(rawToken: string, newPassword: string): Promise<void> {
  const hash = hashToken(rawToken);

  const user = await User.findOne({
    passwordResetTokenHash: hash,
    passwordResetExpires: { $gt: new Date() },
  }).select("+passwordResetTokenHash +passwordResetExpires");

  if (!user) {
    throw new AppError("Invalid or expired reset token", 400);
  }

  user.password = newPassword;
  user.passwordResetTokenHash = null;
  user.passwordResetExpires = null;
  await user.save();
}

export async function verifyEmail(rawToken: string): Promise<IUser> {
  const hash = hashToken(rawToken);

  const user = await User.findOne({
    emailVerificationTokenHash: hash,
    emailVerificationExpires: { $gt: new Date() },
  }).select("+emailVerificationTokenHash +emailVerificationExpires");

  if (!user) {
    throw new AppError("Invalid or expired verification token", 400);
  }

  user.isEmailVerified = true;
  user.emailVerificationTokenHash = null;
  user.emailVerificationExpires = null;
  await user.save();

  return user;
}

export async function resendVerification(email: string): Promise<void> {
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user || user.isEmailVerified) {
    return;
  }

  const { raw, hash } = generateSecureToken();
  user.emailVerificationTokenHash = hash;
  user.emailVerificationExpires = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS);
  await user.save();

  const verifyUrl = `${env.clientUrl}/verify-email?token=${raw}`;
  sendVerificationEmail(user.email, verifyUrl);
}
