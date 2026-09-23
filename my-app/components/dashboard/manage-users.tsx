"use client";

import { useEffect, useState } from "react";
import { Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { FilterPills } from "@/components/ui/filter-pills";
import { PaginationFooter } from "@/components/ui/pagination";
import { TableEmptyRow } from "@/components/ui/empty-state";
import { useLanguage } from "@/components/language-provider";
import { cn } from "@/lib/cn";
import { describeSomaliPhone } from "@/lib/somali-phone";
import * as api from "@/lib/api-client";
import type { Role, User } from "@/lib/types";

const PAGE_SIZE = 10;

export function ManageUsers({ currentUser }: { currentUser: User }) {
  const { t } = useLanguage();
  const [roleFilter, setRoleFilter] = useState<Role | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<api.Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const roleFilters: { label: string; value: Role | "ALL" }[] = [
    { label: t("dashboard.admin.manageUsers.filterAll"), value: "ALL" },
    { label: t("dashboard.admin.manageUsers.filterTenants"), value: "TENANT" },
    { label: t("dashboard.admin.manageUsers.filterBusinesses"), value: "BUSINESS" },
    { label: t("dashboard.admin.manageUsers.filterAdmins"), value: "SUPER_ADMIN" },
  ];

  // Fetch the user list whenever the filter, page, or a mutation-triggered
  // refresh changes. setState calls live inside the promise callbacks (not
  // synchronously in the effect body) so a refetch doesn't cascade renders.
  useEffect(() => {
    let cancelled = false;

    api
      .listUsers({ role: roleFilter === "ALL" ? undefined : roleFilter, page, limit: PAGE_SIZE })
      .then((result) => {
        if (cancelled) return;
        setUsers(result.users);
        setPagination(result.pagination);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof api.ApiClientError ? err.message : "Unable to load users right now.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [roleFilter, page, refreshIndex]);

  function changeFilter(value: Role | "ALL") {
    setRoleFilter(value);
    setPage(1);
  }

  async function handleToggleStatus(user: User) {
    setPendingId(user._id);
    setError(null);
    try {
      await api.updateUserStatus(user._id, !user.isActive);
      setRefreshIndex((i) => i + 1);
    } catch (err) {
      setError(err instanceof api.ApiClientError ? err.message : "Unable to update user status.");
    } finally {
      setPendingId(null);
    }
  }

  async function handleRoleChange(user: User, role: Role) {
    if (role === user.role) return;
    setPendingId(user._id);
    setError(null);
    try {
      await api.updateUserRole(user._id, role);
      setRefreshIndex((i) => i + 1);
    } catch (err) {
      setError(err instanceof api.ApiClientError ? err.message : "Unable to update user role.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <Card padded={false}>
      <div className="border-b border-zinc-100 p-5">
        <CardHeader
          title={t("dashboard.admin.manageUsers.title")}
          subtitle={t("dashboard.admin.manageUsers.subtitle")}
          actions={<FilterPills options={roleFilters} value={roleFilter} onChange={changeFilter} />}
        />
      </div>

      {error && (
        <div className="p-5 pb-0">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-xs uppercase tracking-wide text-zinc-400">
              <th className="px-5 py-3 font-medium">{t("dashboard.admin.manageUsers.colUser")}</th>
              <th className="px-5 py-3 font-medium">{t("dashboard.admin.manageUsers.colPhone")}</th>
              <th className="px-5 py-3 font-medium">{t("dashboard.admin.manageUsers.colRole")}</th>
              <th className="px-5 py-3 font-medium">{t("dashboard.admin.manageUsers.colStatus")}</th>
              <th className="px-5 py-3 font-medium">{t("dashboard.admin.manageUsers.colVerified")}</th>
              <th className="px-5 py-3 font-medium">{t("dashboard.admin.manageUsers.colJoined")}</th>
              <th className="px-5 py-3 font-medium text-right">{t("dashboard.admin.manageUsers.colActions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {loading ? (
              <TableEmptyRow icon={Loader2} message={t("dashboard.admin.manageUsers.loading")} colSpan={7} spin />
            ) : users.length === 0 ? (
              <TableEmptyRow icon={Users} message={t("dashboard.admin.manageUsers.empty")} colSpan={7} />
            ) : (
              users.map((user) => {
                const isSelf = user._id === currentUser._id;
                const isPending = pendingId === user._id;
                const phone = describeSomaliPhone(user.phone);

                return (
                  <tr key={user._id} className="align-middle transition-colors hover:bg-zinc-50/60">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white">
                          {user.firstName[0]}
                          {user.lastName[0]}
                        </span>
                        <div>
                          <p className="font-medium text-zinc-900">
                            {user.firstName} {user.lastName}
                            {isSelf && (
                              <span className="ml-2 text-xs font-normal text-zinc-400">
                                {t("dashboard.admin.manageUsers.you")}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-zinc-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-zinc-900">{phone.formatted}</p>
                      {phone.provider && (
                        <span className="mt-1 inline-block">
                          <Badge tone="emerald">{phone.provider}</Badge>
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <select
                        value={user.role}
                        disabled={isSelf || isPending}
                        onChange={(e) => handleRoleChange(user, e.target.value as Role)}
                        className={cn(
                          "rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs font-medium text-zinc-700 outline-none",
                          "focus:border-rose-500 focus:ring-2 focus:ring-rose-100",
                          (isSelf || isPending) && "cursor-not-allowed opacity-60"
                        )}
                      >
                        <option value="TENANT">{t("common.roleTenant")}</option>
                        <option value="BUSINESS">{t("common.roleBusiness")}</option>
                        <option value="SUPER_ADMIN">{t("common.roleAdmin")}</option>
                      </select>
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge isActive={user.isActive} />
                    </td>
                    <td className="px-5 py-3 text-zinc-600">
                      {user.isEmailVerified ? t("common.yes") : t("common.no")}
                    </td>
                    <td className="px-5 py-3 text-zinc-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button
                        variant="secondary"
                        className="px-3 py-1.5 text-xs"
                        disabled={isSelf || isPending}
                        loading={isPending}
                        onClick={() => handleToggleStatus(user)}
                      >
                        {user.isActive
                          ? t("dashboard.admin.manageUsers.suspend")
                          : t("dashboard.admin.manageUsers.activate")}
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <PaginationFooter
          pagination={pagination}
          page={page}
          onPageChange={setPage}
          label={t("dashboard.admin.manageUsers.pageOf", {
            page: pagination.page,
            pages: pagination.pages,
            total: pagination.total,
          })}
          previousLabel={t("common.previous")}
          nextLabel={t("common.next")}
        />
      )}
    </Card>
  );
}
