"use client";

import type { ReactNode } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade, Pagination } from "swiper/modules";

import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/pagination";

const HERO_IMAGES = ["/hero/hero-1.jpg", "/hero/hero-2.jpg", "/hero/hero-3.jpg"];

/**
 * Full-width hero under the navbar: a fading Swiper of background photos
 * with the (static) hero content layered on top.
 */
export function HeroSlider({ children }: { children: ReactNode }) {
  return (
    <section className="hero-slider relative overflow-hidden bg-zinc-900 px-6 py-24 sm:py-32">
      {/* Layer 1: the photos. Wrapped so Swiper's own `z-index: 1` can't lift it above the text. */}
      <div className="absolute inset-0 z-0">
        <Swiper
          modules={[Autoplay, EffectFade, Pagination]}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          loop
          speed={1200}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          pagination={{ el: ".hero-pagination", clickable: true }}
          className="h-full w-full"
        >
          {HERO_IMAGES.map((src) => (
            <SwiperSlide key={src}>
              <div
                aria-hidden
                className="h-full w-full bg-cover bg-center"
                style={{ backgroundImage: `url(${src})` }}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
      {/* Layer 2: dark rgba overlay so the photos never wash out the text. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0.5) 50%, rgba(0, 0, 0, 0.75))",
        }}
      />
      {/* Layer 3: the hero content. */}
      <div className="relative z-20">{children}</div>
      {/* Dots sit above the overlay so they stay bright and clickable. */}
      <div className="hero-pagination absolute inset-x-0 bottom-6 z-30 flex justify-center gap-2" />
    </section>
  );
}
