"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "./auth-provider";
import { useLanguage } from "./language-provider";
import { LanguageSwitcher } from "./language-switcher";

export function Header() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    setOpen(false);
    await logout();
    router.push("/");
    router.refresh();
  }

  if (pathname?.startsWith("/dashboard")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-zinc-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-600 text-sm text-white">
            S
          </span>
          Stayly
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-zinc-600 md:flex">
          <Link href="/properties" className="hover:text-zinc-900">
            {t("nav.properties")}
          </Link>
          <Link href="/#how-it-works" className="hover:text-zinc-900">
            {t("nav.howItWorks")}
          </Link>
          {user && (
            <Link href="/dashboard" className="hover:text-zinc-900">
              {t("nav.dashboard")}
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/properties" className="text-sm font-medium text-zinc-700 hover:text-zinc-900 md:hidden">
            {t("nav.properties")}
          </Link>
          <LanguageSwitcher />

          {user ? (
            <div className="relative">
              <button
                onClick={() => setOpen((o) => !o)}
                className="flex items-center gap-2 rounded-full border border-zinc-200 py-1 pl-1 pr-3 transition-shadow hover:shadow-sm"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white">
                  {user.firstName[0]}
                  {user.lastName[0]}
                </span>
                <span className="text-sm font-medium text-zinc-700">{user.firstName}</span>
              </button>

              {open && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                  <div className="absolute right-0 z-20 mt-2 w-48 rounded-xl border border-zinc-100 bg-white py-2 shadow-lg">
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                      onClick={() => setOpen(false)}
                    >
                      {t("nav.dashboard")}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"
                    >
                      {t("nav.logOut")}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm font-medium text-zinc-700 hover:text-zinc-900">
                {t("nav.logIn")}
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
              >
                {t("nav.signUp")}
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
