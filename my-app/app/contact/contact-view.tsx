"use client";

import { Suspense } from "react";
import { Plus } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { SITE_CONTACT } from "@/lib/site";
import { ContactForm } from "./contact-form";

interface Channel {
  label: string;
  value: string;
  note: string;
  href?: string;
  external?: boolean;
}

const focusRing = "rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600";

export function ContactView() {
  const { t } = useLanguage();

  const channels: Channel[] = [
    {
      label: t("contact.emailUs"),
      value: SITE_CONTACT.email,
      note: t("contact.emailUsBody"),
      href: `mailto:${SITE_CONTACT.email}`,
    },
    {
      label: t("contact.callUs"),
      value: SITE_CONTACT.phone,
      note: t("contact.callUsBody"),
      href: `tel:${SITE_CONTACT.phone.replace(/\s/g, "")}`,
    },
    {
      label: t("contact.whatsapp"),
      value: `+${SITE_CONTACT.whatsapp}`,
      note: t("contact.whatsappBody"),
      href: `https://wa.me/${SITE_CONTACT.whatsapp}`,
      external: true,
    },
    {
      label: t("contact.visitUs"),
      value: SITE_CONTACT.address,
      note: t("contact.callUsBody"),
    },
  ];

  const faqs = [1, 2, 3, 4].map((n) => ({ q: t(`contact.faq${n}Q`), a: t(`contact.faq${n}A`) }));

  return (
    <div className="flex-1 bg-white">
      <section className="px-6 pb-20 pt-14 sm:pt-20">
        <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[5fr_7fr] lg:gap-20">
          <div>
            <h1 className="text-4xl font-semibold tracking-[-0.025em] text-[#16202B] sm:text-5xl">{t("contact.title")}</h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-[#4A5868]">{t("contact.subtitle")}</p>

            <dl className="mt-12 border-t border-[#D9DFE6]">
              {channels.map((channel) => (
                <div key={channel.label} className="grid gap-1 border-b border-[#D9DFE6] py-5 sm:grid-cols-[8rem_1fr] sm:gap-6">
                  <dt className="text-sm font-semibold text-[#16202B]">{channel.label}</dt>
                  <dd>
                    {channel.href ? (
                      <a
                        href={channel.href}
                        className={`${focusRing} break-words font-medium text-rose-700 underline-offset-4 hover:underline`}
                        {...(channel.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      >
                        {channel.value}
                      </a>
                    ) : (
                      <span className="font-medium text-[#16202B]">{channel.value}</span>
                    )}
                    <p className="mt-0.5 text-sm text-[#4A5868]">{channel.note}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="rounded-2xl border border-[#D9DFE6] p-6 sm:p-10">
            <h2 className="text-2xl font-semibold tracking-[-0.015em] text-[#16202B]">{t("contact.formTitle")}</h2>
            {/* useSearchParams inside ContactForm needs a Suspense boundary. */}
            <Suspense fallback={<div className="mt-8 h-96 animate-pulse rounded-xl bg-[#F3F5F7]" />}>
              <ContactForm />
            </Suspense>
          </div>
        </div>
      </section>

      <section id="faq" aria-labelledby="faq-title" className="scroll-mt-32 bg-[#F3F5F7] px-6 py-20 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[5fr_7fr] lg:gap-20">
          <h2 id="faq-title" className="text-3xl font-semibold tracking-[-0.02em] text-[#16202B] sm:text-4xl">
            {t("contact.faqTitle")}
          </h2>

          <div className="border-t border-[#D9DFE6]">
            {faqs.map((faq) => (
              <details key={faq.q} className="group border-b border-[#D9DFE6] [&_summary::-webkit-details-marker]:hidden">
                <summary
                  className={`${focusRing} flex cursor-pointer list-none items-start justify-between gap-6 py-5 text-lg font-semibold text-[#16202B]`}
                >
                  {faq.q}
                  <Plus
                    aria-hidden
                    className="mt-1 h-5 w-5 shrink-0 text-[#4A5868] transition-transform duration-200 group-open:rotate-45 motion-reduce:transition-none"
                  />
                </summary>
                <p className="max-w-2xl pb-6 pr-10 leading-relaxed text-[#4A5868]">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
