"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle2, Gift } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { formatUsd } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { BillingSummary } from "@/lib/types";

/** One-line billing status for the business Listings page, linking to Billing. */
export function BillingBanner({ billing }: { billing: BillingSummary }) {
  const { t } = useLanguage();
  const price = formatUsd(billing.monthlyPriceUsd);

  if (billing.status === "PAID") {
    return (
      <Banner tone="emerald" icon={CheckCircle2}>
        {t("billing.banner.paid", {
          date: new Date(billing.subscriptionPaidUntil!).toLocaleDateString(),
        })}
      </Banner>
    );
  }

  if (billing.status === "FREE") {
    return (
      <Banner tone="zinc" icon={Gift}>
        {t("billing.banner.free", {
          used: billing.listingsPublished,
          limit: billing.freeListingLimit,
          remaining: billing.freeListingsRemaining,
          price,
        })}
      </Banner>
    );
  }

  return (
    <Banner
      tone="amber"
      icon={AlertTriangle}
      action={
        <Link
          href="/dashboard/business/billing"
          className="shrink-0 rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
        >
          {t("billing.payNow", { price })}
        </Link>
      }
    >
      <span className="font-semibold">{t("billing.banner.unpaidTitle", { limit: billing.freeListingLimit })}</span>{" "}
      {t("billing.banner.unpaidBody", { price })}
      {billing.hiddenListings > 0 && (
        <span className="mt-1 block font-medium">{t("billing.banner.hidden", { count: billing.hiddenListings })}</span>
      )}
    </Banner>
  );
}

const tones = {
  emerald: "border-emerald-100 bg-emerald-50 text-emerald-800",
  zinc: "border-zinc-200 bg-zinc-50 text-zinc-700",
  amber: "border-amber-200 bg-amber-50 text-amber-900",
} as const;

function Banner({
  tone,
  icon: Icon,
  action,
  children,
}: {
  tone: keyof typeof tones;
  icon: typeof Gift;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between",
        tones[tone]
      )}
      role="status"
    >
      <p className="flex items-start gap-2.5">
        <Icon className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{children}</span>
      </p>
      {action}
    </div>
  );
}
