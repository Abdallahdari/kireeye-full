"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Building2,
  ChevronDown,
  CircleHelp,
  LayoutDashboard,
  LifeBuoy,
  Mail,
  MapPin,
  Menu,
  Newspaper,
  Sparkles,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "./auth-provider";
import { useLanguage } from "./language-provider";
import { LanguageSwitcher } from "./language-switcher";
import { cn } from "@/lib/cn";
import { POPULAR_CITIES } from "@/lib/site";
import { Logo } from "@/components/logo";

type MenuKey = "explore" | "business" | "company";

interface MenuItem {
  href: string;
  icon: LucideIcon;
  tone: string;
  label: string;
  description: string;
}

export function Header() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<MenuKey | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Close any open dropdown on outside click or Escape.
  useEffect(() => {
    if (!openMenu && !userMenuOpen && !mobileOpen) return;

    function onPointerDown(e: PointerEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpenMenu(null);
        setUserMenuOpen(false);
        setMobileOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openMenu, userMenuOpen, mobileOpen]);

  function closeAll() {
    setOpenMenu(null);
    setUserMenuOpen(false);
    setMobileOpen(false);
  }

  async function handleLogout() {
    closeAll();
    await logout();
    router.push("/");
    router.refresh();
  }

  if (pathname?.startsWith("/dashboard")) {
    return null;
  }

  const businessItems: MenuItem[] = [
    {
      href: "/register",
      icon: Building2,
      tone: "bg-rose-100 text-rose-600",
      label: t("nav.listProperty"),
      description: t("nav.listPropertyDesc"),
    },
    {
      href: user ? "/dashboard" : "/login",
      icon: LayoutDashboard,
      tone: "bg-violet-100 text-violet-600",
      label: t("nav.businessDashboard"),
      description: t("nav.businessDashboardDesc"),
    },
    {
      href: "/contact#faq",
      icon: Wallet,
      tone: "bg-emerald-100 text-emerald-600",
      label: t("nav.pricing"),
      description: t("nav.pricingDesc"),
    },
  ];

  const companyItems: MenuItem[] = [
    {
      href: "/#how-it-works",
      icon: CircleHelp,
      tone: "bg-sky-100 text-sky-600",
      label: t("nav.howItWorks"),
      description: t("nav.howItWorksDesc"),
    },
    {
      href: "/blog",
      icon: Newspaper,
      tone: "bg-rose-100 text-rose-600",
      label: t("nav.blog"),
      description: t("nav.blogDesc"),
    },
    {
      href: "/contact",
      icon: Mail,
      tone: "bg-amber-100 text-amber-600",
      label: t("nav.contact"),
      description: t("nav.contactDesc"),
    },
    {
      href: "/contact?topic=SUPPORT",
      icon: LifeBuoy,
      tone: "bg-teal-100 text-teal-600",
      label: t("nav.support"),
      description: t("nav.supportDesc"),
    },
  ];

  const menus: { key: MenuKey; label: string }[] = [
    { key: "explore", label: t("nav.explore") },
    { key: "business", label: t("nav.forBusinesses") },
    { key: "company", label: t("nav.company") },
  ];

  function renderPanel(key: MenuKey) {
    if (key === "explore") {
      return (
        <div className="grid w-[36rem] grid-cols-5 gap-2 p-3">
          <Link
            href="/properties"
            onClick={closeAll}
            className="group col-span-2 flex flex-col justify-between rounded-xl bg-gradient-to-br from-rose-500 via-rose-600 to-orange-500 p-5 text-white shadow-md shadow-rose-200"
          >
            <Sparkles className="h-6 w-6 opacity-90" />
            <div>
              <p className="mt-10 font-semibold">{t("nav.allProperties")}</p>
              <p className="mt-1 text-sm text-rose-50/90">{t("nav.allPropertiesDesc")}</p>
              <ArrowRight className="mt-3 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
          <div className="col-span-3 p-2">
            <p className="px-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              {t("nav.popularCities")}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-1">
              {POPULAR_CITIES.map((city) => (
                <Link
                  key={city}
                  href={`/properties?city=${encodeURIComponent(city)}`}
                  onClick={closeAll}
                  className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-rose-50 hover:text-rose-700"
                >
                  <MapPin className="h-4 w-4 text-rose-400" />
                  {city}
                </Link>
              ))}
            </div>
          </div>
        </div>
      );
    }

    const items = key === "business" ? businessItems : companyItems;
    return (
      <div className="w-80 p-2">
        {items.map((item) => (
          <MenuLink key={item.label} item={item} onClick={closeAll} />
        ))}
      </div>
    );
  }

  return (
    <header ref={navRef} className="sticky top-0 z-30">
      {/* Announcement bar */}
      <div className="bg-gradient-to-r from-rose-600 via-rose-500 to-orange-500 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-6 py-2 text-xs font-medium sm:text-sm">
          <Sparkles className="h-4 w-4 shrink-0" />
          <span>{t("nav.announcement")}</span>
          <Link href="/register" className="ml-1 inline-flex items-center gap-1 font-semibold underline-offset-2 hover:underline">
            {t("nav.announcementCta")}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <div className="border-b border-rose-100/70 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3.5">
          <Link href="/" onClick={closeAll} aria-label="Kireeye home">
            <Logo />
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden items-center gap-1 lg:flex">
            {menus.map((menu) => (
              <div
                key={menu.key}
                className="relative"
                onMouseEnter={() => setOpenMenu(menu.key)}
                onMouseLeave={() => setOpenMenu((current) => (current === menu.key ? null : current))}
              >
                <button
                  type="button"
                  aria-expanded={openMenu === menu.key}
                  onClick={() => setOpenMenu((current) => (current === menu.key ? null : menu.key))}
                  className={cn(
                    "flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    openMenu === menu.key ? "bg-rose-50 text-rose-700" : "text-zinc-600 hover:text-rose-700"
                  )}
                >
                  {menu.label}
                  <ChevronDown
                    className={cn("h-4 w-4 transition-transform duration-200", openMenu === menu.key && "rotate-180")}
                  />
                </button>

                {openMenu === menu.key && (
                  // pt-3 bridges the gap so the menu doesn't close while the pointer moves down to it.
                  <div className="absolute left-1/2 top-full z-40 -translate-x-1/2 pt-3">
                    <div className="dash-pop-in overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-xl shadow-rose-900/10">
                      {renderPanel(menu.key)}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <Link
              href="/contact"
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                pathname === "/contact" ? "bg-rose-50 text-rose-700" : "text-zinc-600 hover:text-rose-700"
              )}
            >
              {t("nav.contact")}
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="flex items-center gap-2 rounded-full border border-rose-100 bg-white py-1 pl-1 pr-3 transition-shadow hover:shadow-md hover:shadow-rose-100"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-rose-500 text-xs font-semibold text-white">
                    {user.firstName[0]}
                    {user.lastName[0]}
                  </span>
                  <span className="hidden text-sm font-medium text-zinc-700 sm:inline">{user.firstName}</span>
                  <ChevronDown className="h-4 w-4 text-zinc-400" />
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className="dash-pop-in absolute right-0 z-20 mt-2 w-52 rounded-2xl border border-zinc-100 bg-white p-1.5 shadow-xl shadow-rose-900/10">
                      {user.role !== "TENANT" && (
                        <Link
                          href="/dashboard"
                          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-zinc-700 hover:bg-rose-50 hover:text-rose-700"
                          onClick={closeAll}
                        >
                          <LayoutDashboard className="h-4 w-4" />
                          {t("nav.dashboard")}
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-zinc-700 hover:bg-rose-50 hover:text-rose-700"
                      >
                        <ArrowRight className="h-4 w-4" />
                        {t("nav.logOut")}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <Link href="/login" className="rounded-full px-3 py-2 text-sm font-medium text-zinc-700 hover:text-rose-700">
                  {t("nav.logIn")}
                </Link>
                <Link
                  href="/register"
                  className="rounded-full bg-gradient-to-r from-rose-600 to-orange-500 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-rose-200 transition hover:brightness-110"
                >
                  {t("nav.signUp")}
                </Link>
              </div>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label={mobileOpen ? t("nav.closeMenu") : t("nav.menu")}
              aria-expanded={mobileOpen}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-100 text-zinc-700 hover:bg-rose-50 lg:hidden"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile navigation */}
        {mobileOpen && (
          <div className="dash-animate-in max-h-[calc(100vh-7rem)] overflow-y-auto border-t border-rose-100 bg-white px-4 pb-6 pt-2 lg:hidden">
            <Link
              href="/properties"
              onClick={closeAll}
              className="mt-2 flex items-center justify-between rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 px-4 py-3.5 font-semibold text-white"
            >
              {t("nav.allProperties")}
              <ArrowRight className="h-4 w-4" />
            </Link>

            {menus.map((menu) => (
              <div key={menu.key} className="border-b border-zinc-100">
                <button
                  type="button"
                  aria-expanded={mobileSection === menu.key}
                  onClick={() => setMobileSection((s) => (s === menu.key ? null : menu.key))}
                  className="flex w-full items-center justify-between px-2 py-4 text-left font-medium text-zinc-800"
                >
                  {menu.label}
                  <ChevronDown
                    className={cn("h-5 w-5 text-rose-500 transition-transform", mobileSection === menu.key && "rotate-180")}
                  />
                </button>
                {mobileSection === menu.key && (
                  <div className="pb-3">
                    {menu.key === "explore" ? (
                      <div className="grid grid-cols-2 gap-1">
                        {POPULAR_CITIES.map((city) => (
                          <Link
                            key={city}
                            href={`/properties?city=${encodeURIComponent(city)}`}
                            onClick={closeAll}
                            className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-zinc-700 hover:bg-rose-50"
                          >
                            <MapPin className="h-4 w-4 text-rose-400" />
                            {city}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      (menu.key === "business" ? businessItems : companyItems).map((item) => (
                        <MenuLink key={item.label} item={item} onClick={closeAll} />
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}

            <Link
              href="/contact"
              onClick={closeAll}
              className="flex items-center gap-2 border-b border-zinc-100 px-2 py-4 font-medium text-zinc-800"
            >
              <Mail className="h-4 w-4 text-rose-500" />
              {t("nav.contact")}
            </Link>

            {!user && (
              <div className="mt-5 grid grid-cols-2 gap-3">
                <Link
                  href="/login"
                  onClick={closeAll}
                  className="rounded-full border border-rose-200 py-2.5 text-center text-sm font-semibold text-rose-700"
                >
                  {t("nav.logIn")}
                </Link>
                <Link
                  href="/register"
                  onClick={closeAll}
                  className="rounded-full bg-gradient-to-r from-rose-600 to-orange-500 py-2.5 text-center text-sm font-semibold text-white"
                >
                  {t("nav.signUp")}
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

function MenuLink({ item, onClick }: { item: MenuItem; onClick: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className="group flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-rose-50/70"
    >
      <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", item.tone)}>
        <Icon className="h-5 w-5" />
      </span>
      <span>
        <span className="block text-sm font-semibold text-zinc-900 group-hover:text-rose-700">{item.label}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-zinc-500">{item.description}</span>
      </span>
    </Link>
  );
}
