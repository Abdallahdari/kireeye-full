"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BedDouble, Building2, EyeOff } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { useLanguage } from "@/components/language-provider";
import { formatDate, formatUsd } from "@/lib/format";
import * as api from "@/lib/api-client";
import type { Property } from "@/lib/types";

const LIMIT = 5;

/** The newest few listings — the business's own, or every listing for admins. */
export function RecentListings({ mode }: { mode: "business" | "admin" }) {
  const { t } = useLanguage();
  const [properties, setProperties] = useState<Property[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = mode === "admin" ? api.listAllProperties : api.listMyProperties;
    load({ limit: LIMIT })
      .then((result) => {
        if (cancelled) return;
        setProperties(result.properties);
        setTotal(result.pagination.total);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [mode]);

  const manageHref = mode === "admin" ? "/dashboard/admin/listings" : "/dashboard/business/listings";

  return (
    <Card>
      <CardHeader
        title={t(mode === "admin" ? "listings.adminTitle" : "listings.businessTitle")}
        subtitle={properties ? t("listings.totalCount", { total }) : undefined}
        actions={
          <Link
            href={manageHref}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-rose-600 hover:text-rose-700"
          >
            {t("listings.viewAll")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      <ul className="mt-4 flex flex-col divide-y divide-zinc-50">
        {error ? (
          <li className="py-6 text-center text-sm text-zinc-400">{t("listings.errorLoad")}</li>
        ) : properties === null ? (
          [0, 1, 2].map((i) => (
            <li key={i} className="flex items-center gap-3 py-3">
              <span className="h-12 w-16 shrink-0 animate-pulse rounded-lg bg-zinc-100" />
              <span className="h-4 w-1/2 animate-pulse rounded bg-zinc-100" />
            </li>
          ))
        ) : properties.length === 0 ? (
          <li className="flex flex-col items-center gap-2 py-8 text-center">
            <Building2 className="h-6 w-6 text-zinc-300" />
            <p className="text-sm font-medium text-zinc-700">{t("listings.empty")}</p>
            {mode === "business" && (
              <>
                <p className="max-w-sm text-sm text-zinc-500">{t("listings.emptyBusinessBody")}</p>
                <Link href={manageHref} className="mt-1 text-sm font-medium text-rose-600 hover:text-rose-700">
                  {t("listings.add")}
                </Link>
              </>
            )}
          </li>
        ) : (
          properties.map((property) => (
            <li key={property._id}>
              <Link
                href={`/properties/${property._id}`}
                className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-rose-50/60"
              >
                {property.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={property.images[0]} alt="" className="h-12 w-16 shrink-0 rounded-lg object-cover" />
                ) : (
                  <span className="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
                    <Building2 className="h-5 w-5 text-zinc-300" />
                  </span>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900">
                    {property.neighborhood}, {property.city}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-zinc-500">
                    <span className="inline-flex items-center gap-1">
                      <BedDouble className="h-3.5 w-3.5" />
                      {t("listings.roomsCount", { count: property.rooms })}
                    </span>
                    {mode === "admin" && (
                      <span className="truncate">
                        {property.owner.firstName} {property.owner.lastName}
                      </span>
                    )}
                    <span>{formatDate(property.createdAt)}</span>
                    {property.billingHidden && (
                      <span className="inline-flex items-center gap-1 font-medium text-amber-600">
                        <EyeOff className="h-3.5 w-3.5" />
                        {t("billing.hiddenBadge")}
                      </span>
                    )}
                  </p>
                </div>

                <p className="shrink-0 text-right text-sm font-semibold text-zinc-900">
                  {formatUsd(property.price)}
                  <span className="block text-xs font-normal text-zinc-400">{t("listings.perMonth")}</span>
                </p>
              </Link>
            </li>
          ))
        )}
      </ul>
    </Card>
  );
}
