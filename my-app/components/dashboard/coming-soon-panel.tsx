"use client";

import type { LucideIcon } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { useLanguage } from "@/components/language-provider";

export function ComingSoonPanel({
  icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  const { t } = useLanguage();

  return <EmptyState icon={icon} title={title} description={description} badge={t("common.comingSoon")} />;
}
