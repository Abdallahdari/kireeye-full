"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { formatDate } from "@/lib/format";
import type { BlogPost } from "@/lib/types";

export function BlogPostView({ post }: { post: BlogPost }) {
  const { t } = useLanguage();
  const paragraphs = (post.content ?? "").split(/\n\s*\n/).filter((p) => p.trim());
  const author = post.author ? `${post.author.firstName} ${post.author.lastName}` : null;

  return (
    <article className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm font-semibold text-rose-600 hover:text-rose-700">
          <ArrowLeft className="h-4 w-4" />
          {t("blog.backToBlog")}
        </Link>

        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">{post.title}</h1>
        <p className="mt-3 text-sm text-zinc-500">
          {formatDate(post.publishedAt ?? post.createdAt)}
          {author && <> · {t("blog.by", { name: author })}</>}
        </p>

        {post.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element -- served by our own backend via the /api rewrite
          <img src={post.coverImage} alt="" className="mt-8 aspect-[16/9] w-full rounded-2xl object-cover" />
        )}

        <p className="mt-8 text-lg font-medium text-zinc-700">{post.excerpt}</p>
        <div className="mt-6 flex flex-col gap-5 text-base leading-7 text-zinc-700">
          {paragraphs.map((paragraph, i) => (
            <p key={i} className="whitespace-pre-line">
              {paragraph.trim()}
            </p>
          ))}
        </div>
      </div>
    </article>
  );
}
