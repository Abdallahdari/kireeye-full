"use client";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import type { DashboardNavItem } from "@/components/dashboard/sidebar";
import type { User } from "@/lib/types";
import { MemberDashboard } from "./member-dashboard";

const navItems: DashboardNavItem[] = [
  { labelKey: "dashboard.tenant.title", href: "/dashboard", icon: "overview" },
  { labelKey: "dashboard.tenant.reportUser", href: "/dashboard/report", icon: "report" },
];

export function DashboardView({ user }: { user: User }) {
  return (
    <DashboardShell user={user} titleKey="dashboard.tenant.title" navItems={navItems}>
      <MemberDashboard user={user} />
    </DashboardShell>
  );
}
