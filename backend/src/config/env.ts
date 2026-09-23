import path from "path";
import dotenv from "dotenv";

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProduction: process.env.NODE_ENV === "production",
  port: Number(process.env.PORT ?? 5000),
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:3000",

  mongodbUri: required("MONGODB_URI"),

  jwtSecret: required("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  cookieName: process.env.COOKIE_NAME ?? "token",

  // Where uploaded listing images are written. Relative paths resolve from the
  // process working directory (the backend folder / /app in Docker).
  uploadDir: path.resolve(process.env.UPLOAD_DIR ?? "uploads"),

  superAdmin: {
    firstName: process.env.SUPER_ADMIN_FIRST_NAME,
    lastName: process.env.SUPER_ADMIN_LAST_NAME,
    email: process.env.SUPER_ADMIN_EMAIL,
    password: process.env.SUPER_ADMIN_PASSWORD,
    phone: process.env.SUPER_ADMIN_PHONE,
  },

  authRateLimit: {
    windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000),
    max: Number(process.env.AUTH_RATE_LIMIT_MAX ?? 20),
  },

  // If SMTP_USER/SMTP_PASS are unset, mailer.service.ts falls back to logging
  // emails to the console instead of sending them — see that file.
  smtp: {
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT ?? 465),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM ?? `Stayly <${process.env.SMTP_USER ?? "no-reply@stayly.local"}>`,
  },

  billing: {
    // Lifetime number of listings a business can publish before it needs a
    // paid subscription.
    freeListingLimit: Number(process.env.FREE_LISTING_LIMIT ?? 5),
    monthlyPriceUsd: Number(process.env.SUBSCRIPTION_PRICE_USD ?? 10),
  },

  // WaafiPay (EVC Plus / ZAAD / SAHAL mobile-wallet payments).
  //   live    — real payments against WAAFI_API_URL (defaults to production)
  //   sandbox — WaafiPay's test environment, needs sandbox credentials
  //   mock    — no network calls; approves instantly (numbers ending in 0000
  //             are declined). Default when no credentials are set outside
  //             production. Never allowed in production.
  waafi: (() => {
    const hasCredentials = Boolean(
      process.env.WAAFI_MERCHANT_UID && process.env.WAAFI_API_USER_ID && process.env.WAAFI_API_KEY
    );
    const isProduction = process.env.NODE_ENV === "production";
    const mode = (process.env.WAAFI_MODE ?? (hasCredentials ? (isProduction ? "live" : "sandbox") : isProduction ? "disabled" : "mock")) as
      | "live"
      | "sandbox"
      | "mock"
      | "disabled";

    return {
      mode: isProduction && mode === "mock" ? "disabled" : mode,
      url:
        process.env.WAAFI_API_URL ??
        (mode === "live" ? "https://api.waafipay.net/asm" : "https://sandbox.waafipay.com/asm"),
      merchantUid: process.env.WAAFI_MERCHANT_UID ?? "",
      apiUserId: process.env.WAAFI_API_USER_ID ?? "",
      apiKey: process.env.WAAFI_API_KEY ?? "",
      // The customer approves on their phone, so the API call can take a while.
      timeoutMs: Number(process.env.WAAFI_TIMEOUT_MS ?? 180_000),
    };
  })(),
};
