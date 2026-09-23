"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Building2, Download, Loader2, Plus, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PaginationFooter } from "@/components/ui/pagination";
import { PropertyCard } from "@/components/property-card";
import { PropertyForm } from "@/components/dashboard/property-form";
import { selectClass } from "@/components/ui/city-select";
import { BillingBanner } from "@/components/dashboard/billing-banner";
import { formatUsd } from "@/lib/format";
import { useLanguage } from "@/components/language-provider";
import * as api from "@/lib/api-client";
import { cn } from "@/lib/cn";
import { SOMALI_CITIES } from "@/lib/locations";
import { SOMALI_PROVIDERS } from "@/lib/somali-phone";
import type { BillingSummary, Property } from "@/lib/types";

interface AdminFilters {
  q: string;
  city: string;
  provider: string;
}

const EMPTY_FILTERS: AdminFilters = { q: "", city: "", provider: "" };

function toParams(filters: AdminFilters) {
  return {
    q: filters.q.trim() || undefined,
    city: filters.city || undefined,
    provider: filters.provider || undefined,
  };
}

const PAGE_SIZE = 9;

/**
 * "business" lists the logged-in business's own listings and lets them add
 * new ones; "admin" lists every listing with the poster's full details.
 * Both can delete.
 */
export function PropertyListings({ mode }: { mode: "business" | "admin" }) {
  const { t } = useLanguage();
  const isAdmin = mode === "admin";

  const [properties, setProperties] = useState<Property[]>([]);
  const [pagination, setPagination] = useState<api.Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);
  // Admin filters: `draft` is what's in the inputs, `filters` is what's applied.
  const [draft, setDraft] = useState<AdminFilters>(EMPTY_FILTERS);
  const [filters, setFilters] = useState<AdminFilters>(EMPTY_FILTERS);
  const [exporting, setExporting] = useState(false);
  const hasFilters = Boolean(filters.q || filters.city || filters.provider);
  // Business mode: whether they can publish, and why not.
  const [billing, setBilling] = useState<BillingSummary | null>(null);
  const canPublish = billing?.canPublish ?? true;

  const loadBilling = useCallback(() => {
    if (isAdmin) return;
    api
      .getMyBilling()
      .then(({ billing }) => setBilling(billing))
      .catch(() => {
        // The banner is informational; the server still enforces the limit.
      });
  }, [isAdmin]);

  useEffect(() => {
    loadBilling();
  }, [loadBilling]);

  useEffect(() => {
    let cancelled = false;
    const request = isAdmin
      ? api.listAllProperties({ ...toParams(filters), page, limit: PAGE_SIZE })
      : api.listMyProperties({ page, limit: PAGE_SIZE });

    request
      .then((result) => {
        if (cancelled) return;
        setProperties(result.properties);
        setPagination(result.pagination);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof api.ApiClientError ? err.message : t("listings.errorLoad"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAdmin, page, refreshIndex, filters, t]);

  function applyFilters(next: AdminFilters) {
    setDraft(next);
    setFilters(next);
    setPage(1);
  }

  async function handleExport() {
    setExporting(true);
    setError(null);
    try {
      await api.exportProperties(toParams(filters));
    } catch (err) {
      setError(err instanceof api.ApiClientError ? err.message : t("listings.admin.exportError"));
    } finally {
      setExporting(false);
    }
  }

  function handleCreated() {
    setShowForm(false);
    setSuccess(t("listings.published"));
    setPage(1);
    setRefreshIndex((i) => i + 1);
    loadBilling();
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    setError(null);
    setSuccess(null);
    try {
      await api.deleteProperty(id);
      setSuccess(t("listings.deleted"));
      loadBilling();
      // Step back a page if we just removed the last item on it.
      if (properties.length === 1 && page > 1) setPage(page - 1);
      else setRefreshIndex((i) => i + 1);
    } catch (err) {
      setError(err instanceof api.ApiClientError ? err.message : t("listings.errorDelete"));
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {!isAdmin && billing && <BillingBanner billing={billing} />}

      {showForm && canPublish && (
        <Card>
          <CardHeader title={t("listings.form.title")} subtitle={t("listings.form.subtitle")} className="mb-5" />
          <PropertyForm onCreated={handleCreated} onCancel={() => setShowForm(false)} />
        </Card>
      )}

      <Card padded={false}>
        <div className="border-b border-zinc-100 p-5">
          <CardHeader
            title={isAdmin ? t("listings.adminTitle") : t("listings.businessTitle")}
            subtitle={
              pagination
                ? t("listings.totalCount", { total: pagination.total })
                : isAdmin
                  ? t("listings.adminSubtitle")
                  : t("listings.businessSubtitle")
            }
            actions={
              isAdmin ? (
                <Button variant="secondary" onClick={handleExport} loading={exporting} disabled={pagination?.total === 0}>
                  <Download className="h-4 w-4" />
                  {hasFilters ? t("listings.admin.exportFiltered") : t("listings.admin.exportAll")}
                </Button>
              ) : !canPublish ? (
                <Link
                  href="/dashboard/business/billing"
                  className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700"
                >
                  {t("billing.payNow", { price: formatUsd(billing?.monthlyPriceUsd) })}
                </Link>
              ) : (
                !showForm && (
                  <Button onClick={() => { setSuccess(null); setShowForm(true); }}>
                    <Plus className="h-4 w-4" />
                    {t("listings.add")}
                  </Button>
                )
              )
            }
          />

          {isAdmin && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                applyFilters(draft);
              }}
              className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto]"
            >
              <label className="relative">
                <span className="sr-only">{t("listings.admin.searchLabel")}</span>
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  type="search"
                  value={draft.q}
                  onChange={(e) => setDraft((d) => ({ ...d, q: e.target.value }))}
                  placeholder={t("listings.admin.searchPlaceholder")}
                  className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-3.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                />
              </label>
              <label>
                <span className="sr-only">{t("listings.form.city")}</span>
                <select
                  value={draft.city}
                  onChange={(e) => applyFilters({ ...draft, city: e.target.value })}
                  className={cn(selectClass, "w-full text-sm")}
                >
                  <option value="">{t("properties.anyCity")}</option>
                  {SOMALI_CITIES.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="sr-only">{t("listings.admin.providerLabel")}</span>
                <select
                  value={draft.provider}
                  onChange={(e) => applyFilters({ ...draft, provider: e.target.value })}
                  className={cn(selectClass, "w-full text-sm")}
                >
                  <option value="">{t("listings.admin.anyProvider")}</option>
                  {SOMALI_PROVIDERS.map((provider) => (
                    <option key={provider} value={provider}>
                      {provider}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1 lg:flex-none">
                  <Search className="h-4 w-4" />
                  {t("properties.search")}
                </Button>
                {(hasFilters || draft.q) && (
                  <Button
                    type="button"
                    variant="secondary"
                    aria-label={t("properties.clearFilters")}
                    onClick={() => applyFilters(EMPTY_FILTERS)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </form>
          )}
        </div>

        {(error || success) && (
          <div className="p-5 pb-0">
            {error ? <Alert variant="error">{error}</Alert> : <Alert variant="success">{success}</Alert>}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center gap-2 px-5 py-14 text-zinc-400">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-sm">{t("listings.loading")}</span>
          </div>
        ) : properties.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={Building2}
              title={isAdmin && hasFilters ? t("properties.noResults") : t("listings.empty")}
              description={isAdmin ? undefined : t("listings.emptyBusinessBody")}
              action={
                !isAdmin &&
                canPublish &&
                !showForm && (
                  <Button onClick={() => setShowForm(true)}>
                    <Plus className="h-4 w-4" />
                    {t("listings.add")}
                  </Button>
                )
              }
            />
          </div>
        ) : (
          <div className="grid gap-5 p-5 sm:grid-cols-2 xl:grid-cols-3">
            {properties.map((property) => {
              const isConfirming = confirmId === property._id;
              const isDeleting = deletingId === property._id;

              return (
                <PropertyCard
                  key={property._id}
                  property={property}
                  showOwnerEmail={isAdmin}
                  actions={
                    isConfirming ? (
                      <>
                        <Button
                          className="bg-red-600 px-3 py-1.5 text-xs hover:bg-red-700"
                          loading={isDeleting}
                          onClick={() => handleDelete(property._id)}
                        >
                          {t("listings.confirmDelete")}
                        </Button>
                        <Button
                          variant="secondary"
                          className="px-3 py-1.5 text-xs"
                          disabled={isDeleting}
                          onClick={() => setConfirmId(null)}
                        >
                          {t("listings.form.cancel")}
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="secondary"
                        className="px-3 py-1.5 text-xs text-red-700"
                        onClick={() => setConfirmId(property._id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {t("listings.delete")}
                      </Button>
                    )
                  }
                />
              );
            })}
          </div>
        )}

        {pagination && (
          <PaginationFooter
            pagination={pagination}
            page={page}
            onPageChange={setPage}
            label={t("listings.pageOf", { page: pagination.page, pages: pagination.pages, total: pagination.total })}
            previousLabel={t("common.previous")}
            nextLabel={t("common.next")}
          />
        )}
      </Card>
    </div>
  );
}
