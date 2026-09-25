"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Building2, Flag, ShieldCheck, Wallet, Sparkles, Users, UsersRound } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { RecentListings } from "@/components/dashboard/recent-listings";
import { DonutChart, BarList, type ChartDatum } from "@/components/ui/charts";
import { useLanguage } from "@/components/language-provider";
import type { Report, Role, User } from "@/lib/types";
import * as api from "@/lib/api-client";
import { formatUsd } from "@/lib/format";

interface Counts {
  ALL: number;
  TENANT: number;
  BUSINESS: number;
  SUPER_ADMIN: number;
  pendingApprovals: number;
  openReports: number;
  revenueTotal: number;
  revenueThisMonth: number;
}

interface ActivityItem {
  id: string;
  at: string;
  kind: "user" | "report";
  content: string;
}

export function AdminOverview({ currentUser }: { currentUser: User }) {
  const { t } = useLanguage();
  const [counts, setCounts] = useState<Counts | null>(null);
  const [activity, setActivity] = useState<ActivityItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      api.listUsers({ limit: 1 }),
      api.listUsers({ role: "TENANT", limit: 1 }),
      api.listUsers({ role: "BUSINESS", limit: 1 }),
      api.listUsers({ role: "SUPER_ADMIN", limit: 1 }),
      api.listUsers({ role: "BUSINESS", businessApproval: "PENDING", limit: 1 }),
      api.listReports({ status: "OPEN", limit: 1 }),
      api.listBillingBusinesses({ limit: 1 }),
    ])
      .then(([all, tenants, businesses, admins, pending, open, billing]) => {
        if (cancelled) return;
        setCounts({
          ALL: all.pagination.total,
          TENANT: tenants.pagination.total,
          BUSINESS: businesses.pagination.total,
          SUPER_ADMIN: admins.pagination.total,
          pendingApprovals: pending.pagination.total,
          openReports: open.pagination.total,
          revenueTotal: billing.totals.revenueTotal,
          revenueThisMonth: billing.totals.revenueThisMonth,
        });
      })
      .catch(() => {
        // Stats are a nice-to-have; the rest of the dashboard still works without them.
      });

    Promise.all([api.listUsers({ limit: 4 }), api.listReports({ limit: 4 })])
      .then(([users, reports]) => {
        if (cancelled) return;
        const userItems: ActivityItem[] = users.users.map((u: User) => ({
          id: `user-${u._id}`,
          at: u.createdAt,
          kind: "user",
          content: t("dashboard.admin.overview.activityJoined", {
            name: `${u.firstName} ${u.lastName}`,
            role: roleLabel(u.role, t),
          }),
        }));
        const reportItems: ActivityItem[] = reports.reports.map((r: Report) => ({
          id: `report-${r._id}`,
          at: r.createdAt,
          kind: "report",
          content: t("dashboard.admin.overview.activityReported", {
            reporter: `${r.reporter.firstName} ${r.reporter.lastName}`,
            reported: `${r.reportedUser.firstName} ${r.reportedUser.lastName}`,
          }),
        }));
        const merged = [...userItems, ...reportItems]
          .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
          .slice(0, 6);
        setActivity(merged);
      })
      .catch(() => {
        setActivity([]);
      });

    return () => {
      cancelled = true;
    };
  }, [t]);

  const roleData: ChartDatum[] = useMemo(
    () => [
      { label: t("dashboard.admin.overview.tenants"), value: counts?.TENANT ?? 0, tone: "zinc" },
      { label: t("dashboard.admin.overview.businesses"), value: counts?.BUSINESS ?? 0, tone: "rose" },
      { label: t("dashboard.admin.overview.admins"), value: counts?.SUPER_ADMIN ?? 0, tone: "violet" },
    ],
    [counts, t]
  );

  const statCards = [
    { label: t("dashboard.admin.overview.totalUsers"), value: counts?.ALL, icon: UsersRound, tone: "zinc" as const },
    { label: t("dashboard.admin.overview.businesses"), value: counts?.BUSINESS, icon: Building2, tone: "rose" as const },
    {
      label: t("dashboard.admin.overview.pendingApprovals"),
      value: counts?.pendingApprovals,
      icon: ShieldCheck,
      tone: "amber" as const,
    },
    { label: t("dashboard.admin.overview.openReports"), value: counts?.openReports, icon: Flag, tone: "violet" as const },
    {
      label: t("dashboard.admin.overview.totalPayments"),
      value: counts ? formatUsd(counts.revenueTotal) : undefined,
      hint: counts ? t("dashboard.admin.overview.paymentsThisMonth", { amount: formatUsd(counts.revenueThisMonth) }) : undefined,
      icon: Wallet,
      tone: "emerald" as const,
    },
  ];

  const quickActions = [
    { label: t("dashboard.admin.nav.manageUsers"), href: "/dashboard/admin/users", icon: Users },
    { label: t("dashboard.admin.nav.businessApprovals"), href: "/dashboard/admin/business-approvals", icon: ShieldCheck },
    { label: t("dashboard.admin.nav.reports"), href: "/dashboard/admin/reports", icon: Flag },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-gradient-to-br from-zinc-900 via-zinc-900 to-rose-950 p-6 text-white shadow-sm sm:p-8">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-rose-200">
          <Sparkles className="h-3.5 w-3.5" />
          {t("dashboard.admin.title")}
        </span>
        <p className="mt-4 text-xl font-semibold sm:text-2xl">
          {t("dashboard.admin.overview.welcome", { name: currentUser.firstName })}
        </p>
        <p className="mt-2 max-w-xl text-sm text-zinc-300">
          {t("dashboard.admin.overview.introBefore")}{" "}
          <Link href="/dashboard/admin/users" className="font-semibold text-white underline underline-offset-2">
            {t("dashboard.admin.overview.manageUsersLink")}
          </Link>{" "}
          {t("dashboard.admin.overview.introAfter")}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statCards.map((card) => (
          <StatCard
            key={card.label}
            icon={card.icon}
            tone={card.tone}
            label={card.label}
            value={card.value}
            hint={"hint" in card ? card.hint : undefined}
          />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title={t("dashboard.admin.overview.roleDistributionTitle")} />
          <div className="mt-5">
            <DonutChart data={roleData} centerLabel={t("dashboard.admin.overview.totalUsers")} centerValue={counts?.ALL ?? 0} />
          </div>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader title={t("dashboard.admin.overview.approvalBreakdownTitle")} />
          <div className="mt-5">
            <BarList
              data={[
                { label: t("dashboard.admin.businessApprovals.filterPending"), value: counts?.pendingApprovals ?? 0, tone: "amber" },
                { label: t("dashboard.admin.overview.openReports"), value: counts?.openReports ?? 0, tone: "rose" },
                { label: t("dashboard.admin.overview.businesses"), value: counts?.BUSINESS ?? 0, tone: "violet" },
              ]}
            />
          </div>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader title={t("dashboard.admin.overview.quickActionsTitle")} />
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

      <RecentListings mode="admin" />

      <Card>
        <CardHeader title={t("dashboard.admin.overview.recentActivityTitle")} />
        <ul className="mt-4 flex flex-col divide-y divide-zinc-50">
          {activity === null ? (
            [0, 1, 2].map((i) => (
              <li key={i} className="flex items-center gap-3 py-3">
                <span className="h-2 w-2 rounded-full bg-zinc-100" />
                <span className="h-4 w-2/3 animate-pulse rounded bg-zinc-100" />
              </li>
            ))
          ) : activity.length === 0 ? (
            <li className="py-6 text-center text-sm text-zinc-400">{t("dashboard.admin.overview.noRecentActivity")}</li>
          ) : (
            activity.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-3 text-sm">
                <span className={`h-2 w-2 shrink-0 rounded-full ${item.kind === "report" ? "bg-rose-500" : "bg-emerald-500"}`} />
                <span className="text-zinc-700">{item.content}</span>
                <span className="ml-auto shrink-0 text-xs text-zinc-400">{new Date(item.at).toLocaleDateString()}</span>
              </li>
            ))
          )}
        </ul>
      </Card>
    </div>
  );
}

function roleLabel(role: Role, t: (key: string) => string): string {
  if (role === "SUPER_ADMIN") return t("common.roleAdmin");
  if (role === "BUSINESS") return t("common.roleBusiness");
  return t("common.roleTenant");
}
