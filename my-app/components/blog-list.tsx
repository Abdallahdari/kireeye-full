"use client";

import { useEffect, useState } from "react";
import { Newspaper } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { BlogCard } from "@/components/blog-card";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { PaginationFooter } from "@/components/ui/pagination";
import * as api from "@/lib/api-client";
import type { BlogPost } from "@/lib/types";

const PAGE_SIZE = 9;

export function BlogList() {
  const { t } = useLanguage();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [pagination, setPagination] = useState<api.Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .listBlogPosts({ page, limit: PAGE_SIZE })
      .then((result) => {
        if (cancelled) return;
        setPosts(result.posts);
        setPagination(result.pagination);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof api.ApiClientError ? err.message : t("blog.errorLoad"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, t]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">{t("blog.title")}</h1>
        <p className="mt-2 max-w-xl text-zinc-600">{t("blog.subtitle")}</p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-80 animate-pulse rounded-2xl bg-zinc-100" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        !error && <EmptyState icon={Newspaper} title={t("blog.empty")} description={t("blog.emptyBody")} />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <BlogCard key={post._id} post={post} />
          ))}
        </div>
      )}

      {pagination && (
        <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white">
          <PaginationFooter
            pagination={pagination}
            page={page}
            onPageChange={(next) => {
              setPage(next);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            label={t("blog.pageOf", { page: pagination.page, pages: pagination.pages })}
            previousLabel={t("common.previous")}
            nextLabel={t("common.next")}
          />
        </div>
      )}
    </div>
  );
}
