"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, MapPin, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/input";
import { ImagePicker } from "@/components/dashboard/image-picker";
import { useLanguage } from "@/components/language-provider";
import * as api from "@/lib/api-client";
import { cn } from "@/lib/cn";
import type { ComingSoonItem } from "@/lib/types";

const textareaClass =
  "rounded-xl border border-zinc-200 px-3.5 py-2.5 text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100";

function SlideForm({
  item,
  onSaved,
  onCancel,
}: {
  // Undefined when adding a new slide.
  item?: ComingSoonItem;
  onSaved: (item: ComingSoonItem) => void;
  onCancel: () => void;
}) {
  const { t } = useLanguage();
  const [title, setTitle] = useState(item?.title ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [location, setLocation] = useState(item?.location ?? "");
  const [link, setLink] = useState(item?.link ?? "");
  const [order, setOrder] = useState(String(item?.order ?? 0));
  const [isActive, setIsActive] = useState(item?.isActive ?? true);
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!item && !image) {
      setError(t("comingSoon.errorNoImage"));
      return;
    }

    const input = { title, description, location, link, isActive, order: Number(order) || 0, image };
    setSaving(true);
    try {
      const result = item ? await api.updateComingSoon(item._id, input) : await api.createComingSoon(input);
      onSaved(result.item);
    } catch (err) {
      setError(err instanceof api.ApiClientError ? err.message : t("comingSoon.errorGeneric"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <Alert variant="error">{error}</Alert>}

      <ImagePicker
        label={t("comingSoon.fieldImage")}
        hint={t("comingSoon.imageHint")}
        chooseLabel={item || image ? t("comingSoon.replaceImage") : t("comingSoon.chooseImage")}
        removeLabel={t("comingSoon.cancel")}
        currentUrl={item?.image}
        file={image}
        onFileChange={setImage}
        onInvalid={() => setError(t("comingSoon.errorImage"))}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t("comingSoon.fieldTitle")}
          name="title"
          required
          minLength={2}
          maxLength={120}
          placeholder={t("comingSoon.fieldTitlePlaceholder")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Field
          label={t("comingSoon.fieldLocation")}
          name="location"
          maxLength={80}
          placeholder="Hodan, Mogadishu"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-zinc-700">{t("comingSoon.fieldDescription")}</span>
        <textarea
          maxLength={300}
          rows={3}
          placeholder={t("comingSoon.fieldDescriptionPlaceholder")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={textareaClass}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-1.5">
          <Field
            label={t("comingSoon.fieldLink")}
            name="link"
            maxLength={300}
            placeholder="/properties?city=Mogadishu"
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />
          <span className="text-xs text-zinc-500">{t("comingSoon.fieldLinkHint")}</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <Field
            label={t("comingSoon.fieldOrder")}
            name="order"
            type="number"
            min={0}
            max={1000}
            value={order}
            onChange={(e) => setOrder(e.target.value)}
          />
          <span className="text-xs text-zinc-500">{t("comingSoon.fieldOrderHint")}</span>
        </div>
      </div>

      <label className="flex items-center gap-2.5 text-sm font-medium text-zinc-700">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-4 w-4 rounded border-zinc-300 accent-rose-600"
        />
        {t("comingSoon.fieldActive")}
      </label>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={saving}>
          {t("comingSoon.cancel")}
        </Button>
        <Button type="submit" loading={saving}>
          {t("comingSoon.save")}
        </Button>
      </div>
    </form>
  );
}

export function AdminComingSoon() {
  const { t } = useLanguage();
  const [items, setItems] = useState<ComingSoonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  // "new" for the add form, a slide id when editing, null when closed.
  const [editing, setEditing] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .listAllComingSoon()
      .then(({ items }) => {
        if (!cancelled) setItems(items);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof api.ApiClientError ? err.message : t("comingSoon.errorGeneric"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  function sortItems(list: ComingSoonItem[]) {
    return [...list].sort((a, b) => a.order - b.order || b.createdAt.localeCompare(a.createdAt));
  }

  function handleSaved(saved: ComingSoonItem) {
    const isNew = editing === "new";
    setItems((prev) => sortItems(isNew ? [...prev, saved] : prev.map((i) => (i._id === saved._id ? saved : i))));
    setEditing(null);
    setError(null);
    setSuccess(isNew ? t("comingSoon.created") : t("comingSoon.updated"));
  }

  async function toggleActive(item: ComingSoonItem) {
    setBusyId(item._id);
    setError(null);
    setSuccess(null);
    try {
      const { item: saved } = await api.updateComingSoon(item._id, { isActive: !item.isActive });
      setItems((prev) => prev.map((i) => (i._id === saved._id ? saved : i)));
      setSuccess(t("comingSoon.updated"));
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
      await api.deleteComingSoon(id);
      setItems((prev) => prev.filter((i) => i._id !== id));
      setSuccess(t("comingSoon.deleted"));
    } catch (err) {
      setError(err instanceof api.ApiClientError ? err.message : t("comingSoon.errorGeneric"));
    } finally {
      setBusyId(null);
      setConfirmId(null);
    }
  }

  const editingItem = editing && editing !== "new" ? items.find((i) => i._id === editing) : undefined;
  const activeCount = items.filter((i) => i.isActive).length;

  return (
    <div className="flex flex-col gap-6">
      {editing && (
        <Card>
          <CardHeader
            title={editingItem ? t("comingSoon.formTitleEdit") : t("comingSoon.formTitleNew")}
            className="mb-5"
          />
          <SlideForm key={editing} item={editingItem} onSaved={handleSaved} onCancel={() => setEditing(null)} />
        </Card>
      )}

      <Card padded={false}>
        <div className="border-b border-zinc-100 p-5">
          <CardHeader
            title={t("comingSoon.title")}
            subtitle={
              loading ? t("comingSoon.subtitle") : t("comingSoon.count", { total: items.length, active: activeCount })
            }
            actions={
              editing !== "new" && (
                <Button
                  onClick={() => {
                    setSuccess(null);
                    setEditing("new");
                  }}
                >
                  <Plus className="h-4 w-4" />
                  {t("comingSoon.add")}
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
            <span className="text-sm">{t("comingSoon.loading")}</span>
          </div>
        ) : items.length === 0 ? (
          <div className="p-5">
            <EmptyState icon={Sparkles} title={t("comingSoon.empty")} description={t("comingSoon.emptyBody")} />
          </div>
        ) : (
          <ul className="grid gap-5 p-5 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => {
              const busy = busyId === item._id;
              return (
                <li
                  key={item._id}
                  className={cn(
                    "flex flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm",
                    !item.isActive && "opacity-70"
                  )}
                >
                  <div className="relative aspect-[16/9] bg-zinc-100">
                    {/* eslint-disable-next-line @next/next/no-img-element -- served by our own backend via the /api rewrite */}
                    <img src={item.image} alt="" className="h-full w-full object-cover" loading="lazy" />
                    <span
                      className={cn(
                        "absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold",
                        item.isActive ? "bg-emerald-500 text-white" : "bg-zinc-900/70 text-white"
                      )}
                    >
                      {item.isActive ? t("comingSoon.visible") : t("comingSoon.hidden")}
                    </span>
                    <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-zinc-700">
                      #{item.order}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-1 p-4">
                    <p className="font-semibold text-zinc-900">{item.title}</p>
                    {item.location && (
                      <p className="flex items-center gap-1 text-xs text-zinc-500">
                        <MapPin className="h-3.5 w-3.5" />
                        {item.location}
                      </p>
                    )}
                    {item.description && <p className="line-clamp-2 text-sm text-zinc-600">{item.description}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2 border-t border-zinc-100 p-4">
                    {confirmId === item._id ? (
                      <>
                        <Button
                          className="bg-red-600 px-3 py-1.5 text-xs hover:bg-red-700"
                          loading={busy}
                          onClick={() => handleDelete(item._id)}
                        >
                          {t("comingSoon.confirmDelete")}
                        </Button>
                        <Button
                          variant="secondary"
                          className="px-3 py-1.5 text-xs"
                          disabled={busy}
                          onClick={() => setConfirmId(null)}
                        >
                          {t("comingSoon.cancel")}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="secondary"
                          className="px-3 py-1.5 text-xs"
                          onClick={() => {
                            setSuccess(null);
                            setEditing(item._id);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          {t("comingSoon.edit")}
                        </Button>
                        <Button
                          variant="secondary"
                          className="px-3 py-1.5 text-xs"
                          loading={busy}
                          onClick={() => toggleActive(item)}
                        >
                          {item.isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          {item.isActive ? t("comingSoon.hide") : t("comingSoon.show")}
                        </Button>
                        <Button
                          variant="secondary"
                          className="px-3 py-1.5 text-xs text-red-700"
                          onClick={() => setConfirmId(item._id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {t("comingSoon.delete")}
                        </Button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
