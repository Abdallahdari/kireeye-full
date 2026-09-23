"use client";

import { useLanguage } from "./language-provider";
import { cn } from "@/lib/cn";
import type { Locale } from "@/lib/i18n/translations";

const options: { value: Locale; label: string }[] = [
  { value: "en", label: "EN" },
  { value: "so", label: "SO" },
];

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();

  return (
    <div className="flex items-center rounded-full border border-zinc-200 p-0.5 text-xs font-semibold">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => setLocale(option.value)}
          aria-pressed={locale === option.value}
          className={cn(
            "rounded-full px-2.5 py-1 transition-colors",
            locale === option.value ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-900"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
