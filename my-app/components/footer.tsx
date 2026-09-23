"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { useLanguage } from "./language-provider";
import { POPULAR_CITIES, SITE_CONTACT } from "@/lib/site";

const PAYMENT_METHODS = ["EVC Plus", "ZAAD", "SAHAL"];

export function Footer() {
  const { t } = useLanguage();
  const pathname = usePathname();

  if (pathname?.startsWith("/dashboard")) {
    return null;
  }

  const columns = [
    {
      title: t("footer.explore"),
      links: [
        { href: "/properties", label: t("nav.allProperties") },
        ...POPULAR_CITIES.slice(0, 4).map((city) => ({
          href: `/properties?city=${encodeURIComponent(city)}`,
          label: city,
        })),
      ],
    },
    {
      title: t("footer.forBusinesses"),
      links: [
        { href: "/register", label: t("nav.listProperty") },
        { href: "/dashboard", label: t("nav.businessDashboard") },
        { href: "/contact#faq", label: t("nav.pricing") },
      ],
    },
    {
      title: t("footer.company"),
      links: [
        { href: "/#how-it-works", label: t("nav.howItWorks") },
        { href: "/contact", label: t("nav.contact") },
        { href: "/contact?topic=SUPPORT", label: t("nav.support") },
      ],
    },
  ];

  return (
    <footer className="relative mt-auto overflow-hidden bg-gradient-to-br from-[#2b0a1f] via-[#3b0d2e] to-[#1e1b4b] text-rose-50">
      {/* Decorative glows */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-rose-500/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 right-0 h-80 w-80 rounded-full bg-orange-400/20 blur-3xl" />
      <div className="pointer-events-none absolute right-1/3 top-10 h-56 w-56 rounded-full bg-violet-500/20 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-6 pt-14">
        {/* Call to action */}
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-gradient-to-r from-rose-500 via-rose-600 to-orange-500 p-8 shadow-2xl shadow-rose-950/40 md:flex-row md:items-center md:p-10">
          <div>
            <h2 className="text-2xl font-bold text-white md:text-3xl">{t("footer.ctaTitle")}</h2>
            <p className="mt-2 max-w-lg text-rose-50/90">{t("footer.ctaBody")}</p>
          </div>
          <Link
            href="/properties"
            className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-rose-700 shadow-lg transition hover:bg-rose-50"
          >
            {t("footer.ctaButton")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Link columns */}
        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold text-white">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-orange-400 font-bold text-white">
                S
              </span>
              Stayly
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-rose-100/70">{t("footer.tagline")}</p>

            <ul className="mt-6 space-y-3 text-sm">
              <li>
                <a href={`mailto:${SITE_CONTACT.email}`} className="flex items-center gap-3 text-rose-100/80 hover:text-white">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                    <Mail className="h-4 w-4 text-rose-300" />
                  </span>
                  {SITE_CONTACT.email}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${SITE_CONTACT.phone.replace(/\s/g, "")}`}
                  className="flex items-center gap-3 text-rose-100/80 hover:text-white"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                    <Phone className="h-4 w-4 text-orange-300" />
                  </span>
                  {SITE_CONTACT.phone}
                </a>
              </li>
              <li className="flex items-center gap-3 text-rose-100/80">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <MapPin className="h-4 w-4 text-violet-300" />
                </span>
                {SITE_CONTACT.address}
              </li>
            </ul>
          </div>

          {columns.map((column) => (
            <div key={column.title} className="lg:col-span-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-orange-300">{column.title}</h3>
              <ul className="mt-4 space-y-3 text-sm">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-rose-100/70 transition-colors hover:text-white hover:underline hover:decoration-rose-400 hover:underline-offset-4"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="lg:col-span-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-orange-300">{t("footer.getInTouch")}</h3>
            <div className="mt-4 flex flex-col gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/15 transition hover:bg-white/20"
              >
                <Mail className="h-4 w-4" />
                {t("nav.contact")}
              </Link>
              <a
                href={`https://wa.me/${SITE_CONTACT.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400"
              >
                <MessageCircle className="h-4 w-4" />
                {t("contact.whatsapp")}
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 py-6 text-sm text-rose-100/60 md:flex-row">
          <p>{t("footer.rights", { year: new Date().getFullYear() })}</p>
          <div className="flex items-center gap-2">
            <span className="text-xs">{t("footer.payWith")}</span>
            {PAYMENT_METHODS.map((method) => (
              <span
                key={method}
                className="rounded-md bg-white/10 px-2.5 py-1 text-xs font-semibold text-rose-50 ring-1 ring-white/10"
              >
                {method}
              </span>
            ))}
          </div>
          <p>{t("footer.madeIn")} ♥</p>
        </div>
      </div>
    </footer>
  );
}
