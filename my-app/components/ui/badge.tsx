"use client";

import { cn } from "@/lib/cn";
import { useLanguage } from "@/components/language-provider";
import type { Role } from "@/lib/types";

type Tone = "zinc" | "rose" | "violet" | "emerald" | "amber";

const tones: Record<Tone, string> = {
  zinc: "bg-zinc-100 text-zinc-700",
  rose: "bg-rose-100 text-rose-700",
  violet: "bg-violet-100 text-violet-700",
  emerald: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-800",
};

export function Badge({ tone = "zinc", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", tones[tone])}>
      {children}
    </span>
  );
}

const roleTones: Record<Role, Tone> = {
  SUPER_ADMIN: "violet",
  BUSINESS: "rose",
  TENANT: "zinc",
};

const roleLabelKeys: Record<Role, string> = {
  SUPER_ADMIN: "common.roleAdmin",
  BUSINESS: "common.roleBusiness",
  TENANT: "common.roleTenant",
};

export function RoleBadge({ role }: { role: Role }) {
  const { t } = useLanguage();
  return <Badge tone={roleTones[role]}>{t(roleLabelKeys[role])}</Badge>;
}

export function StatusBadge({ isActive }: { isActive: boolean }) {
  const { t } = useLanguage();
  return (
    <Badge tone={isActive ? "emerald" : "amber"}>
      {isActive ? t("common.statusActive") : t("common.statusSuspended")}
    </Badge>
  );
}
