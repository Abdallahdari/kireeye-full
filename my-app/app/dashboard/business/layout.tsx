import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/api-server";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import type { DashboardNavItem } from "@/components/dashboard/sidebar";

const navItems: DashboardNavItem[] = [
  { labelKey: "dashboard.business.nav.overview", href: "/dashboard/business", icon: "overview" },
  { labelKey: "dashboard.business.nav.listings", href: "/dashboard/business/listings", icon: "listings" },
  { labelKey: "dashboard.business.nav.billing", href: "/dashboard/business/billing", icon: "billing" },
  { labelKey: "dashboard.business.nav.profile", href: "/dashboard/business/profile", icon: "profile" },
];

export default async function BusinessLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/dashboard/business");
  }

  if (user.role !== "BUSINESS") {
    redirect("/dashboard");
  }

  return (
    <DashboardShell user={user} titleKey="dashboard.business.title" navItems={navItems}>
      {children}
    </DashboardShell>
  );
}
