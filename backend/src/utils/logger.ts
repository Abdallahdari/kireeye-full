/* eslint-disable no-console */

const SENSITIVE_KEYS = ["password", "token", "jwt", "authorization", "cookie", "secret"];

function redact(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(redact);

  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.some((k) => key.toLowerCase().includes(k))) {
      result[key] = "[REDACTED]";
    } else {
      result[key] = redact(val);
    }
  }
  return result;
}

export const logger = {
  info(message: string, meta?: unknown) {
    console.log(`[INFO] ${message}`, meta !== undefined ? redact(meta) : "");
  },
  warn(message: string, meta?: unknown) {
    console.warn(`[WARN] ${message}`, meta !== undefined ? redact(meta) : "");
  },
  error(message: string, error?: unknown) {
    console.error(`[ERROR] ${message}`, error instanceof Error ? error.message : redact(error));
  },
};
