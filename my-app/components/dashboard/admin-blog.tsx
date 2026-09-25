"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ExternalLink, Eye, EyeOff, Loader2, Newspaper, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/input";
import { PaginationFooter } from "@/components/ui/pagination";
import { ImagePicker } from "@/components/dashboard/image-picker";
import { useLanguage } from "@/components/language-provider";
import * as api from "@/lib/api-client";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import type { BlogPost } from "@/lib/types";

const PAGE_SIZE = 10;

const textareaClass =
  "rounded-xl border border-zinc-200 px-3.5 py-2.5 text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100";

function PostForm({
  post,
  onSaved,
  onCancel,
}: {
  // Undefined when writing a new post.
  post?: BlogPost;
  onSaved: (post: BlogPost) => void;
  onCancel: () => void;
}) {
  const { t } = useLanguage();
  const [title, setTitle] = useState(post?.title ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [isPublished, setIsPublished] = useState(post?.isPublished ?? true);
  const [image, setImage] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const input = { title, excerpt, content, isPublished, image };
      const result = post
        ? await api.updateBlogPost(post._id, { ...input, removeImage: removeImage && !image })
        : await api.createBlogPost(input);
      onSaved(result.post);
    } catch (err) {
      setError(err instanceof api.ApiClientError ? err.message : t("comingSoon.errorGeneric"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <Alert variant="error">{error}</Alert>}

      <Field
        label={t("blog.admin.fieldTitle")}
        name="title"
        required
        minLength={3}
        maxLength={160}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-zinc-700">{t("blog.admin.fieldExcerpt")}</span>
        <textarea
          required
          minLength={10}
          maxLength={300}
          rows={2}
          placeholder={t("blog.admin.fieldExcerptPlaceholder")}
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          className={textareaClass}
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-zinc-700">{t("blog.admin.fieldContent")}</span>
        <textarea
          required
          minLength={50}
          maxLength={20000}
          rows={12}
          placeholder={t("blog.admin.fieldContentPlaceholder")}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className={textareaClass}
        />
      </label>

      <ImagePicker
        label={t("blog.admin.fieldCover")}
        hint={t("comingSoon.imageHint")}
        chooseLabel={t("blog.admin.chooseImage")}
        removeLabel={t("blog.admin.removeImage")}
        currentUrl={removeImage ? null : post?.coverImage}
        file={image}
        onFileChange={setImage}
        onRemove={post?.coverImage && !removeImage ? () => setRemoveImage(true) : undefined}
        onInvalid={() => setError(t("comingSoon.errorImage"))}
      />

      <label className="flex items-center gap-2.5 text-sm font-medium text-zinc-700">
        <input
          type="checkbox"
          checked={isPublished}
          onChange={(e) => setIsPublished(e.target.checked)}
          className="h-4 w-4 rounded border-zinc-300 accent-rose-600"
        />
        {t("blog.admin.fieldPublished")}
      </label>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={saving}>
          {t("blog.admin.cancel")}
        </Button>
        <Button type="submit" loading={saving}>
          {t("blog.admin.save")}
        </Button>
      </div>
    </form>
  );
}

export function AdminBlog() {
  const { t } = useLanguage();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [pagination, setPagination] = useState<api.Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  // "new" for the add form, a post id when editing, null when closed.
  const [editing, setEditing] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .listAllBlogPosts({ page, limit: PAGE_SIZE })
      .then((result) => {
        if (cancelled) return;
        setPosts(result.posts);
        setPagination(result.pagination);
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
  }, [page, refreshIndex, t]);

  function handleSaved(saved: BlogPost) {
    const isNew = editing === "new";
    setEditing(null);
    setError(null);
    setSuccess(isNew ? t("blog.admin.created") : t("blog.admin.updated"));
    if (isNew) {
      setPage(1);
      setRefreshIndex((i) => i + 1);
    } else {
      setPosts((prev) => prev.map((p) => (p._id === saved._id ? saved : p)));
    }
  }

  async function togglePublished(post: BlogPost) {
    setBusyId(post._id);
    setError(null);
    setSuccess(null);
    try {
      const { post: saved } = await api.updateBlogPost(post._id, { isPublished: !post.isPublished });
      setPosts((prev) => prev.map((p) => (p._id === saved._id ? saved : p)));
      setSuccess(t("blog.admin.updated"));
    } catch (err) {
      setError(err instanceof api.ApiClientError ? err.message : t("comingSoon.errorGeneric"));
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    setError(null);
    setSuccess(null);
    try {
      await api.deleteBlogPost(id);
      setSuccess(t("blog.admin.deleted"));
      // Step back a page if we just removed the last item on it.
      if (posts.length === 1 && page > 1) setPage(page - 1);
      else setRefreshIndex((i) => i + 1);
    } catch (err) {
      setError(err instanceof api.ApiClientError ? err.message : t("comingSoon.errorGeneric"));
    } finally {
      setBusyId(null);
      setConfirmId(null);
    }
  }

  const editingPost = editing && editing !== "new" ? posts.find((p) => p._id === editing) : undefined;

  return (
    <div className="flex flex-col gap-6">
      {editing && (
        <Card>
          <CardHeader
            title={editingPost ? t("blog.admin.formTitleEdit") : t("blog.admin.formTitleNew")}
            className="mb-5"
          />
          <PostForm key={editing} post={editingPost} onSaved={handleSaved} onCancel={() => setEditing(null)} />
        </Card>
      )}

      <Card padded={false}>
        <div className="border-b border-zinc-100 p-5">
          <CardHeader
            title={t("blog.admin.title")}
            subtitle={pagination ? t("blog.admin.count", { total: pagination.total }) : t("blog.admin.subtitle")}
            actions={
              editing !== "new" && (
                <Button
                  onClick={() => {
                    setSuccess(null);
                    setEditing("new");
                  }}
                >
                  <Plus className="h-4 w-4" />
                  {t("blog.admin.add")}
                </Button>
              )
            }
          />
        </div>

        {(error || success) && (
          <div className="p-5 pb-0">
            {error ? <Alert variant="error">{error}</Alert> : <Alert variant="success">{success}</Alert>}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center gap-2 px-5 py-14 text-zinc-400">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-sm">{t("blog.admin.loading")}</span>
          </div>
        ) : posts.length === 0 ? (
          <div className="p-5">
            <EmptyState icon={Newspaper} title={t("blog.admin.empty")} description={t("blog.admin.emptyBody")} />
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {posts.map((post) => {
              const busy = busyId === post._id;
              return (
                <li key={post._id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                  <div className="h-20 w-32 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-rose-100 to-orange-100">
                    {post.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element -- served by our own backend via the /api rewrite
                      <img src={post.coverImage} alt="" className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-rose-400">
                        <Newspaper className="h-6 w-6" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          post.isPublished ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-600"
                        )}
                      >
                        {post.isPublished ? t("blog.admin.published") : t("blog.admin.draft")}
                      </span>
                      <span className="text-xs text-zinc-400">{formatDate(post.publishedAt ?? post.createdAt)}</span>
                    </div>
                    <p className="mt-1 truncate font-semibold text-zinc-900">{post.title}</p>
                    <p className="line-clamp-1 text-sm text-zinc-500">{post.excerpt}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {confirmId === post._id ? (
                      <>
                        <Button
                          className="bg-red-600 px-3 py-1.5 text-xs hover:bg-red-700"
                          loading={busy}
                          onClick={() => handleDelete(post._id)}
                        >
                          {t("blog.admin.confirmDelete")}
                        </Button>
                        <Button
                          variant="secondary"
                          className="px-3 py-1.5 text-xs"
                          disabled={busy}
                          onClick={() => setConfirmId(null)}
                        >
                          {t("blog.admin.cancel")}
                        </Button>
                      </>
                    ) : (
                      <>
                        {post.isPublished && (
                          <Link
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-zinc-50"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            {t("blog.admin.view")}
                          </Link>
                        )}
                        <Button
                          variant="secondary"
                          className="px-3 py-1.5 text-xs"
                          onClick={() => {
                            setSuccess(null);
                            setEditing(post._id);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          {t("blog.admin.edit")}
                        </Button>
                        <Button
                          variant="secondary"
                          className="px-3 py-1.5 text-xs"
                          loading={busy}
                          onClick={() => togglePublished(post)}
                        >
                          {post.isPublished ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          {post.isPublished ? t("blog.admin.unpublish") : t("blog.admin.publish")}
                        </Button>
                        <Button
                          variant="secondary"
                          className="px-3 py-1.5 text-xs text-red-700"
                          onClick={() => setConfirmId(post._id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {t("blog.admin.delete")}
                        </Button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {pagination && (
          <PaginationFooter
            pagination={pagination}
            page={page}
            onPageChange={setPage}
            label={t("blog.admin.pageOf", { page: pagination.page, pages: pagination.pages, total: pagination.total })}
            previousLabel={t("common.previous")}
            nextLabel={t("common.next")}
          />
        )}
      </Card>
    </div>
  );
}
