"use client";

import { Suspense } from "react";
import { Clock, Mail, MapPin, MessageCircle, Phone, ChevronDown, type LucideIcon } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { SITE_CONTACT } from "@/lib/site";
import { ContactForm } from "./contact-form";

interface ContactCard {
  icon: LucideIcon;
  title: string;
  body: string;
  value: string;
  href?: string;
  external?: boolean;
  tone: string;
}

export function ContactView() {
  const { t } = useLanguage();

  const cards: ContactCard[] = [
    {
      icon: Mail,
      title: t("contact.emailUs"),
      body: t("contact.emailUsBody"),
      value: SITE_CONTACT.email,
      href: `mailto:${SITE_CONTACT.email}`,
      tone: "from-rose-500 to-pink-500 shadow-rose-200",
    },
    {
      icon: Phone,
      title: t("contact.callUs"),
      body: t("contact.callUsBody"),
      value: SITE_CONTACT.phone,
      href: `tel:${SITE_CONTACT.phone.replace(/\s/g, "")}`,
      tone: "from-orange-500 to-amber-400 shadow-orange-200",
    },
    {
      icon: MessageCircle,
      title: t("contact.whatsapp"),
      body: t("contact.whatsappBody"),
      value: `+${SITE_CONTACT.whatsapp}`,
      href: `https://wa.me/${SITE_CONTACT.whatsapp}`,
      external: true,
      tone: "from-emerald-500 to-teal-400 shadow-emerald-200",
    },
    {
      icon: MapPin,
      title: t("contact.visitUs"),
      body: t("contact.callUsBody"),
      value: SITE_CONTACT.address,
      tone: "from-violet-500 to-indigo-500 shadow-violet-200",
    },
  ];

  const faqs = [1, 2, 3, 4].map((n) => ({ q: t(`contact.faq${n}Q`), a: t(`contact.faq${n}A`) }));

  return (
    <div className="flex-1 bg-gradient-to-b from-rose-50/60 via-white to-violet-50/40">
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-28 pt-16">
        <div className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-rose-300/30 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 top-10 h-72 w-72 rounded-full bg-orange-300/30 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-60 w-60 -translate-x-1/2 rounded-full bg-violet-300/25 blur-3xl" />

        <div className="relative mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-rose-600 shadow-sm ring-1 ring-rose-100">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            {t("contact.badge")}
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            <span className="bg-gradient-to-r from-rose-600 via-orange-500 to-violet-600 bg-clip-text text-transparent">
              {t("contact.title")}
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-600">{t("contact.subtitle")}</p>
        </div>
      </section>

      {/* Contact cards */}
      <section className="relative -mt-20 px-6">
        <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;
            const content = (
              <>
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg ${card.tone}`}
                >
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 font-semibold text-zinc-900">{card.title}</h3>
                <p className="mt-1 text-xs text-zinc-500">{card.body}</p>
                <p className="mt-3 break-words text-sm font-semibold text-rose-600">{card.value}</p>
              </>
            );
            const className =
              "block rounded-2xl border border-white bg-white/90 p-6 shadow-lg shadow-rose-100/60 backdrop-blur transition hover:-translate-y-1 hover:shadow-xl hover:shadow-rose-200/60";
            return card.href ? (
              <a
                key={card.title}
                href={card.href}
                className={className}
                {...(card.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                {content}
              </a>
            ) : (
              <div key={card.title} className={className}>
                {content}
              </div>
            );
          })}
        </div>
      </section>

      {/* Form + side panel */}
      <section className="px-6 py-16">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-5">
          <div className="rounded-3xl border border-rose-100 bg-white p-6 shadow-xl shadow-rose-100/50 sm:p-10 lg:col-span-3">
            <h2 className="text-2xl font-bold text-zinc-900">{t("contact.formTitle")}</h2>
            <div className="mt-2 h-1 w-16 rounded-full bg-gradient-to-r from-rose-500 to-orange-400" />
            {/* useSearchParams inside ContactForm needs a Suspense boundary. */}
            <Suspense fallback={<div className="mt-8 h-96 animate-pulse rounded-2xl bg-rose-50" />}>
              <ContactForm />
            </Suspense>
          </div>

          <aside className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#3b0d2e] via-rose-900 to-[#1e1b4b] p-8 text-white shadow-xl lg:col-span-2">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-orange-400/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-rose-500/30 blur-3xl" />
            <div className="relative">
              <h3 className="text-xl font-bold">Stayly</h3>
              <p className="mt-2 text-sm text-rose-100/80">{t("footer.tagline")}</p>

              <ul className="mt-8 space-y-5 text-sm">
                <li className="flex gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                    <Clock className="h-5 w-5 text-orange-300" />
                  </span>
                  <span>
                    <span className="block font-semibold">{t("contact.callUs")}</span>
                    <span className="text-rose-100/80">{t("contact.callUsBody")}</span>
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                    <MapPin className="h-5 w-5 text-rose-300" />
                  </span>
                  <span>
                    <span className="block font-semibold">{t("contact.visitUs")}</span>
                    <span className="text-rose-100/80">{SITE_CONTACT.address}</span>
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                    <Mail className="h-5 w-5 text-violet-300" />
                  </span>
                  <span>
                    <span className="block font-semibold">{t("contact.emailUs")}</span>
                    <a href={`mailto:${SITE_CONTACT.email}`} className="text-rose-100/80 hover:text-white">
                      {SITE_CONTACT.email}
                    </a>
                  </span>
                </li>
              </ul>

              <a
                href={`https://wa.me/${SITE_CONTACT.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-10 flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/30 transition hover:bg-emerald-400"
              >
                <MessageCircle className="h-4 w-4" />
                {t("contact.whatsappBody")}
              </a>
            </div>
          </aside>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-32 px-6 pb-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-bold text-zinc-900">{t("contact.faqTitle")}</h2>
          <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-gradient-to-r from-rose-500 to-orange-400" />
          <div className="mt-10 space-y-3">
            {faqs.map((faq, i) => (
              <details
                key={i}
                className="group rounded-2xl border border-rose-100 bg-white p-5 shadow-sm transition open:shadow-md open:shadow-rose-100 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-zinc-900">
                  <span className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-orange-400 text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    {faq.q}
                  </span>
                  <ChevronDown className="h-5 w-5 shrink-0 text-rose-500 transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 pl-10 text-sm leading-relaxed text-zinc-600">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
