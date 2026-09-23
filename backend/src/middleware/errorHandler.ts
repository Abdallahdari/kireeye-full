import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import { logger } from "../utils/logger";
import { env } from "../config/env";

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ success: false, message: err.message });
    return;
  }

  if (err && typeof err === "object" && (err as { code?: number }).code === 11000) {
    res.status(409).json({ success: false, message: "Duplicate value: this record already exists" });
    return;
  }

  if (err && typeof err === "object" && (err as { name?: string }).name === "ValidationError") {
    res.status(400).json({ success: false, message: (err as Error).message });
    return;
  }

  logger.error("Unhandled error", err);

  res.status(500).json({
    success: false,
    message: env.isProduction ? "Internal server error" : (err as Error)?.message ?? "Internal server error",
  });
}
