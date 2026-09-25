"use client";

import Link from "next/link";
import { ArrowRight, Newspaper } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { formatDate } from "@/lib/format";
import type { BlogPost } from "@/lib/types";

export function BlogCard({ post }: { post: BlogPost }) {
  const { t } = useLanguage();
  const href = `/blog/${post.slug}`;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm transition-shadow hover:shadow-md">
      <Link href={href} className="relative block aspect-[16/9] overflow-hidden bg-gradient-to-br from-rose-100 to-orange-100">
        {post.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- served by our own backend via the /api rewrite
          <img
            src={post.coverImage}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-rose-400">
            <Newspaper className="h-10 w-10" />
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-medium text-zinc-400">{formatDate(post.publishedAt ?? post.createdAt)}</p>
        <h3 className="mt-2 line-clamp-2 font-semibold text-zinc-900">
          <Link href={href} className="hover:text-rose-700">
            {post.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm text-zinc-600">{post.excerpt}</p>
        <Link
          href={href}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-rose-600 hover:text-rose-700"
        >
          {t("blog.readMore")}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
