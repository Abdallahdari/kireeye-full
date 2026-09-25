import express, { Application } from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import routes from "./routes";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler";
import { env } from "./config/env";
import { swaggerSpec } from "./config/swagger";
import { UPLOADS_PUBLIC_PATH, serveImageFromS3 } from "./middleware/upload";

export function createApp(): Application {
  const app = express();

  app.use(
    helmet({
      contentSecurityPolicy: env.isProduction ? undefined : false,
    })
  );
  app.use(
    cors({
      origin: env.clientUrl,
      credentials: true,
    })
  );
  app.use(express.json({ limit: "10kb" }));
  app.use(cookieParser());

  app.get("/health", (_req, res) => {
    res.status(200).json({ success: true, message: "OK" });
  });

  app.get("/api-docs.json", (_req, res) => {
    res.status(200).json(swaggerSpec);
  });
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

  // Uploaded images: from S3 when configured, else (or as a fallback for
  // older files) from local disk. Filenames are random, so they can be cached hard.
  app.use(
    UPLOADS_PUBLIC_PATH,
    (_req, res, next) => {
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      next();
    },
    serveImageFromS3,
    express.static(env.uploadDir, { maxAge: "30d", immutable: true, index: false, fallthrough: true })
  );

  app.use("/api", routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
