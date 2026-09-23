"use client";

import Link from "next/link";
import { ArrowRight, CalendarCheck, Flag, Search, ShieldCheck, UserCircle } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { LockedAnalyticsPanel } from "@/components/ui/charts";
import { ProfileCard } from "@/components/dashboard/profile-card";
import { useLanguage } from "@/components/language-provider";
import type { User } from "@/lib/types";

export function MemberDashboard({ user }: { user: User }) {
  const { t } = useLanguage();

  const quickActions = [
    { label: t("dashboard.tenant.overview.actionBrowse"), href: "/", icon: Search },
    { label: t("dashboard.tenant.overview.actionReportUser"), href: "/dashboard/report", icon: Flag },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-gradient-to-br from-rose-600 via-rose-600 to-zinc-900 p-6 text-white shadow-sm sm:p-8">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-rose-100">
          <Search className="h-3.5 w-3.5" />
          {t("common.roleTenant")}
        </span>
        <p className="mt-4 text-xl font-semibold sm:text-2xl">
          {t("dashboard.tenant.overview.welcome", { name: user.firstName })}
        </p>
        <p className="mt-2 max-w-md text-sm text-rose-50/90">{t("dashboard.tenant.overview.heroBody")}</p>
        <Link
          href="/"
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-rose-50"
        >
          {t("dashboard.tenant.overview.heroCta")}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={ShieldCheck}
          tone={user.isActive ? "emerald" : "amber"}
          label={t("dashboard.tenant.overview.accountStatus")}
          value={user.isActive ? t("common.statusActive") : t("common.statusSuspended")}
        />
        <StatCard
          icon={UserCircle}
          tone={user.isEmailVerified ? "emerald" : "amber"}
          label={t("common.emailVerified")}
          value={user.isEmailVerified ? t("common.yes") : t("common.no")}
        />
        <StatCard
          icon={CalendarCheck}
          tone="zinc"
          label={t("common.memberSince")}
          value={new Date(user.createdAt).toLocaleDateString()}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <ProfileCard user={user} />
        </div>

        <Card className="lg:col-span-1" padded={false}>
          <div className="p-5 sm:p-6 sm:pb-0">
            <CardHeader title={t("dashboard.tenant.bookingsTitle")} />
          </div>
          <div className="p-5 pt-4 sm:p-6 sm:pt-4">
            <LockedAnalyticsPanel title={t("dashboard.tenant.bookingsTitle")} description={t("dashboard.tenant.bookingsBody")} />
          </div>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader title={t("dashboard.tenant.overview.quickActionsTitle")} />
          <div className="mt-4 flex flex-col gap-2">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="group flex items-center justify-between rounded-xl border border-zinc-100 px-4 py-3 text-sm font-medium text-zinc-700 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
              >
                <span className="flex items-center gap-2.5">
                  <action.icon className="h-4 w-4 text-zinc-400 group-hover:text-rose-600" />
                  {action.label}
                </span>
                <ArrowRight className="h-4 w-4 text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:text-rose-600" />
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
