"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Bath, BedDouble, EyeOff, Mail, MapPin, Phone, UserCircle } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { describeSomaliPhone } from "@/lib/somali-phone";
import { formatUsd } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Property } from "@/lib/types";

export function PropertyCard({
  property,
  showContact = false,
  showOwnerEmail,
  actions,
}: {
  property: Property;
  // The poster's name and phone only show on the single listing page and in
  // the dashboards — public listing grids leave them out.
  showContact?: boolean;
  // Admin view: the owner's email is only returned by the admin endpoint.
  showOwnerEmail?: boolean;
  actions?: React.ReactNode;
}) {
  const { t } = useLanguage();
  const [activeImage, setActiveImage] = useState(0);
  const cover = property.images[activeImage] ?? property.images[0];
  // Which image has finished downloading; until it matches `cover` a pulse placeholder shows.
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const coverReady = loadedSrc === cover;
  const phone = describeSomaliPhone(property.phone);
  const href = `/properties/${property._id}`;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm">
      <Link
        href={href}
        className={cn(
          "relative block aspect-[4/3] bg-zinc-100",
          cover && !coverReady && "animate-pulse bg-zinc-200/80 motion-reduce:animate-none",
        )}
      >
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element -- served by our own backend via the /api rewrite
          <img
            src={cover}
            alt={`${property.neighborhood}, ${property.city}`}
            className={cn(
              "h-full w-full object-cover transition-opacity duration-500",
              coverReady ? "opacity-100" : "opacity-0",
            )}
            loading="lazy"
            // Cached images can finish before React attaches onLoad, so also check on mount.
            ref={(img) => {
              if (img?.complete && img.naturalWidth > 0) setLoadedSrc(img.getAttribute("src"));
            }}
            onLoad={() => setLoadedSrc(cover)}
            onError={() => setLoadedSrc(cover)}
          />
        )}
        {property.images.length > 1 && (
          <span className="absolute right-3 top-3 rounded-full bg-zinc-900/70 px-2.5 py-1 text-xs font-medium text-white">
            {activeImage + 1}/{property.images.length}
          </span>
        )}
        {property.billingHidden && (
          <span className="absolute inset-x-3 bottom-3 flex items-center gap-1.5 rounded-xl bg-amber-500/95 px-3 py-1.5 text-xs font-semibold text-white shadow">
            <EyeOff className="h-3.5 w-3.5 shrink-0" />
            {t("billing.hiddenBadge")}
          </span>
        )}
      </Link>

      {property.images.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto px-4 pt-3">
          {property.images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActiveImage(i)}
              aria-label={t("listings.showImage", { n: i + 1 })}
              aria-pressed={i === activeImage}
              className={cn(
                "h-12 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors",
                i === activeImage ? "border-rose-500" : "border-transparent opacity-70 hover:opacity-100"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="text-lg font-semibold text-zinc-900">
            {formatUsd(property.price)}
            <span className="text-sm font-normal text-zinc-500"> {t("listings.perMonth")}</span>
          </p>
          <p className="text-xs text-zinc-500">
            {t("listings.depositLabel")}: <span className="font-medium text-zinc-700">{formatUsd(property.deposit)}</span>
          </p>
          <Link href={href} className="mt-2 flex items-center gap-1.5 font-semibold text-zinc-900 hover:text-rose-700">
            <MapPin className="h-4 w-4 shrink-0 text-rose-600" />
            {property.neighborhood}, {property.city}
          </Link>
          <div className="mt-2 flex flex-wrap gap-3 text-sm text-zinc-600">
            <span className="flex items-center gap-1.5">
              <BedDouble className="h-4 w-4 text-zinc-400" />
              {t("listings.roomsCount", { count: property.rooms })}
            </span>
            <span className="flex items-center gap-1.5">
              <Bath className="h-4 w-4 text-zinc-400" />
              {t("listings.bathroomsCount", { count: property.bathrooms })}
            </span>
          </div>
        </div>

        <p className="line-clamp-3 whitespace-pre-line text-sm text-zinc-600">{property.description}</p>

        {showContact ? (
          <div className="mt-auto flex flex-col gap-1.5 rounded-xl bg-zinc-50 p-3 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{t("listings.postedBy")}</p>
            <p className="flex items-center gap-1.5 font-medium text-zinc-900">
              <UserCircle className="h-4 w-4 text-zinc-400" />
              {property.owner.firstName} {property.owner.lastName}
            </p>
            <a href={`tel:${property.phone}`} className="flex items-center gap-1.5 text-rose-700 hover:text-rose-800">
              <Phone className="h-4 w-4" />
              {phone.formatted}
              {phone.provider && <span className="text-xs text-zinc-500">· {phone.provider}</span>}
            </a>
            {showOwnerEmail && property.owner.email && (
              <p className="flex items-center gap-1.5 text-zinc-600">
                <Mail className="h-4 w-4 text-zinc-400" />
                {property.owner.email}
              </p>
            )}
            {showOwnerEmail && property.owner.city && (
              <p className="flex items-center gap-1.5 text-zinc-600">
                <MapPin className="h-4 w-4 text-zinc-400" />
                {t("listings.ownerCity", { city: property.owner.city })}
              </p>
            )}
            <p className="text-xs text-zinc-400">
              {t("listings.postedOn", { date: new Date(property.createdAt).toLocaleDateString() })}
            </p>
          </div>
        ) : (
          <div className="mt-auto flex items-center justify-between gap-3 border-t border-zinc-100 pt-3 text-sm">
            <span className="text-xs text-zinc-400">
              {t("listings.postedOn", { date: new Date(property.createdAt).toLocaleDateString() })}
            </span>
            <Link href={href} className="inline-flex items-center gap-1 font-medium text-rose-600 hover:text-rose-700">
              {t("listings.viewDetails")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </article>
  );
}
