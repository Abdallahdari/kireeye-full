import crypto from "crypto";
import { BlogPost, IBlogPost } from "../models/BlogPost";
import { AppError } from "../utils/AppError";
import { deleteFolderImage, folderImageUrl } from "../middleware/upload";
import { CreateBlogPostInput, UpdateBlogPostInput } from "../validators/blog.validators";

const AUTHOR_FIELDS = "firstName lastName";

function slugify(title: string): string {
  return title
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/, "");
}

// Would clash with the /blog/all and /blog/posts/:id routes.
const RESERVED_SLUGS = new Set(["all", "posts"]);

async function uniqueSlug(title: string, excludeId?: string): Promise<string> {
  const base = slugify(title) || "post";
  let slug = RESERVED_SLUGS.has(base) ? `${base}-${crypto.randomBytes(3).toString("hex")}` : base;
  while (await BlogPost.exists({ slug, ...(excludeId && { _id: { $ne: excludeId } }) })) {
    slug = `${base}-${crypto.randomBytes(3).toString("hex")}`;
  }
  return slug;
}

interface ListBlogPostsOptions {
  page?: number;
  limit?: number;
  // Public site: published posts only, newest first, without the full text.
  publishedOnly: boolean;
}

export async function listBlogPosts({ page = 1, limit = 9, publishedOnly }: ListBlogPostsOptions) {
  const filter = publishedOnly ? { isPublished: true } : {};

  const [posts, total] = await Promise.all([
    BlogPost.find(filter)
      .sort(publishedOnly ? { publishedAt: -1 } : { createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select(publishedOnly ? "-content" : "")
      .populate("author", AUTHOR_FIELDS),
    BlogPost.countDocuments(filter),
  ]);

  return { posts, total, page, limit, pages: Math.ceil(total / limit) };
}

export async function getPublishedBlogPost(slug: string): Promise<IBlogPost> {
  const post = await BlogPost.findOne({ slug: slug.toLowerCase(), isPublished: true }).populate(
    "author",
    AUTHOR_FIELDS
  );
  if (!post) {
    throw new AppError("Post not found", 404);
  }
  return post;
}

export async function createBlogPost(
  authorId: string,
  input: CreateBlogPostInput,
  file: Express.Multer.File | undefined
): Promise<IBlogPost> {
  const isPublished = input.isPublished ?? false;
  const post = await BlogPost.create({
    ...input,
    slug: await uniqueSlug(input.title),
    author: authorId,
    isPublished,
    publishedAt: isPublished ? new Date() : null,
    coverImage: file ? folderImageUrl("blog", file.filename) : null,
  });
  return post.populate("author", AUTHOR_FIELDS);
}

export async function updateBlogPost(
  id: string,
  input: UpdateBlogPostInput,
  file: Express.Multer.File | undefined
): Promise<IBlogPost> {
  const post = await BlogPost.findById(id);
  if (!post) {
    throw new AppError("Post not found", 404);
  }

  const { removeImage, ...fields } = input;
  const oldImage = post.coverImage;

  if (fields.title && fields.title !== post.title) {
    post.slug = await uniqueSlug(fields.title, id);
  }
  post.set(fields);
  if (fields.isPublished && !post.publishedAt) post.publishedAt = new Date();

  if (file) post.coverImage = folderImageUrl("blog", file.filename);
  else if (removeImage) post.coverImage = null;

  await post.save();

  if (oldImage && oldImage !== post.coverImage) await deleteFolderImage("blog", oldImage);
  return post.populate("author", AUTHOR_FIELDS);
}

export async function deleteBlogPost(id: string): Promise<void> {
  const post = await BlogPost.findById(id);
  if (!post) {
    throw new AppError("Post not found", 404);
  }
  await post.deleteOne();
  await deleteFolderImage("blog", post.coverImage);
}
