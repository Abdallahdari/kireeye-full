import crypto from "crypto";
import fs from "fs";
import path from "path";
import { Request, Response, NextFunction } from "express";
import multer from "multer";
import { AppError } from "../utils/AppError";
import { logger } from "../utils/logger";
import { env } from "../config/env";
import { MAX_PROPERTY_IMAGES } from "../models/Property";

// Images are stored on local disk under <uploadDir>/properties and served by
// app.ts at /api/uploads, so the frontend's existing /api/* rewrite reaches
// them without extra config. Only the public URL is saved in MongoDB.
export const UPLOADS_PUBLIC_PATH = "/api/uploads";
const PROPERTIES_SUBDIR = "properties";
const propertiesDir = path.join(env.uploadDir, PROPERTIES_SUBDIR);

fs.mkdirSync(propertiesDir, { recursive: true });

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

// The extension comes from the validated MIME type, never from the
// client-supplied filename.
const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, propertiesDir),
  filename: (_req, file, cb) => {
    cb(null, `${crypto.randomBytes(16).toString("hex")}${ALLOWED_IMAGE_TYPES[file.mimetype]}`);
  },
});

const propertyImagesUpload = multer({
  storage,
  limits: { fileSize: MAX_IMAGE_SIZE_BYTES, files: MAX_PROPERTY_IMAGES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_IMAGE_TYPES[file.mimetype]) {
      return cb(new AppError("Only JPEG, PNG, or WebP images are allowed", 400));
    }
    cb(null, true);
  },
}).array("images", MAX_PROPERTY_IMAGES);

const multerErrorMessages: Partial<Record<multer.ErrorCode, string>> = {
  LIMIT_FILE_SIZE: "Each image must be 5MB or smaller",
  LIMIT_FILE_COUNT: `You can upload up to ${MAX_PROPERTY_IMAGES} images`,
  LIMIT_UNEXPECTED_FILE: `You can upload up to ${MAX_PROPERTY_IMAGES} images`,
};

export function uploadPropertyImages(req: Request, res: Response, next: NextFunction): void {
  propertyImagesUpload(req, res, (err: unknown) => {
    if (!err) return next();

    // Multer already removes partially written files when it errors.
    if (err instanceof multer.MulterError) {
      return next(new AppError(multerErrorMessages[err.code] ?? err.message, 400));
    }
    next(err);
  });
}

export function propertyImageUrl(filename: string): string {
  return `${UPLOADS_PUBLIC_PATH}/${PROPERTIES_SUBDIR}/${filename}`;
}

export async function deletePropertyImages(urls: string[]): Promise<void> {
  await Promise.all(
    urls.map(async (url) => {
      // basename() keeps the delete inside propertiesDir whatever the stored URL holds.
      const filePath = path.join(propertiesDir, path.basename(url));
      try {
        await fs.promises.unlink(filePath);
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
          logger.error(`Failed to delete image ${filePath}`, err);
        }
      }
    })
  );
}

/**
 * Error middleware: if anything after the upload fails (validation, DB
 * errors), remove the files multer already saved so they don't pile up as
 * orphans, then pass the error on to the global error handler.
 */
export function discardUploadsOnError(err: unknown, req: Request, _res: Response, next: NextFunction): void {
  const files = Array.isArray(req.files) ? req.files : [];
  if (files.length === 0) return next(err);

  Promise.all(files.map((f) => fs.promises.unlink(f.path).catch(() => undefined))).finally(() => next(err));
}
