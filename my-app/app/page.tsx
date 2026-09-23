"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { PropertyCard } from "@/components/property-card";
import { EmptyState } from "@/components/ui/empty-state";
import * as api from "@/lib/api-client";
import { MOGADISHU_DISTRICTS } from "@/lib/locations";
import type { Property } from "@/lib/types";

const FEATURED_LIMIT = 6;

export default function Home() {
  const { t } = useLanguage();
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .listProperties({ limit: FEATURED_LIMIT })
      .then((result) => {
        if (!cancelled) setProperties(result.properties);
      })
      .catch(() => {
        // Leave the section on its empty state if listings can't load.
      })
      .finally(() => {
        if (!cancelled) setLoadingListings(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const params = new URLSearchParams();
    for (const [key, value] of new FormData(e.currentTarget)) {
      if (typeof value === "string" && value.trim()) params.set(key, value.trim());
    }
    const qs = params.toString();
    router.push(qs ? `/properties?${qs}` : "/properties");
  }

  const steps = [
    { title: t("home.step1Title"), description: t("home.step1Body") },
    { title: t("home.step2Title"), description: t("home.step2Body") },
    { title: t("home.step3Title"), description: t("home.step3Body") },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <section className="bg-gradient-to-b from-rose-50 to-white px-6 py-20">
        <div className="mx-auto flex max-w-6xl flex-col items-center text-center">
          <span className="rounded-full bg-rose-100 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-rose-700">
            {t("home.badge")}
          </span>
          <h1 className="mt-6 max-w-2xl text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
            {t("home.title")}
          </h1>
          <p className="mt-4 max-w-xl text-lg text-zinc-600">{t("home.subtitle")}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className="rounded-full bg-rose-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-rose-700"
            >
              {t("home.getStarted")}
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-zinc-200 bg-white px-6 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
            >
              {t("home.logIn")}
            </Link>
          </div>

          <form
            action="/properties"
            onSubmit={handleSearch}
            className="mt-12 flex w-full max-w-3xl flex-col gap-3 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
          >
            <label className="flex-1 rounded-xl px-4 py-2 text-left">
              <span className="block text-xs font-semibold text-zinc-400">{t("home.searchWhere")}</span>
              <input
                name="neighborhood"
                list="home-districts"
                placeholder={t("home.searchWhereValue")}
                className="w-full bg-transparent text-sm text-zinc-700 outline-none placeholder:text-zinc-500"
              />
              <datalist id="home-districts">
                {MOGADISHU_DISTRICTS.map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
            </label>
            <div className="hidden h-8 w-px bg-zinc-100 sm:block" />
            <label className="flex-1 rounded-xl px-4 py-2 text-left">
              <span className="block text-xs font-semibold text-zinc-400">{t("home.searchMaxRent")}</span>
              <input
                name="maxPrice"
                type="number"
                min={0}
                inputMode="decimal"
                placeholder={t("properties.noLimit")}
                className="w-full bg-transparent text-sm text-zinc-700 outline-none placeholder:text-zinc-500"
              />
            </label>
            <div className="hidden h-8 w-px bg-zinc-100 sm:block" />
            <label className="flex-1 rounded-xl px-4 py-2 text-left">
              <span className="block text-xs font-semibold text-zinc-400">{t("properties.filterRooms")}</span>
              <select name="minRooms" defaultValue="" className="w-full bg-transparent text-sm text-zinc-700 outline-none">
                <option value="">{t("properties.anyRooms")}</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {t("properties.roomsPlus", { count: n })}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="rounded-full bg-zinc-900 px-6 py-3 text-center text-sm font-semibold text-white hover:bg-zinc-800"
            >
              {t("home.search")}
            </button>
          </form>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-2xl font-semibold text-zinc-900">{t("home.featured")}</h2>
            <Link href="/properties" className="text-sm font-semibold text-rose-600 hover:text-rose-700">
              {t("home.viewAll")} →
            </Link>
          </div>
          {loadingListings ? (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="h-96 animate-pulse rounded-2xl bg-zinc-100" />
              ))}
            </div>
          ) : properties.length === 0 ? (
            <EmptyState
              className="mt-8"
              icon={Building2}
              title={t("home.noListings")}
              description={t("home.noListingsBody")}
              action={
                <Link
                  href="/register"
                  className="rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700"
                >
                  {t("home.ctaButton")}
                </Link>
              }
            />
          ) : (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {properties.map((property) => (
                <PropertyCard key={property._id} property={property} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="how-it-works" className="border-t border-zinc-100 bg-zinc-50 px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-semibold text-zinc-900">{t("home.howItWorksTitle")}</h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-3">
            {steps.map((step, i) => (
              <div key={step.title} className="rounded-2xl bg-white p-6 shadow-sm">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-600 text-sm font-semibold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-4 font-semibold text-zinc-900">{step.title}</h3>
                <p className="mt-2 text-sm text-zinc-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto flex max-w-6xl flex-col items-center rounded-2xl bg-zinc-900 px-8 py-12 text-center text-white">
          <h2 className="text-2xl font-semibold">{t("home.ctaTitle")}</h2>
          <p className="mt-2 max-w-md text-zinc-300">{t("home.ctaSubtitle")}</p>
          <Link
            href="/register"
            className="mt-6 rounded-full bg-white px-6 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-100"
          >
            {t("home.ctaButton")}
          </Link>
        </div>
      </section>
    </div>
  );
}
