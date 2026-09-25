import { Schema, model, Document, Types } from "mongoose";

export interface IBlogPost extends Document {
  _id: Types.ObjectId;
  title: string;
  // URL-safe and unique; generated from the title.
  slug: string;
  excerpt: string;
  // Plain text; blank lines separate paragraphs.
  content: string;
  // Public URL of the uploaded cover image — see middleware/upload.ts.
  coverImage: string | null;
  author: Types.ObjectId;
  isPublished: boolean;
  // Set the first time the post is published.
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const blogPostSchema = new Schema<IBlogPost>(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    excerpt: { type: String, required: true, trim: true, maxlength: 300 },
    content: { type: String, required: true, trim: true, maxlength: 20_000 },
    coverImage: { type: String, default: null },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isPublished: { type: Boolean, default: false, index: true },
    publishedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete (ret as Record<string, unknown>).__v;
        return ret;
      },
    },
  }
);

blogPostSchema.index({ isPublished: 1, publishedAt: -1 });

export const BlogPost = model<IBlogPost>("BlogPost", blogPostSchema);
