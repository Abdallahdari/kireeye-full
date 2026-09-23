"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Building2, CalendarCheck, CheckCircle2, Circle, CreditCard, Flag, ShieldCheck, UserCircle } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { LockedAnalyticsPanel } from "@/components/ui/charts";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/language-provider";
import { cn } from "@/lib/cn";
import * as api from "@/lib/api-client";
import type { User } from "@/lib/types";

export function BusinessOverview({ user }: { user: User }) {
  const { t } = useLanguage();
  const [hasListing, setHasListing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .listMyProperties({ limit: 1 })
      .then((result) => {
        if (!cancelled) setHasListing(result.pagination.total > 0);
      })
      .catch(() => {
        // Checklist step just stays unchecked.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const approvalTone = user.businessApproval === "APPROVED" ? "emerald" : user.businessApproval === "REJECTED" ? "rose" : "amber";
  const approvalLabel =
    user.businessApproval === "APPROVED"
      ? t("dashboard.admin.businessApprovals.filterApproved")
      : user.businessApproval === "REJECTED"
        ? t("dashboard.admin.businessApprovals.filterRejected")
        : t("dashboard.admin.businessApprovals.filterPending");

  const steps = [
    { label: t("dashboard.business.overview.stepVerifyEmail"), done: user.isEmailVerified },
    { label: t("dashboard.business.overview.stepGetApproved"), done: user.businessApproval === "APPROVED" },
    { label: t("dashboard.business.overview.stepAddListing"), done: hasListing },
    { label: t("dashboard.business.overview.stepFirstBooking"), done: false },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  const quickActions = [
    { label: t("dashboard.business.overview.actionCompleteProfile"), href: "/dashboard/business/profile", icon: UserCircle },
    { label: t("dashboard.business.overview.actionViewListings"), href: "/dashboard/business/listings", icon: Building2 },
    { label: t("dashboard.business.overview.actionBilling"), href: "/dashboard/business/billing", icon: CreditCard },
    { label: t("dashboard.business.overview.actionViewBookings"), href: "/dashboard/business/bookings", icon: CalendarCheck },
    { label: t("dashboard.business.overview.actionReportUser"), href: "/dashboard/report", icon: Flag },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-gradient-to-br from-zinc-900 via-zinc-900 to-rose-950 p-6 text-white shadow-sm sm:p-8">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-rose-200">
          <Building2 className="h-3.5 w-3.5" />
          {t("common.roleBusiness")}
        </span>
        <p className="mt-4 text-xl font-semibold sm:text-2xl">
          {t("dashboard.business.overview.welcome", { name: user.firstName })}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge tone={approvalTone}>{approvalLabel}</Badge>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={ShieldCheck}
          tone={user.isActive ? "emerald" : "amber"}
          label={t("dashboard.business.overview.accountStatus")}
          value={user.isActive ? t("common.statusActive") : t("common.statusSuspended")}
        />
        <StatCard
          icon={CheckCircle2}
          tone={approvalTone}
          label={t("dashboard.business.overview.approvalStatus")}
          value={approvalLabel}
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
        <Card className="lg:col-span-1">
          <CardHeader
            title={t("dashboard.business.overview.checklistTitle")}
            subtitle={`${doneCount}/${steps.length}`}
          />
          <div className="mt-4">
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-rose-600 transition-all"
                style={{ width: `${(doneCount / steps.length) * 100}%` }}
              />
            </div>
            <ul className="mt-4 flex flex-col gap-3">
              {steps.map((step) => (
                <li key={step.label} className="flex items-center gap-2.5 text-sm">
                  {step.done ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-zinc-300" />
                  )}
                  <span className={cn(step.done ? "text-zinc-500 line-through" : "text-zinc-700")}>{step.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card className="lg:col-span-1" padded={false}>
          <div className="p-5 sm:p-6">
            <CardHeader title={t("dashboard.business.overviewComingSoonTitle")} />
          </div>
          <div className="px-5 pb-5 sm:px-6 sm:pb-6">
            <LockedAnalyticsPanel
              title={t("dashboard.business.overviewComingSoonTitle")}
              description={t("dashboard.business.overviewComingSoonBody")}
            />
          </div>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader title={t("dashboard.business.overview.quickActionsTitle")} />
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
