import rateLimit from "express-rate-limit";
import { env } from "../config/env";

export const apiRateLimiter = rateLimit({
  windowMs: env.apiRateLimit.windowMs,
  max: env.apiRateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please slow down." },
});

export const authRateLimiter = rateLimit({
  windowMs: env.authRateLimit.windowMs,
  max: env.authRateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later." },
});
