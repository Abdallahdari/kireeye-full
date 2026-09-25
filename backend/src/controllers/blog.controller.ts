import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import * as blogService from "../services/blog.service";
import { CreateBlogPostInput, UpdateBlogPostInput } from "../validators/blog.validators";

type ListQuery = { page?: number; limit?: number };

function sendList(res: Response, result: Awaited<ReturnType<typeof blogService.listBlogPosts>>) {
  res.status(200).json({
    success: true,
    data: {
      posts: result.posts,
      pagination: { total: result.total, page: result.page, limit: result.limit, pages: result.pages },
    },
  });
}

export const listPublishedPosts = asyncHandler(async (req: Request, res: Response) => {
  sendList(res, await blogService.listBlogPosts({ ...(req.query as ListQuery), publishedOnly: true }));
});

export const listAllPosts = asyncHandler(async (req: Request, res: Response) => {
  sendList(res, await blogService.listBlogPosts({ ...(req.query as ListQuery), publishedOnly: false }));
});

export const getPublishedPost = asyncHandler(async (req: Request, res: Response) => {
  const post = await blogService.getPublishedBlogPost(req.params.slug);
  res.status(200).json({ success: true, data: { post } });
});

export const createPost = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }
  const post = await blogService.createBlogPost(req.user._id.toString(), req.body as CreateBlogPostInput, req.file);
  res.status(201).json({ success: true, message: "Post created", data: { post } });
});

export const updatePost = asyncHandler(async (req: Request, res: Response) => {
  const post = await blogService.updateBlogPost(req.params.id, req.body as UpdateBlogPostInput, req.file);
  res.status(200).json({ success: true, message: "Post updated", data: { post } });
});

export const deletePost = asyncHandler(async (req: Request, res: Response) => {
  await blogService.deleteBlogPost(req.params.id);
  res.status(200).json({ success: true, message: "Post deleted" });
});
