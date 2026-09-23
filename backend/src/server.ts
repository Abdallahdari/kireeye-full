import { createApp } from "./app";
import { connectDatabase } from "./config/db";
import { env } from "./config/env";
import { logger } from "./utils/logger";
import { backfillBilling, sweepBilling } from "./services/billing.service";

const BILLING_SWEEP_INTERVAL_MS = Number(process.env.BILLING_SWEEP_INTERVAL_MS ?? 10 * 60 * 1000);

async function main(): Promise<void> {
  await connectDatabase();

  await backfillBilling();
  await sweepBilling();
  // Hides listings once a subscription lapses and fails abandoned payments.
  setInterval(() => {
    sweepBilling().catch((err) => logger.error("[billing] Sweep failed", err));
  }, BILLING_SWEEP_INTERVAL_MS).unref();

  if (env.waafi.mode === "mock") {
    logger.warn("[billing] WaafiPay is in MOCK mode — payments are simulated, no money moves");
  } else if (env.waafi.mode === "disabled") {
    logger.warn("[billing] WaafiPay credentials not set — online payments are disabled");
  } else {
    logger.info(`[billing] WaafiPay ${env.waafi.mode} mode`);
  }

  const app = createApp();

  const server = app.listen(env.port, () => {
    logger.info(`Server listening on port ${env.port} [${env.nodeEnv}]`);
  });

  const shutdown = (signal: string) => {
    logger.info(`${signal} received, shutting down gracefully`);
    server.close(() => {
      process.exit(0);
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  logger.error("Failed to start server", err);
  process.exit(1);
});
