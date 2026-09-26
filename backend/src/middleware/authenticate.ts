import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { AppError } from "../utils/AppError";
import { User, IUser } from "../models/User";
import { env } from "../config/env";
import { Role, BusinessApprovalStatus } from "../types";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = req.cookies?.[env.cookieName];

    if (!token) {
      throw new AppError("Authentication required", 401);
    }

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      throw new AppError("Invalid or expired session, please log in again", 401);
    }

    const user = await User.findById(payload.sub).select("+tokenVersion");

    if (!user || (payload.tv ?? 0) !== (user.tokenVersion ?? 0)) {
      throw new AppError("Invalid or expired session, please log in again", 401);
    }

    if (!user.isActive) {
      throw new AppError("Your account has been suspended", 403);
    }

    if (user.role === Role.BUSINESS && user.businessApproval !== BusinessApprovalStatus.APPROVED) {
      throw new AppError("Your business account is not yet approved", 403);
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
