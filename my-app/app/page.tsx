"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { PropertyCard } from "@/components/property-card";
import { BlogCard } from "@/components/blog-card";
import { PropertyGridSkeleton } from "@/components/property-card-skeleton";
import { ComingSoonSlider } from "@/components/coming-soon-slider";
import { HeroSlider } from "@/components/hero-slider";
import { HowItWorks } from "@/components/how-it-works";
import { EmptyState } from "@/components/ui/empty-state";
import * as api from "@/lib/api-client";
import { MOGADISHU_DISTRICTS } from "@/lib/locations";
import type { BlogPost, ComingSoonItem, Property } from "@/lib/types";

const FEATURED_LIMIT = 6;
const BLOG_LIMIT = 3;

export default function Home() {
  const { t } = useLanguage();
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [slides, setSlides] = useState<ComingSoonItem[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    let cancelled = false;
    // Both sections are optional extras: on failure they simply stay hidden.
    api
      .listComingSoon()
      .then(({ items }) => {
        if (!cancelled) setSlides(items);
      })
      .catch(() => undefined);
    api
      .listBlogPosts({ limit: BLOG_LIMIT })
      .then(({ posts }) => {
        if (!cancelled) setPosts(posts);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

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

  const ownerFacts = [
    { title: t("home.ownersFact1Title"), body: t("home.ownersFact1Body") },
    { title: t("home.ownersFact2Title"), body: t("home.ownersFact2Body") },
    { title: t("home.ownersFact3Title"), body: t("home.ownersFact3Body") },
  ];

  const steps = [
    { title: t("home.step1Title"), description: t("home.step1Body") },
    { title: t("home.step2Title"), description: t("home.step2Body") },
    { title: t("home.step3Title"), description: t("home.step3Body") },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <HeroSlider>
        <div className="mx-auto flex max-w-6xl flex-col items-center text-center">
          <span className="rounded-full bg-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white ring-1 ring-white/30 backdrop-blur">
            {t("home.badge")}
          </span>
          <h1 className="mt-6 max-w-2xl text-4xl font-semibold tracking-tight text-white drop-shadow sm:text-5xl">
            {t("home.title")}
          </h1>
          <p className="mt-4 max-w-xl text-lg text-zinc-100">{t("home.subtitle")}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/properties"
              className="rounded-full bg-gradient-to-r from-rose-600 to-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-black/30 transition hover:brightness-110"
            >
              {t("home.browseProperties")} →
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-100"
            >
              {t("home.getStarted")}
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur hover:bg-white/20"
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
              className="rounded-full bg-gradient-to-r from-rose-600 to-orange-500 px-6 py-3 text-center text-sm font-semibold text-white shadow-md shadow-black/20 transition hover:brightness-110"
            >
              {t("home.search")}
            </button>
          </form>
        </div>
      </HeroSlider>

      {slides.length > 0 && (
        <section className="px-6 pt-4">
          <div className="mx-auto flex max-w-6xl justify-center">
            <ComingSoonSlider items={slides} />
          </div>
        </section>
      )}

      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-2xl font-semibold text-zinc-900">{t("home.featured")}</h2>
            <Link href="/properties" className="text-sm font-semibold text-rose-600 hover:text-rose-700">
              {t("home.viewAll")} →
            </Link>
          </div>
          {loadingListings ? (
            <PropertyGridSkeleton count={3} className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" />
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

      <HowItWorks steps={steps} />

      {posts.length > 0 && (
        <section className="px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-zinc-900">{t("home.blogTitle")}</h2>
                <p className="mt-1 text-sm text-zinc-500">{t("home.blogSubtitle")}</p>
              </div>
              <Link href="/blog" className="shrink-0 text-sm font-semibold text-rose-600 hover:text-rose-700">
                {t("home.viewAll")} →
              </Link>
            </div>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <BlogCard key={post._id} post={post} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section aria-labelledby="owners-title" className="bg-[#F3F5F7] px-6 py-20 sm:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[5fr_7fr] lg:gap-20">
          {/* The arch echoes the logo's doorway: the one decorative gesture on this section. */}
          <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-t-full bg-[#DFE4EA] lg:max-w-none">
            <Image
              src="/hero/hero-3.jpg"
              alt=""
              fill
              sizes="(min-width: 1024px) 40vw, 384px"
              className="object-cover"
            />
          </div>

          <div>
            <h2 id="owners-title" className="max-w-xl text-3xl font-semibold tracking-[-0.02em] text-[#16202B] sm:text-4xl">
              {t("home.ctaTitle")}
            </h2>
            <p className="mt-4 max-w-lg leading-relaxed text-[#4A5868]">{t("home.ctaSubtitle")}</p>

            <dl className="mt-10 divide-y divide-[#D9DFE6] border-y border-[#D9DFE6]">
              {ownerFacts.map((fact) => (
                <div key={fact.title} className="grid gap-1 py-5 sm:grid-cols-[15rem_1fr] sm:gap-8">
                  <dt className="font-semibold text-[#16202B]">{fact.title}</dt>
                  <dd className="text-sm leading-relaxed text-[#4A5868]">{fact.body}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="rounded-full bg-rose-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
              >
                {t("home.ctaButton")}
              </Link>
              <Link
                href="/contact#faq"
                className="rounded-full border border-[#16202B]/20 px-6 py-3 text-sm font-semibold text-[#16202B] transition-colors hover:border-[#16202B]/40 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#16202B]"
              >
                {t("home.ownersPricing")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
