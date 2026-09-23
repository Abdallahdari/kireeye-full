"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronRight, LogOut, Menu, Search, UserRound } from "lucide-react";
import { cn } from "@/lib/cn";
import { useLanguage } from "@/components/language-provider";
import { RoleBadge } from "@/components/ui/badge";
import type { User } from "@/lib/types";
import type { DashboardNavItem } from "./sidebar";
import { navIcons } from "./nav-icons";

export interface DashboardAlert {
  id: string;
  label: string;
  description: string;
  href: string;
}

export function DashboardTopbar({
  user,
  navItems,
  sectionTitle,
  profileHref,
  onOpenMobileMenu,
  onLogout,
  alerts,
}: {
  user: User;
  navItems: DashboardNavItem[];
  sectionTitle: string;
  profileHref: string;
  onOpenMobileMenu: () => void;
  onLogout: () => void;
  alerts: DashboardAlert[];
}) {
  const { t } = useLanguage();
  const pathname = usePathname();

  const rootHref = navItems[0]?.href;
  const activeItem = navItems.find((item) =>
    item.href === pathname || (item.href !== rootHref && pathname.startsWith(`${item.href}/`))
  );
  const isRoot = !activeItem || activeItem.href === rootHref;

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-zinc-100 bg-white/95 px-4 backdrop-blur sm:px-6">
      <button
        type="button"
        onClick={onOpenMobileMenu}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 md:hidden"
        aria-label={t("dashboard.shell.openMenu")}
      >
        <Menu className="h-5 w-5" />
      </button>

      <nav className="hidden min-w-0 items-center gap-1.5 text-sm text-zinc-400 md:flex">
        <Link href={rootHref ?? "/dashboard"} className="font-medium text-zinc-500 hover:text-zinc-900">
          {sectionTitle}
        </Link>
        {!isRoot && activeItem && (
          <>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="truncate font-medium text-zinc-900">{t(activeItem.labelKey)}</span>
          </>
        )}
      </nav>

      <div className="flex-1" />

      <QuickJump navItems={navItems} />
      <NotificationsMenu alerts={alerts} />
      <ProfileMenu user={user} onLogout={onLogout} profileHref={profileHref} />
    </header>
  );
}

function QuickJump({ navItems }: { navItems: DashboardNavItem[] }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return navItems;
    return navItems.filter((item) => t(item.labelKey).toLowerCase().includes(q));
  }, [navItems, query, t]);

  function go(href: string) {
    router.push(href);
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={containerRef} className="relative hidden sm:block">
      <div className="flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm text-zinc-400 transition-colors focus-within:border-rose-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-rose-100">
        <Search className="h-4 w-4 shrink-0" />
        <input
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && results[0]) go(results[0].href);
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder={t("dashboard.shell.searchPlaceholder")}
          className="w-36 bg-transparent text-zinc-900 outline-none placeholder:text-zinc-400 lg:w-56"
        />
      </div>

      {open && (
        <div className="dash-pop-in absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-xl border border-zinc-100 bg-white py-1.5 shadow-lg">
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-zinc-400">{t("dashboard.shell.searchEmpty")}</p>
          ) : (
            results.map((item) => {
              const Icon = navIcons[item.icon];
              return (
                <button
                  key={item.href}
                  onClick={() => go(item.href)}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"
                >
                  <Icon className="h-4 w-4 text-zinc-400" />
                  {t(item.labelKey)}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function NotificationsMenu({ alerts }: { alerts: DashboardAlert[] }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100"
        aria-label={t("dashboard.shell.notifications")}
      >
        <Bell className="h-[18px] w-[18px]" />
        {alerts.length > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
            {alerts.length}
          </span>
        )}
      </button>

      {open && (
        <div className="dash-pop-in absolute right-0 z-20 mt-2 w-80 overflow-hidden rounded-xl border border-zinc-100 bg-white shadow-lg">
          <div className="border-b border-zinc-100 px-4 py-3">
            <p className="text-sm font-semibold text-zinc-900">{t("dashboard.shell.notifications")}</p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {alerts.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-zinc-400">{t("dashboard.shell.notificationsEmpty")}</p>
            ) : (
              alerts.map((alert) => (
                <Link
                  key={alert.id}
                  href={alert.href}
                  onClick={() => setOpen(false)}
                  className="block border-b border-zinc-50 px-4 py-3 last:border-b-0 hover:bg-zinc-50"
                >
                  <p className="text-sm font-medium text-zinc-900">{alert.label}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">{alert.description}</p>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileMenu({
  user,
  onLogout,
  profileHref,
}: {
  user: User;
  onLogout: () => void;
  profileHref: string;
}) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-2 rounded-full border border-zinc-200 py-1 pl-1 pr-2.5 transition-shadow hover:shadow-sm sm:pr-3"
        )}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white">
          {user.firstName[0]}
          {user.lastName[0]}
        </span>
        <span className="hidden text-sm font-medium text-zinc-700 sm:inline">{user.firstName}</span>
      </button>

      {open && (
        <div className="dash-pop-in absolute right-0 z-20 mt-2 w-60 overflow-hidden rounded-xl border border-zinc-100 bg-white py-2 shadow-lg">
          <div className="flex items-center gap-3 px-4 py-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white">
              {user.firstName[0]}
              {user.lastName[0]}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-zinc-900">
                {user.firstName} {user.lastName}
              </p>
              <p className="truncate text-xs text-zinc-500">{user.email}</p>
            </div>
          </div>
          <div className="px-4 py-2">
            <RoleBadge role={user.role} />
          </div>
          <div className="my-1 border-t border-zinc-100" />
          <Link
            href={profileHref}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            <UserRound className="h-4 w-4 text-zinc-400" />
            {t("dashboard.shell.viewProfile")}
          </Link>
          <button
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"
          >
            <LogOut className="h-4 w-4 text-zinc-400" />
            {t("dashboard.logOut")}
          </button>
        </div>
      )}
    </div>
  );
}
