"use client";

import { useEffect, useState } from "react";
import { Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { FilterPills } from "@/components/ui/filter-pills";
import { PaginationFooter } from "@/components/ui/pagination";
import { TableEmptyRow } from "@/components/ui/empty-state";
import { useLanguage } from "@/components/language-provider";
import { describeSomaliPhone } from "@/lib/somali-phone";
import * as api from "@/lib/api-client";
import type { BusinessApprovalStatus, User } from "@/lib/types";

const statusTones: Record<BusinessApprovalStatus, "amber" | "emerald" | "rose"> = {
  PENDING: "amber",
  APPROVED: "emerald",
  REJECTED: "rose",
};

const PAGE_SIZE = 10;

export function BusinessApprovals() {
  const { t } = useLanguage();
  const [statusFilter, setStatusFilter] = useState<BusinessApprovalStatus | "ALL">("PENDING");
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<api.Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const statusLabels: Record<BusinessApprovalStatus, string> = {
    PENDING: t("dashboard.admin.businessApprovals.filterPending"),
    APPROVED: t("dashboard.admin.businessApprovals.filterApproved"),
    REJECTED: t("dashboard.admin.businessApprovals.filterRejected"),
  };

  const statusFilters: { label: string; value: BusinessApprovalStatus | "ALL" }[] = [
    { label: t("dashboard.admin.businessApprovals.filterPending"), value: "PENDING" },
    { label: t("dashboard.admin.businessApprovals.filterApproved"), value: "APPROVED" },
    { label: t("dashboard.admin.businessApprovals.filterRejected"), value: "REJECTED" },
    { label: t("dashboard.admin.businessApprovals.filterAll"), value: "ALL" },
  ];

  useEffect(() => {
    let cancelled = false;

    api
      .listUsers({
        role: "BUSINESS",
        businessApproval: statusFilter === "ALL" ? undefined : statusFilter,
        page,
        limit: PAGE_SIZE,
      })
      .then((result) => {
        if (cancelled) return;
        setUsers(result.users);
        setPagination(result.pagination);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof api.ApiClientError ? err.message : "Unable to load businesses right now.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [statusFilter, page, refreshIndex]);

  function changeFilter(value: BusinessApprovalStatus | "ALL") {
    setStatusFilter(value);
    setPage(1);
  }

  async function handleDecision(user: User, status: "APPROVED" | "REJECTED") {
    setPendingId(user._id);
    setError(null);
    try {
      await api.updateBusinessApproval(user._id, status);
      setRefreshIndex((i) => i + 1);
    } catch (err) {
      setError(err instanceof api.ApiClientError ? err.message : "Unable to update this business right now.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <Card padded={false}>
      <div className="border-b border-zinc-100 p-5">
        <CardHeader
          title={t("dashboard.admin.businessApprovals.title")}
          subtitle={t("dashboard.admin.businessApprovals.subtitle")}
          actions={<FilterPills options={statusFilters} value={statusFilter} onChange={changeFilter} />}
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
              <th className="px-5 py-3 font-medium">{t("dashboard.admin.businessApprovals.colBusiness")}</th>
              <th className="px-5 py-3 font-medium">{t("dashboard.admin.businessApprovals.colPhone")}</th>
              <th className="px-5 py-3 font-medium">{t("dashboard.admin.businessApprovals.colStatus")}</th>
              <th className="px-5 py-3 font-medium">{t("dashboard.admin.businessApprovals.colRegistered")}</th>
              <th className="px-5 py-3 font-medium text-right">
                {t("dashboard.admin.businessApprovals.colActions")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {loading ? (
              <TableEmptyRow icon={Loader2} message={t("dashboard.admin.businessApprovals.loading")} colSpan={5} spin />
            ) : users.length === 0 ? (
              <TableEmptyRow icon={Building2} message={t("dashboard.admin.businessApprovals.empty")} colSpan={5} />
            ) : (
              users.map((user) => {
                const isPending = pendingId === user._id;
                const phone = describeSomaliPhone(user.phone);
                const status = user.businessApproval ?? "PENDING";

                return (
                  <tr key={user._id} className="align-middle transition-colors hover:bg-zinc-50/60">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                          <Building2 className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="font-medium text-zinc-900">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-xs text-zinc-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-zinc-900">{phone.formatted}</p>
                      {phone.provider && (
                        <span className="mt-1 inline-block">
                          <Badge tone="zinc">{phone.provider}</Badge>
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={statusTones[status]}>{statusLabels[status]}</Badge>
                    </td>
                    <td className="px-5 py-3 text-zinc-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="secondary"
                          className="px-3 py-1.5 text-xs"
                          disabled={isPending || status === "APPROVED"}
                          loading={isPending}
                          onClick={() => handleDecision(user, "APPROVED")}
                        >
                          {t("dashboard.admin.businessApprovals.approve")}
                        </Button>
                        <Button
                          variant="secondary"
                          className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                          disabled={isPending || status === "REJECTED"}
                          loading={isPending}
                          onClick={() => handleDecision(user, "REJECTED")}
                        >
                          {t("dashboard.admin.businessApprovals.reject")}
                        </Button>
                      </div>
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
          label={t("dashboard.admin.businessApprovals.pageOf", {
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
