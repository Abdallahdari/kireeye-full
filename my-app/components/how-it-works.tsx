"use client";

import Image from "next/image";
import { useEffect, useId, useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { cn } from "@/lib/cn";

const STEP_MS = 6000;

export interface Step {
  title: string;
  description: string;
}

/** "How renting works": a photo beside a stepper that walks through the steps on its own. */
export function HowItWorks({ steps }: { steps: Step[] }) {
  const { t } = useLanguage();
  const panelId = useId();
  const [active, setActive] = useState(0);
  const last = steps.length - 1;

  // Always auto-advance, looping back to the first step after the last.
  // Clicking a dot changes `active`, which restarts the timer from that step.
  useEffect(() => {
    if (steps.length < 2) return;
    const timer = window.setTimeout(() => setActive((i) => (i === last ? 0 : i + 1)), STEP_MS);
    return () => window.clearTimeout(timer);
  }, [active, last, steps.length]);

  const step = steps[active];

  return (
    <section
      id="how-it-works"
      aria-labelledby="how-title"
      className="scroll-mt-24 border-t border-[#E3E8ED] px-6 py-20 sm:py-24"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[5fr_7fr] lg:gap-20">
        <figure className="mx-auto w-full max-w-sm lg:max-w-none">
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#DFE4EA]">
            <Image
              src="/home/mogadishu-family.jpg"
              alt={t("home.howItWorksImageAlt")}
              fill
              sizes="(min-width: 1024px) 40vw, 384px"
              className="object-cover"
            />
          </div>
          <figcaption className="mt-3 text-xs text-[#6B7A8A]">{t("home.howItWorksImageCredit")}</figcaption>
        </figure>

        <div>
          <h2 id="how-title" className="text-3xl font-semibold tracking-[-0.02em] text-[#16202B] sm:text-4xl">
            {t("home.howItWorksTitle")}
          </h2>
          <p className="mt-4 max-w-md leading-relaxed text-[#4A5868]">{t("home.howItWorksIntro")}</p>

          {/* Dots joined by a track: filled up to the current step, then the next
              segment fills over STEP_MS so you can see the next step coming. */}
          <div className="relative mt-12">
            <div aria-hidden className="absolute left-3 right-3 top-3 h-0.5 -translate-y-1/2 bg-[#D9DFE6]">
              <div className="h-full bg-rose-600" style={{ width: last > 0 ? `${(active / last) * 100}%` : "0%" }} />
              {active < last && (
                <div
                  key={active}
                  className="step-segment-fill absolute top-0 h-full bg-rose-600/60"
                  style={{
                    left: `${(active / last) * 100}%`,
                    width: `${100 / last}%`,
                    animationDuration: `${STEP_MS}ms`,
                  }}
                />
              )}
            </div>

            <ol role="tablist" aria-label={t("home.howItWorksTitle")} className="relative flex justify-between">
              {steps.map((s, i) => {
                const done = i < active;
                const current = i === active;
                return (
                  <li key={s.title} className="flex flex-col items-center first:items-start last:items-end">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={current}
                      aria-controls={panelId}
                      aria-label={`${t("home.stepOf", { n: i + 1, total: steps.length })}: ${s.title}`}
                      onClick={() => setActive(i)}
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rose-600 motion-reduce:transition-none",
                        done ? "border-rose-600 bg-rose-600" : current ? "border-rose-600 bg-white" : "border-[#C3CCD6] bg-white hover:border-[#8A99A8]",
                      )}
                    >
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full transition-colors duration-300",
                          current ? "bg-rose-600" : done ? "bg-white" : "bg-transparent",
                        )}
                      />
                    </button>
                    <span
                      className={cn(
                        "mt-3 hidden max-w-[10rem] text-sm sm:block",
                        i === 0 ? "text-left" : i === last ? "text-right" : "text-center",
                        current ? "font-semibold text-[#16202B]" : "text-[#6B7A8A]",
                      )}
                    >
                      {s.title}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* The current step; `key` replays the fade when it changes */}
          <div id={panelId} role="tabpanel" aria-live="off" className="mt-10 min-h-[9.5rem] border-t border-[#D9DFE6] pt-8">
            <div key={active} className="dash-animate-in motion-reduce:animate-none">
              <p className="text-sm font-medium tabular-nums text-rose-700">
                {t("home.stepOf", { n: active + 1, total: steps.length })}
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-[-0.015em] text-[#16202B]">{step.title}</h3>
              <p className="mt-2 max-w-md leading-relaxed text-[#4A5868]">{step.description}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
