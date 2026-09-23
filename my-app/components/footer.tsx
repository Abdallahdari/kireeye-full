"use client";

import { usePathname } from "next/navigation";
import { useLanguage } from "./language-provider";

export function Footer() {
  const { t } = useLanguage();
  const pathname = usePathname();

  if (pathname?.startsWith("/dashboard")) {
    return null;
  }

  return (
    <footer className="border-t border-zinc-100 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-zinc-500 sm:flex-row">
        <p>{t("footer.rights", { year: new Date().getFullYear() })}</p>
        <p>{t("footer.builtWith")}</p>
      </div>
    </footer>
  );
}
