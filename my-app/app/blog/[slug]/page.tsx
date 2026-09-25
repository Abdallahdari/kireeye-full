import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBlogPost } from "@/lib/api-server";
import { BlogPostView } from "@/components/blog-post-view";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return { title: "Post not found — Kireeye" };

  const title = `${post.title} — Kireeye`;
  return {
    title,
    description: post.excerpt,
    openGraph: { title, description: post.excerpt, images: post.coverImage ? [post.coverImage] : [] },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) {
    notFound();
  }

  return <BlogPostView post={post} />;
}
