"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { useLanguage } from "@/components/language-provider";
import { navIcons, type NavIconKey } from "./nav-icons";
import { LogoMark } from "@/components/logo";

export interface DashboardNavItem {
  labelKey: string;
  href: string;
  icon: NavIconKey;
}

function useIsActive(items: DashboardNavItem[]) {
  const pathname = usePathname();
  const rootHref = items[0]?.href;

  return (href: string) => {
    if (href === pathname) return true;
    return href !== rootHref && pathname.startsWith(`${href}/`);
  };
}

export function DashboardSidebar({
  items,
  brand,
  collapsed,
  onToggleCollapsed,
}: {
  items: DashboardNavItem[];
  brand: string;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  const { t } = useLanguage();
  const isActive = useIsActive(items);

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-zinc-800/60 bg-zinc-950 text-zinc-100 transition-[width] duration-200 ease-out md:flex",
        collapsed ? "w-[76px]" : "w-64"
      )}
    >
      <Link href="/" className="flex h-16 shrink-0 items-center gap-2 border-b border-white/5 px-4">
        <LogoMark className="h-8 w-8" />
        {!collapsed && <span className="truncate text-lg font-semibold tracking-[-0.035em] text-white">{brand}</span>}
      </Link>

      <nav className="dash-scrollbar flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-1">
          {items.map((item) => {
            const active = isActive(item.href);
            const Icon = navIcons[item.icon];
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={collapsed ? t(item.labelKey) : undefined}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    collapsed && "justify-center",
                    active ? "bg-rose-600 text-white shadow-sm" : "text-zinc-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  {!collapsed && <span className="truncate">{t(item.labelKey)}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="flex flex-col gap-1 border-t border-white/5 p-3">
        <Link
          href="/"
          title={collapsed ? t("dashboard.shell.backToSite") : undefined}
          className={cn(
            "flex w-full items-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:border-rose-500/60 hover:bg-rose-600/10 hover:text-white",
            collapsed && "justify-center"
          )}
        >
          <ArrowLeft className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span className="truncate">{t("dashboard.shell.backToSite")}</span>}
        </Link>
        <button
          type="button"
          onClick={onToggleCollapsed}
          className={cn(
            "flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-white",
            collapsed && "justify-center"
          )}
        >
          {collapsed ? <ChevronsRight className="h-[18px] w-[18px]" /> : <ChevronsLeft className="h-[18px] w-[18px]" />}
          {!collapsed && <span>{t("dashboard.shell.collapse")}</span>}
        </button>
      </div>
    </aside>
  );
}

export function MobileSidebarDrawer({
  items,
  brand,
  open,
  onClose,
}: {
  items: DashboardNavItem[];
  brand: string;
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const isActive = useIsActive(items);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-zinc-900/50" onClick={onClose} />
      <aside className="dash-drawer-in dash-scrollbar absolute inset-y-0 left-0 flex w-72 flex-col overflow-y-auto bg-zinc-950 text-zinc-100">
        <Link href="/" onClick={onClose} className="flex h-16 shrink-0 items-center gap-2 border-b border-white/5 px-4">
          <LogoMark className="h-8 w-8" />
          <span className="truncate text-lg font-semibold tracking-[-0.035em] text-white">{brand}</span>
        </Link>

        <nav className="flex-1 px-3 py-4">
          <ul className="flex flex-col gap-1">
            {items.map((item) => {
              const active = isActive(item.href);
              const Icon = navIcons[item.icon];
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      active ? "bg-rose-600 text-white shadow-sm" : "text-zinc-400 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" />
                    <span className="truncate">{t(item.labelKey)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-white/5 p-3">
          <Link
            href="/"
            onClick={onClose}
            className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:border-rose-500/60 hover:bg-rose-600/10 hover:text-white"
          >
            <ArrowLeft className="h-[18px] w-[18px] shrink-0" />
            <span>{t("dashboard.shell.backToSite")}</span>
          </Link>
        </div>
      </aside>
    </div>
  );
}
