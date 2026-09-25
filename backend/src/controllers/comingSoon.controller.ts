import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as comingSoonService from "../services/comingSoon.service";
import { CreateComingSoonInput, UpdateComingSoonInput } from "../validators/comingSoon.validators";

export const listPublicComingSoon = asyncHandler(async (_req: Request, res: Response) => {
  const items = await comingSoonService.listActiveComingSoon();
  res.status(200).json({ success: true, data: { items } });
});

export const listAllComingSoon = asyncHandler(async (_req: Request, res: Response) => {
  const items = await comingSoonService.listAllComingSoon();
  res.status(200).json({ success: true, data: { items } });
});

export const createComingSoon = asyncHandler(async (req: Request, res: Response) => {
  const item = await comingSoonService.createComingSoon(req.body as CreateComingSoonInput, req.file);
  res.status(201).json({ success: true, message: "Slide added", data: { item } });
});

export const updateComingSoon = asyncHandler(async (req: Request, res: Response) => {
  const item = await comingSoonService.updateComingSoon(req.params.id, req.body as UpdateComingSoonInput, req.file);
  res.status(200).json({ success: true, message: "Slide updated", data: { item } });
});

export const deleteComingSoon = asyncHandler(async (req: Request, res: Response) => {
  await comingSoonService.deleteComingSoon(req.params.id);
  res.status(200).json({ success: true, message: "Slide deleted" });
});
