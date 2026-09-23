"use client";

import { Calendar, MapPin, Phone, ShieldCheck, UserRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { RoleBadge, StatusBadge } from "@/components/ui/badge";
import { useLanguage } from "@/components/language-provider";
import { describeSomaliPhone } from "@/lib/somali-phone";
import type { User } from "@/lib/types";

export function ProfileCard({ user }: { user: User }) {
  const { t } = useLanguage();
  const phone = describeSomaliPhone(user.phone);

  return (
    <Card>
      <div className="flex items-center gap-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-zinc-800 to-zinc-950 text-base font-semibold text-white shadow-sm">
          {user.firstName[0]}
          {user.lastName[0]}
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold text-zinc-900">
            {user.firstName} {user.lastName}
          </p>
          <p className="truncate text-sm text-zinc-500">{user.email}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <RoleBadge role={user.role} />
        <StatusBadge isActive={user.isActive} />
      </div>

      <dl className="mt-6 space-y-3 border-t border-zinc-100 pt-5 text-sm">
        <div className="flex items-center justify-between">
          <dt className="flex items-center gap-2 text-zinc-500">
            <Phone className="h-4 w-4 text-zinc-400" />
            {t("common.phone")}
          </dt>
          <dd className="font-medium text-zinc-900">
            {phone.formatted}
            {phone.provider && <span className="ml-1.5 text-xs font-normal text-zinc-400">({phone.provider})</span>}
          </dd>
        </div>
        {user.city && (
          <div className="flex items-center justify-between">
            <dt className="flex items-center gap-2 text-zinc-500">
              <MapPin className="h-4 w-4 text-zinc-400" />
              {t("common.city")}
            </dt>
            <dd className="font-medium text-zinc-900">{user.city}</dd>
          </div>
        )}
        <div className="flex items-center justify-between">
          <dt className="flex items-center gap-2 text-zinc-500">
            <ShieldCheck className="h-4 w-4 text-zinc-400" />
            {t("common.emailVerified")}
          </dt>
          <dd className="font-medium text-zinc-900">{user.isEmailVerified ? t("common.yes") : t("common.no")}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="flex items-center gap-2 text-zinc-500">
            <Calendar className="h-4 w-4 text-zinc-400" />
            {t("common.memberSince")}
          </dt>
          <dd className="font-medium text-zinc-900">{new Date(user.createdAt).toLocaleDateString()}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="flex items-center gap-2 text-zinc-500">
            <UserRound className="h-4 w-4 text-zinc-400" />
            {t("common.role")}
          </dt>
          <dd className="font-medium text-zinc-900">
            {user.role === "SUPER_ADMIN" ? t("common.roleAdmin") : user.role === "BUSINESS" ? t("common.roleBusiness") : t("common.roleTenant")}
          </dd>
        </div>
      </dl>
    </Card>
  );
}
