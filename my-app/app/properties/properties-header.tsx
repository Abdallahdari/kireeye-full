"use client";

import { useLanguage } from "@/components/language-provider";

export function PropertiesHeader() {
  const { t } = useLanguage();

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">{t("properties.title")}</h1>
      <p className="mt-1 text-zinc-600">{t("properties.subtitle")}</p>
    </div>
  );
}
