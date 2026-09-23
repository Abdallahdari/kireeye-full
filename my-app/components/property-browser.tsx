"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Building2, Search, X } from "lucide-react";
import { PropertyCard } from "@/components/property-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PaginationFooter } from "@/components/ui/pagination";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/language-provider";
import * as api from "@/lib/api-client";
import { MOGADISHU_DISTRICTS, SOMALI_CITIES } from "@/lib/locations";
import type { Property } from "@/lib/types";

const PAGE_SIZE = 12;
const FILTER_KEYS = ["city", "neighborhood", "maxPrice", "minRooms"] as const;

const inputClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100";

function toNumber(value: string | null): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

/**
 * Public listing search. Filters live in the URL (?neighborhood=Hodan&maxPrice=400…)
 * so results are shareable and the home page search can link straight here.
 */
export function PropertyBrowser() {
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();

  const [properties, setProperties] = useState<Property[]>([]);
  const [pagination, setPagination] = useState<api.Pagination | null>(null);
  const [error, setError] = useState<string | null>(null);
  // The query whose results are on screen; anything else means a fetch is in flight.
  const [loadedQuery, setLoadedQuery] = useState<string | null>(null);
  const loading = loadedQuery !== queryString;

  const page = toNumber(searchParams.get("page")) ?? 1;
  const hasFilters = FILTER_KEYS.some((key) => searchParams.get(key));

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams(queryString);

    api
      .listProperties({
        city: params.get("city") ?? undefined,
        neighborhood: params.get("neighborhood") ?? undefined,
        maxPrice: toNumber(params.get("maxPrice")),
        minRooms: toNumber(params.get("minRooms")),
        page: toNumber(params.get("page")),
        limit: PAGE_SIZE,
      })
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
        if (!cancelled) setLoadedQuery(queryString);
      });

    return () => {
      cancelled = true;
    };
  }, [queryString, t]);

  function navigate(params: URLSearchParams) {
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const params = new URLSearchParams();
    for (const key of FILTER_KEYS) {
      const value = String(form.get(key) ?? "").trim();
      if (value) params.set(key, value);
    }
    navigate(params);
  }

  function changePage(next: number) {
    const params = new URLSearchParams(queryString);
    params.set("page", String(next));
    navigate(params);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Keyed on the query so the inputs reset when the URL changes (back/forward, clear). */}
      <form
        key={queryString}
        onSubmit={handleSubmit}
        className="grid gap-3 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]"
      >
        <label className="flex flex-col gap-1 text-xs font-semibold text-zinc-500">
          {t("properties.filterNeighborhood")}
          <input
            name="neighborhood"
            list="browse-districts"
            placeholder={t("properties.anyNeighborhood")}
            defaultValue={searchParams.get("neighborhood") ?? ""}
            className={inputClass}
          />
          <datalist id="browse-districts">
            {MOGADISHU_DISTRICTS.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-zinc-500">
          {t("properties.filterCity")}
          <select name="city" defaultValue={searchParams.get("city") ?? ""} className={inputClass}>
            <option value="">{t("properties.anyCity")}</option>
            {SOMALI_CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-zinc-500">
          {t("properties.filterMaxPrice")}
          <input
            name="maxPrice"
            type="number"
            min={0}
            step="any"
            inputMode="decimal"
            placeholder={t("properties.noLimit")}
            defaultValue={searchParams.get("maxPrice") ?? ""}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-zinc-500">
          {t("properties.filterRooms")}
          <select name="minRooms" defaultValue={searchParams.get("minRooms") ?? ""} className={inputClass}>
            <option value="">{t("properties.anyRooms")}</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {t("properties.roomsPlus", { count: n })}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end gap-2">
          <Button type="submit" className="w-full lg:w-auto">
            <Search className="h-4 w-4" />
            {t("properties.search")}
          </Button>
          {hasFilters && (
            <Button
              type="button"
              variant="secondary"
              aria-label={t("properties.clearFilters")}
              onClick={() => navigate(new URLSearchParams())}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </form>

      {error && <Alert variant="error">{error}</Alert>}

      {!loading && pagination && (
        <p className="text-sm text-zinc-500">{t("properties.resultsCount", { total: pagination.total })}</p>
      )}

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-[28rem] animate-pulse rounded-2xl bg-zinc-100" />
          ))}
        </div>
      ) : properties.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={hasFilters ? t("properties.noResults") : t("home.noListings")}
          description={hasFilters ? t("properties.noResultsBody") : t("home.noListingsBody")}
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <PropertyCard key={property._id} property={property} />
          ))}
        </div>
      )}

      {pagination && pagination.pages > 1 && !loading && (
        <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white">
          <PaginationFooter
            pagination={pagination}
            page={page}
            onPageChange={changePage}
            label={t("listings.pageOf", { page: pagination.page, pages: pagination.pages, total: pagination.total })}
            previousLabel={t("common.previous")}
            nextLabel={t("common.next")}
          />
        </div>
      )}
    </div>
  );
}
