import dns from "dns";
import mongoose from "mongoose";
import { env } from "./env";
import { logger } from "../utils/logger";

// Node's c-ares resolver (used for the SRV lookup that "mongodb+srv://" needs)
// doesn't reliably pick up the OS-configured DNS servers on Windows, which
// causes "querySrv ECONNREFUSED" even when the OS resolver works fine.
// Forcing known-good public resolvers here fixes it without touching OS
// network settings.
if (env.mongodbUri.startsWith("mongodb+srv://")) {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
}

export async function connectDatabase(): Promise<void> {
  mongoose.set("strictQuery", true);

  await mongoose.connect(env.mongodbUri);

  logger.info(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);

  mongoose.connection.on("error", (err) => {
    logger.error("MongoDB connection error", err);
  });
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
