"use client";

import { Badge } from "./badge";
import { cn } from "@/lib/cn";
import { useLanguage } from "@/components/language-provider";
import {
  detectSomaliProvider,
  formatSomaliNationalDigits,
  toSomaliNationalDigits,
} from "@/lib/somali-phone";

export function PhoneField({
  label,
  value,
  onChange,
  error,
  required,
}: {
  label: string;
  value: string;
  onChange: (nationalDigits: string) => void;
  error?: string;
  required?: boolean;
}) {
  const { t } = useLanguage();
  const provider = detectSomaliProvider(value);
  const showUnknown = value.length >= 2 && !provider;

  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-zinc-700">{label}</span>
      <div
        className={cn(
          "flex items-stretch overflow-hidden rounded-xl border border-zinc-200 transition-colors focus-within:border-rose-500 focus-within:ring-2 focus-within:ring-rose-100",
          error && "border-red-400 focus-within:border-red-500 focus-within:ring-red-100"
        )}
      >
        <span className="flex items-center border-r border-zinc-200 bg-zinc-50 px-3 text-zinc-500">
          +252
        </span>
        <input
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          required={required}
          placeholder="61 234 5678"
          value={formatSomaliNationalDigits(value)}
          onChange={(e) => onChange(toSomaliNationalDigits(e.target.value))}
          className="min-w-0 flex-1 px-3.5 py-2.5 text-zinc-900 outline-none placeholder:text-zinc-400"
        />
      </div>

      <div className="flex min-h-[1rem] items-center gap-2">
        {provider && <Badge tone="emerald">{provider}</Badge>}
        {showUnknown && <span className="text-xs text-amber-700">{t("common.unrecognizedPrefix")}</span>}
        {error && <span className="text-xs font-medium text-red-600">{error}</span>}
      </div>
    </div>
  );
}
