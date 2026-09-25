"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, MapPin, Sparkles } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { cn } from "@/lib/cn";
import type { ComingSoonItem } from "@/lib/types";

const AUTOPLAY_MS = 6000;

/** The hero's "Coming soon" slider. Renders nothing when there are no slides. */
export function ComingSoonSlider({ items }: { items: ComingSoonItem[] }) {
  const { t } = useLanguage();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = items.length;

  const go = useCallback((next: number) => setIndex(((next % count) + count) % count), [count]);

  useEffect(() => {
    if (count <= 1 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setTimeout(() => go(index + 1), AUTOPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [count, index, paused, go]);

  if (count === 0) return null;
  const current = Math.min(index, count - 1);

  return (
    <section
      aria-roledescription="carousel"
      aria-label={t("home.comingSoonBadge")}
      className="relative mt-12 w-full max-w-5xl overflow-hidden rounded-3xl bg-zinc-900 text-left shadow-xl shadow-rose-100"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") go(current - 1);
        if (e.key === "ArrowRight") go(current + 1);
      }}
    >
      <div
        className="flex transition-transform duration-700 ease-out motion-reduce:transition-none"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {items.map((item, i) => {
          const external = /^https?:\/\//i.test(item.link);
          return (
            <div
              key={item._id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} / ${count}`}
              aria-hidden={i !== current}
              className="relative aspect-[4/5] w-full shrink-0 sm:aspect-[21/9]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- served by our own backend via the /api rewrite */}
              <img
                src={item.image}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                loading={i === 0 ? "eager" : "lazy"}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/40 to-transparent sm:bg-gradient-to-r sm:from-zinc-950/85 sm:via-zinc-950/45" />

              <div className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-3 p-6 sm:inset-y-0 sm:right-auto sm:max-w-lg sm:justify-center sm:p-10">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-rose-600 to-orange-500 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                  <Sparkles className="h-3.5 w-3.5" />
                  {t("home.comingSoonBadge")}
                </span>
                <h2 className="text-2xl font-bold text-white sm:text-3xl">{item.title}</h2>
                {item.location && (
                  <p className="flex items-center gap-1.5 text-sm font-medium text-rose-100">
                    <MapPin className="h-4 w-4" />
                    {item.location}
                  </p>
                )}
                {item.description && <p className="text-sm text-zinc-200 sm:text-base">{item.description}</p>}
                {item.link && (
                  <Link
                    href={item.link}
                    tabIndex={i === current ? undefined : -1}
                    {...(external && { target: "_blank", rel: "noopener noreferrer" })}
                    className="mt-1 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-rose-50"
                  >
                    {t("home.comingSoonCta")}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(current - 1)}
            aria-label={t("home.slidePrevious")}
            className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-zinc-900 shadow backdrop-blur hover:bg-white"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => go(current + 1)}
            aria-label={t("home.slideNext")}
            className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-zinc-900 shadow backdrop-blur hover:bg-white"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-4 right-6 flex gap-1.5">
            {items.map((item, i) => (
              <button
                key={item._id}
                type="button"
                onClick={() => go(i)}
                aria-label={t("home.goToSlide", { n: i + 1 })}
                aria-current={i === current}
                className={cn(
                  "h-2 rounded-full transition-all",
                  i === current ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/80"
                )}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
