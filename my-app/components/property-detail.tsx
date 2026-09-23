"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowLeft, Bath, BedDouble, CalendarDays, Flag, MapPin, Phone, UserCircle, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { useAuth } from "@/components/auth-provider";
import { useLanguage } from "@/components/language-provider";
import * as api from "@/lib/api-client";
import { describeSomaliPhone } from "@/lib/somali-phone";
import { formatUsd } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Property, ReportReason } from "@/lib/types";

export function PropertyDetail({ property }: { property: Property }) {
  const { t } = useLanguage();
  const [activeImage, setActiveImage] = useState(0);
  const phone = describeSomaliPhone(property.phone);

  const facts = [
    { icon: BedDouble, label: t("listings.form.rooms"), value: property.rooms },
    { icon: Bath, label: t("listings.form.bathrooms"), value: property.bathrooms },
    { icon: Wallet, label: t("listings.depositLabel"), value: formatUsd(property.deposit) },
    {
      icon: CalendarDays,
      label: t("property.listedOn"),
      value: new Date(property.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <div className="flex-1 px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <Link
          href="/properties"
          className="flex w-fit items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("property.backToAll")}
        </Link>

        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            <MapPin className="h-6 w-6 shrink-0 text-rose-600" />
            {property.neighborhood}, {property.city}
          </h1>
        </div>

        {/* Gallery */}
        <div className="flex flex-col gap-3">
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-zinc-100 sm:aspect-[16/8]">
            {/* eslint-disable-next-line @next/next/no-img-element -- served by our own backend via the /api rewrite */}
            <img
              src={property.images[activeImage]}
              alt={`${property.neighborhood}, ${property.city} — ${activeImage + 1}`}
              className="h-full w-full object-cover"
            />
            {property.images.length > 1 && (
              <span className="absolute bottom-3 right-3 rounded-full bg-zinc-900/70 px-3 py-1 text-xs font-medium text-white">
                {activeImage + 1}/{property.images.length}
              </span>
            )}
          </div>
          {property.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {property.images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  aria-label={t("listings.showImage", { n: i + 1 })}
                  aria-pressed={i === activeImage}
                  className={cn(
                    "h-20 w-28 shrink-0 overflow-hidden rounded-xl border-2 transition-colors",
                    i === activeImage ? "border-rose-500" : "border-transparent opacity-70 hover:opacity-100"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {facts.map((fact) => (
                <div key={fact.label} className="rounded-2xl border border-zinc-100 bg-white p-4">
                  <fact.icon className="h-5 w-5 text-rose-600" />
                  <p className="mt-2 text-xs font-medium text-zinc-500">{fact.label}</p>
                  <p className="mt-0.5 font-semibold text-zinc-900">{fact.value}</p>
                </div>
              ))}
            </div>

            <Card>
              <h2 className="font-semibold text-zinc-900">{t("property.aboutTitle")}</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-zinc-700">{property.description}</p>
            </Card>
          </div>

          <div className="flex flex-col gap-6">
            <Card className="lg:sticky lg:top-24">
              <p className="text-3xl font-semibold text-zinc-900">
                {formatUsd(property.price)}
                <span className="text-base font-normal text-zinc-500"> {t("listings.perMonth")}</span>
              </p>
              <p className="mt-1 text-sm text-zinc-600">
                {t("listings.depositLabel")}: <span className="font-semibold">{formatUsd(property.deposit)}</span>
              </p>

              <div className="mt-5 border-t border-zinc-100 pt-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{t("listings.postedBy")}</p>
                <p className="mt-2 flex items-center gap-2 font-medium text-zinc-900">
                  <UserCircle className="h-5 w-5 text-zinc-400" />
                  {property.owner.firstName} {property.owner.lastName}
                </p>
                <a
                  href={`tel:${property.phone}`}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-rose-600 px-5 py-3 text-sm font-semibold text-white hover:bg-rose-700"
                >
                  <Phone className="h-4 w-4" />
                  {t("property.call", { phone: phone.formatted })}
                </a>
                {phone.provider && <p className="mt-2 text-center text-xs text-zinc-500">{phone.provider}</p>}
              </div>
            </Card>

            <ReportListingPanel property={property} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportListingPanel({ property }: { property: Property }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("FAKE_LISTING");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Businesses can't report their own listing.
  if (user && user._id === property.owner._id) return null;

  const reasons: { value: ReportReason; label: string }[] = [
    { value: "FAKE_LISTING", label: t("reportForm.reasonFakeListing") },
    { value: "SCAM_OR_FRAUD", label: t("reportForm.reasonScamOrFraud") },
    { value: "SUSPICIOUS_ACTIVITY", label: t("reportForm.reasonSuspiciousActivity") },
    { value: "HARASSMENT", label: t("reportForm.reasonHarassment") },
    { value: "OTHER", label: t("reportForm.reasonOther") },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.createReport({ propertyId: property._id, reason, details });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof api.ApiClientError ? err.message : t("property.reportError"));
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return <Alert variant="success">{t("property.reportSubmitted")}</Alert>;
  }

  if (!user) {
    return (
      <p className="flex items-center justify-center gap-1.5 text-sm text-zinc-500">
        <Flag className="h-4 w-4" />
        <Link href={`/login?next=${encodeURIComponent(pathname)}`} className="font-medium text-zinc-700 underline">
          {t("property.loginToReport")}
        </Link>
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-red-700"
      >
        <Flag className="h-4 w-4" />
        {t("property.reportListing")}
      </button>
    );
  }

  return (
    <Card>
      <h2 className="flex items-center gap-2 font-semibold text-zinc-900">
        <Flag className="h-4 w-4 text-red-600" />
        {t("property.reportListing")}
      </h2>
      <p className="mt-1 text-sm text-zinc-500">{t("property.reportSubtitle")}</p>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
        {error && <Alert variant="error">{error}</Alert>}

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-zinc-700">{t("reportForm.reason")}</span>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value as ReportReason)}
            className="rounded-xl border border-zinc-200 px-3.5 py-2.5 text-zinc-900 outline-none transition-colors focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
          >
            {reasons.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-zinc-700">{t("reportForm.details")}</span>
          <textarea
            required
            minLength={10}
            maxLength={1000}
            rows={4}
            placeholder={t("property.reportDetailsPlaceholder")}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            className="rounded-xl border border-zinc-200 px-3.5 py-2.5 text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
          />
        </label>

        <div className="flex gap-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={() => setOpen(false)} disabled={loading}>
            {t("listings.form.cancel")}
          </Button>
          <Button type="submit" className="flex-1" loading={loading}>
            {t("reportForm.submit")}
          </Button>
        </div>
      </form>
    </Card>
  );
}
