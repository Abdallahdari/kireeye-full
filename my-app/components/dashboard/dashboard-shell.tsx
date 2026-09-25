"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { useAuth } from "@/components/auth-provider";
import { useLanguage } from "@/components/language-provider";
import * as api from "@/lib/api-client";
import type { User } from "@/lib/types";
import { DashboardSidebar, MobileSidebarDrawer, type DashboardNavItem } from "./sidebar";
import { DashboardTopbar, type DashboardAlert } from "./topbar";

const COLLAPSE_KEY = "stayly-sidebar-collapsed";

type Listener = () => void;
const collapseListeners = new Set<Listener>();

function subscribeCollapsed(listener: Listener) {
  collapseListeners.add(listener);
  return () => collapseListeners.delete(listener);
}

function getCollapsedSnapshot(): boolean {
  try {
    return window.localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

function getCollapsedServerSnapshot(): boolean {
  return false;
}

function setStoredCollapsed(next: boolean) {
  try {
    window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
  } catch {
    // localStorage may be unavailable; the toggle still works for this session.
  }
  collapseListeners.forEach((listener) => listener());
}

function useSidebarCollapsed() {
  const collapsed = useSyncExternalStore(subscribeCollapsed, getCollapsedSnapshot, getCollapsedServerSnapshot);
  const toggle = useCallback(() => setStoredCollapsed(!getCollapsedSnapshot()), []);
  return { collapsed, toggle };
}

function useRoleAlerts(user: User): DashboardAlert[] {
  const { t } = useLanguage();
  const [adminAlerts, setAdminAlerts] = useState<DashboardAlert[]>([]);

  useEffect(() => {
    if (user.role !== "SUPER_ADMIN") return;
    let cancelled = false;

    Promise.all([
      api.listUsers({ role: "BUSINESS", businessApproval: "PENDING", limit: 1 }),
      api.listReports({ status: "OPEN", limit: 1 }),
    ])
      .then(([pending, open]) => {
        if (cancelled) return;
        const next: DashboardAlert[] = [];
        if (pending.pagination.total > 0) {
          next.push({
            id: "pending-approvals",
            label: t("dashboard.shell.alertPendingApprovals", { count: pending.pagination.total }),
            description: t("dashboard.shell.alertPendingApprovalsBody"),
            href: "/dashboard/admin/business-approvals",
          });
        }
        if (open.pagination.total > 0) {
          next.push({
            id: "open-reports",
            label: t("dashboard.shell.alertOpenReports", { count: open.pagination.total }),
            description: t("dashboard.shell.alertOpenReportsBody"),
            href: "/dashboard/admin/reports",
          });
        }
        setAdminAlerts(next);
      })
      .catch(() => {
        // Alerts are a nice-to-have; ignore failures.
      });

    return () => {
      cancelled = true;
    };
  }, [user.role, t]);

  const selfAlerts = useMemo<DashboardAlert[]>(() => {
    if (user.role === "BUSINESS") {
      if (user.businessApproval === "PENDING") {
        return [
          {
            id: "approval-pending",
            label: t("dashboard.shell.alertApprovalPending"),
            description: t("dashboard.shell.alertApprovalPendingBody"),
            href: "/dashboard/business/profile",
          },
        ];
      }
      if (user.businessApproval === "REJECTED") {
        return [
          {
            id: "approval-rejected",
            label: t("dashboard.shell.alertApprovalRejected"),
            description: t("dashboard.shell.alertApprovalRejectedBody"),
            href: "/dashboard/business/profile",
          },
        ];
      }
      return [];
    }

    return [];
  }, [user.role, user.businessApproval, t]);

  return user.role === "SUPER_ADMIN" ? adminAlerts : selfAlerts;
}

export function DashboardShell({
  user,
  titleKey,
  navItems,
  children,
}: {
  user: User;
  titleKey: string;
  navItems: DashboardNavItem[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { setUser, logout } = useAuth();
  const { t } = useLanguage();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { collapsed, toggle } = useSidebarCollapsed();
  const alerts = useRoleAlerts(user);

  useEffect(() => {
    setUser(user);
  }, [user, setUser]);

  async function handleLogout() {
    await logout();
    router.push("/");
    router.refresh();
  }

  async function handleResend() {
    setResending(true);
    try {
      await api.resendVerification(user.email);
      setResent(true);
    } finally {
      setResending(false);
    }
  }

  const profileItem = navItems.find((item) => item.href.endsWith("/profile"));
  const profileHref = profileItem?.href ?? navItems[0]?.href ?? "/dashboard";

  return (
    <div className="flex w-full flex-1 bg-zinc-50">
      <DashboardSidebar items={navItems} brand="kireeye" collapsed={collapsed} onToggleCollapsed={toggle} />
      <MobileSidebarDrawer items={navItems} brand="kireeye" open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopbar
          user={user}
          navItems={navItems}
          sectionTitle={t(titleKey)}
          profileHref={profileHref}
          onOpenMobileMenu={() => setMobileOpen(true)}
          onLogout={handleLogout}
          alerts={alerts}
        />

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
            {!user.isEmailVerified && (
              <div>
                {resent ? (
                  <Alert variant="success">{t("dashboard.verificationSent")}</Alert>
                ) : (
                  <Alert variant="info">
                    {t("dashboard.emailNotVerified")}{" "}
                    <button
                      onClick={handleResend}
                      disabled={resending}
                      className="font-semibold underline underline-offset-2 disabled:opacity-60"
                    >
                      {t("dashboard.resendVerification")}
                    </button>
                  </Alert>
                )}
              </div>
            )}

            <div className="dash-animate-in">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
