import crypto from "crypto";
import path from "path";
import { Request, Response, NextFunction } from "express";
import multer from "multer";
import { AppError } from "../utils/AppError";
import { MAX_PROPERTY_IMAGES } from "../models/Property";
import { saveImage, deleteImage, readImageFromS3, isValidImageKey } from "../services/imageStorage.service";

// Images are kept in memory by multer, then written to S3 (or local disk when
// S3 isn't configured — see imageStorage.service.ts). They're served at
// /api/uploads/<folder>/<file> so the frontend's existing /api/* rewrite
// reaches them without extra config. Only the public URL is saved in MongoDB.
export const UPLOADS_PUBLIC_PATH = "/api/uploads";

export type ImageFolder = "properties" | "coming-soon" | "blog";

// The frontend downsizes photos to web size before upload, so real uploads
// are well under this; it just stops full-resolution originals getting through.
const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;

// The extension comes from the validated MIME type, never from the
// client-supplied filename.
const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

function imageMulter(maxFiles: number) {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_IMAGE_SIZE_BYTES, files: maxFiles },
    fileFilter: (_req, file, cb) => {
      if (!ALLOWED_IMAGE_TYPES[file.mimetype]) {
        return cb(new AppError("Only JPEG, PNG, or WebP images are allowed", 400));
      }
      cb(null, true);
    },
  });
}

/**
 * Stores each buffered file under a random name in `folder`. Sets
 * `file.filename` (used to build the URL) and `file.path` (the storage key,
 * used to clean up if the request fails later).
 */
async function persistFiles(folder: ImageFolder, files: Express.Multer.File[]): Promise<void> {
  const saved: string[] = [];
  try {
    for (const file of files) {
      const filename = `${crypto.randomBytes(16).toString("hex")}${ALLOWED_IMAGE_TYPES[file.mimetype]}`;
      const key = `${folder}/${filename}`;
      await saveImage(key, file.buffer, file.mimetype);
      saved.push(key);
      file.filename = filename;
      file.path = key;
    }
  } catch {
    await Promise.all(saved.map(deleteImage));
    throw new AppError("Unable to save the image right now. Please try again.", 502);
  }
}

function filesOf(req: Request): Express.Multer.File[] {
  const files = Array.isArray(req.files) ? [...req.files] : [];
  if (req.file) files.push(req.file);
  return files;
}

// ---- Listing images (up to MAX_PROPERTY_IMAGES) ----

const propertyImagesUpload = imageMulter(MAX_PROPERTY_IMAGES).array("images", MAX_PROPERTY_IMAGES);

const multerErrorMessages: Partial<Record<multer.ErrorCode, string>> = {
  LIMIT_FILE_SIZE: "Each image must be 2MB or smaller",
  LIMIT_FILE_COUNT: `You can upload up to ${MAX_PROPERTY_IMAGES} images`,
  LIMIT_UNEXPECTED_FILE: `You can upload up to ${MAX_PROPERTY_IMAGES} images`,
};

export function uploadPropertyImages(req: Request, res: Response, next: NextFunction): void {
  propertyImagesUpload(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      return next(new AppError(multerErrorMessages[err.code] ?? err.message, 400));
    }
    if (err) return next(err);

    persistFiles("properties", filesOf(req)).then(() => next(), next);
  });
}

export function propertyImageUrl(filename: string): string {
  return folderImageUrl("properties", filename);
}

export async function deletePropertyImages(urls: string[]): Promise<void> {
  await Promise.all(urls.map((url) => deleteFolderImage("properties", url)));
}

// ---- Single-image uploads for admin content (coming-soon slides, blog covers) ----

function singleImageUpload(folder: Exclude<ImageFolder, "properties">) {
  const upload = imageMulter(1).single("image");

  return (req: Request, res: Response, next: NextFunction): void => {
    upload(req, res, (err: unknown) => {
      if (err instanceof multer.MulterError) {
        const message =
          err.code === "LIMIT_FILE_SIZE"
            ? "The image must be 2MB or smaller"
            : err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE"
              ? "Please upload a single image"
              : err.message;
        return next(new AppError(message, 400));
      }
      if (err) return next(err);

      persistFiles(folder, filesOf(req)).then(() => next(), next);
    });
  };
}

export const uploadComingSoonImage = singleImageUpload("coming-soon");
export const uploadBlogImage = singleImageUpload("blog");

export function folderImageUrl(folder: ImageFolder, filename: string): string {
  return `${UPLOADS_PUBLIC_PATH}/${folder}/${filename}`;
}

export async function deleteFolderImage(folder: ImageFolder, url: string | null | undefined): Promise<void> {
  if (!url) return;
  // basename() keeps the delete inside the folder whatever the stored URL holds.
  await deleteImage(`${folder}/${path.posix.basename(url)}`);
}

// ---- Serving ----

/**
 * Serves /api/uploads/<folder>/<file> from S3. Falls through (so the local
 * static handler can try) when S3 isn't configured or the key isn't there.
 */
export function serveImageFromS3(req: Request, res: Response, next: NextFunction): void {
  const key = req.path.replace(/^\//, "");
  if (!isValidImageKey(key)) return next();

  readImageFromS3(key)
    .then((image) => {
      if (!image) return next();
      res.setHeader("Content-Type", image.contentType);
      if (image.contentLength !== undefined) res.setHeader("Content-Length", String(image.contentLength));
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      image.body.on("error", next).pipe(res);
    })
    .catch(next);
}

/**
 * Error middleware: if anything after the upload fails (validation, DB
 * errors), remove the images already stored so they don't pile up as
 * orphans, then pass the error on to the global error handler.
 */
export function discardUploadsOnError(err: unknown, req: Request, _res: Response, next: NextFunction): void {
  const keys = filesOf(req)
    .map((f) => f.path)
    .filter(Boolean);
  if (keys.length === 0) return next(err);

  Promise.all(keys.map(deleteImage)).finally(() => next(err));
}
