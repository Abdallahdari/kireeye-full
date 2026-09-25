import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/api-server";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import type { DashboardNavItem } from "@/components/dashboard/sidebar";

const navItems: DashboardNavItem[] = [
  { labelKey: "dashboard.admin.nav.overview", href: "/dashboard/admin", icon: "overview" },
  { labelKey: "dashboard.admin.nav.manageUsers", href: "/dashboard/admin/users", icon: "users" },
  { labelKey: "dashboard.admin.nav.businessApprovals", href: "/dashboard/admin/business-approvals", icon: "approvals" },
  { labelKey: "dashboard.admin.nav.listings", href: "/dashboard/admin/listings", icon: "listings" },
  { labelKey: "dashboard.admin.nav.billing", href: "/dashboard/admin/billing", icon: "billing" },
  { labelKey: "dashboard.admin.nav.reports", href: "/dashboard/admin/reports", icon: "reports" },
  { labelKey: "dashboard.admin.nav.comingSoon", href: "/dashboard/admin/coming-soon", icon: "comingSoon" },
  { labelKey: "dashboard.admin.nav.blog", href: "/dashboard/admin/blog", icon: "blog" },
  { labelKey: "dashboard.admin.nav.profile", href: "/dashboard/admin/profile", icon: "profile" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/dashboard/admin");
  }

  if (user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  return (
    <DashboardShell user={user} titleKey="dashboard.admin.title" navItems={navItems}>
      {children}
    </DashboardShell>
  );
}
