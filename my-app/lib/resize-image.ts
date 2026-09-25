// Uploads are downscaled in the browser before they're sent, so a 4K phone
// photo becomes a normal web-sized image (smaller upload, faster pages).
export const MAX_IMAGE_DIMENSION = 1600;
const JPEG_QUALITY = 0.8;

/** Largest original file we'll try to shrink — anything bigger is rejected outright. */
export const MAX_ORIGINAL_IMAGE_BYTES = 20 * 1024 * 1024;

/** Matches the API's per-image limit; resized images land well under it. */
export const MAX_UPLOAD_IMAGE_BYTES = 2 * 1024 * 1024;

/**
 * Resizes an image so its longest side is at most MAX_IMAGE_DIMENSION and
 * re-encodes it as JPEG. Returns the original file if it's already small
 * enough and the re-encode wouldn't help.
 */
export async function resizeImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    // JPEG has no transparency — paint white behind PNG/WebP alpha instead of black.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
    if (!blob) return file;

    if (scale === 1 && blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg", lastModified: Date.now() });
  } finally {
    bitmap.close();
  }
}
