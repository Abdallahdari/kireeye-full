import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { setAuthCookie, clearAuthCookie } from "../utils/cookies";
import { AppError } from "../utils/AppError";
import { recordAuditLog } from "../services/auditLog.service";
import { AuditAction } from "../types";
import * as authService from "../services/auth.service";
import { RegisterInput, LoginInput } from "../validators/auth.validators";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as RegisterInput;
  const user = await authService.registerUser(input);

  await recordAuditLog({
    actor: user._id,
    action: AuditAction.REGISTER,
    targetUser: user._id,
    ip: req.ip,
    userAgent: req.get("user-agent"),
    metadata: { role: user.role },
  });

  res.status(201).json({
    success: true,
    message: "Registration successful. You can now log in.",
    data: { user },
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as LoginInput;

  try {
    const { user, token } = await authService.loginUser(email, password);

    setAuthCookie(res, token);

    await recordAuditLog({
      actor: user._id,
      action: AuditAction.LOGIN_SUCCESS,
      targetUser: user._id,
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: { user },
    });
  } catch (err) {
    await recordAuditLog({
      action: AuditAction.LOGIN_FAILURE,
      ip: req.ip,
      userAgent: req.get("user-agent"),
      metadata: { email: email.toLowerCase() },
    });
    throw err;
  }
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  clearAuthCookie(res);

  if (req.user) {
    // Clearing the cookie isn't enough — a copied token would stay valid.
    await authService.revokeSessions(req.user._id.toString());
    await recordAuditLog({
      actor: req.user._id,
      action: AuditAction.LOGOUT,
      targetUser: req.user._id,
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });
  }

  res.status(200).json({ success: true, message: "Logged out successfully" });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }

  res.status(200).json({ success: true, data: { user: req.user } });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body as { email: string };

  await authService.requestPasswordReset(email);

  await recordAuditLog({
    action: AuditAction.PASSWORD_RESET_REQUESTED,
    ip: req.ip,
    userAgent: req.get("user-agent"),
    metadata: { email: email.toLowerCase() },
  });

  res.status(200).json({
    success: true,
    message: "If an account with that email exists, a password reset link has been sent.",
  });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body as { token: string; password: string };

  await authService.resetPassword(token, password);

  await recordAuditLog({
    action: AuditAction.PASSWORD_RESET_SUCCESS,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });

  res.status(200).json({ success: true, message: "Password has been reset successfully. Please log in." });
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body as { token: string };

  const user = await authService.verifyEmail(token);

  await recordAuditLog({
    actor: user._id,
    action: AuditAction.EMAIL_VERIFIED,
    targetUser: user._id,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });

  res.status(200).json({ success: true, message: "Email verified successfully" });
});

export const resendVerification = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body as { email: string };

  await authService.resendVerification(email);

  await recordAuditLog({
    action: AuditAction.VERIFICATION_RESENT,
    ip: req.ip,
    userAgent: req.get("user-agent"),
    metadata: { email: email.toLowerCase() },
  });

  res.status(200).json({
    success: true,
    message: "If an account with that email exists and is unverified, a new verification link has been sent.",
  });
});
