import crypto from "crypto";

export interface GeneratedToken {
  raw: string;
  hash: string;
}

export function generateSecureToken(): GeneratedToken {
  const raw = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  return { raw, hash };
}

export function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}
