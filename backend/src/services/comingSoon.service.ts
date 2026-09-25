import { ComingSoon, IComingSoon } from "../models/ComingSoon";
import { AppError } from "../utils/AppError";
import { deleteFolderImage, folderImageUrl } from "../middleware/upload";
import { CreateComingSoonInput, UpdateComingSoonInput } from "../validators/comingSoon.validators";

const SORT = { order: 1, createdAt: -1 } as const;
const MAX_PUBLIC_SLIDES = 20;

/** Active slides for the public home page hero. */
export function listActiveComingSoon(): Promise<IComingSoon[]> {
  return ComingSoon.find({ isActive: true }).sort(SORT).limit(MAX_PUBLIC_SLIDES);
}

/** Every slide, for the admin dashboard. */
export function listAllComingSoon(): Promise<IComingSoon[]> {
  return ComingSoon.find().sort(SORT);
}

export async function createComingSoon(
  input: CreateComingSoonInput,
  file: Express.Multer.File | undefined
): Promise<IComingSoon> {
  if (!file) {
    throw new AppError("Please add an image", 400);
  }
  return ComingSoon.create({ ...input, image: folderImageUrl("coming-soon", file.filename) });
}

export async function updateComingSoon(
  id: string,
  input: UpdateComingSoonInput,
  file: Express.Multer.File | undefined
): Promise<IComingSoon> {
  const item = await ComingSoon.findById(id);
  if (!item) {
    throw new AppError("Slide not found", 404);
  }

  const oldImage = item.image;
  item.set(input);
  if (file) item.image = folderImageUrl("coming-soon", file.filename);
  await item.save();

  if (file) await deleteFolderImage("coming-soon", oldImage);
  return item;
}

export async function deleteComingSoon(id: string): Promise<void> {
  const item = await ComingSoon.findById(id);
  if (!item) {
    throw new AppError("Slide not found", 404);
  }
  await item.deleteOne();
  await deleteFolderImage("coming-soon", item.image);
}
