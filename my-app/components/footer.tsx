"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "./language-provider";
import { POPULAR_CITIES, SITE_CONTACT } from "@/lib/site";
import { Logo } from "@/components/logo";

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
        { href: "/blog", label: t("nav.blog") },
        { href: "/contact?topic=SUPPORT", label: t("nav.support") },
      ],
    },
  ];

  const focusRing = "rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";
  const linkClass = `${focusRing} text-[#9FB3C8] transition-colors hover:text-white`;
  const contactClass = `${focusRing} w-fit text-[#C9D6E3] transition-colors hover:text-white`;

  return (
    <footer className="mt-auto bg-[#0F2A3F] text-[#C9D6E3]">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-12 py-16 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Link href="/" aria-label="Kireeye home" className="inline-flex rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
              <Logo tone="light" />
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-[#9FB3C8]">{t("footer.tagline")}</p>

            <address className="mt-8 flex flex-col gap-2 text-sm not-italic">
              <a href={`mailto:${SITE_CONTACT.email}`} className={contactClass}>
                {SITE_CONTACT.email}
              </a>
              <a href={`tel:${SITE_CONTACT.phone.replace(/\s/g, "")}`} className={contactClass}>
                {SITE_CONTACT.phone}
              </a>
              <span className="text-[#9FB3C8]">{SITE_CONTACT.address}</span>
            </address>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-10 sm:grid-cols-4 lg:col-span-8">
            {columns.map((column) => (
              <div key={column.title}>
                <h3 className="text-sm font-semibold text-white">{column.title}</h3>
                <ul className="mt-4 flex flex-col gap-3 text-sm">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className={linkClass}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div>
              <h3 className="text-sm font-semibold text-white">{t("footer.getInTouch")}</h3>
              <ul className="mt-4 flex flex-col gap-3 text-sm">
                <li>
                  <Link href="/contact" className={linkClass}>
                    {t("nav.contact")}
                  </Link>
                </li>
                <li>
                  <a
                    href={`https://wa.me/${SITE_CONTACT.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkClass}
                  >
                    {t("contact.whatsapp")}
                  </a>
                </li>
              </ul>
            </div>
          </nav>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 py-6 text-xs text-[#9FB3C8] md:flex-row md:items-center md:justify-between">
          <p>{t("footer.rights", { year: new Date().getFullYear() })}</p>
          <p>
            {t("footer.payWith")}: {PAYMENT_METHODS.join(", ")}
          </p>
          <p>{t("footer.madeIn")}</p>
        </div>
      </div>
    </footer>
  );
}
