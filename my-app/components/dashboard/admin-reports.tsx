"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ExternalLink, Flag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { FilterPills } from "@/components/ui/filter-pills";
import { PaginationFooter } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { useLanguage } from "@/components/language-provider";
import * as api from "@/lib/api-client";
import type { Report, ReportReason, ReportStatus } from "@/lib/types";

const statusTones: Record<ReportStatus, "amber" | "emerald" | "zinc"> = {
  OPEN: "amber",
  RESOLVED: "emerald",
  DISMISSED: "zinc",
};

const PAGE_SIZE = 10;

export function AdminReports() {
  const { t } = useLanguage();
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "ALL">("OPEN");
  const [page, setPage] = useState(1);
  const [reports, setReports] = useState<Report[]>([]);
  const [pagination, setPagination] = useState<api.Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const statusLabels: Record<ReportStatus, string> = {
    OPEN: t("dashboard.admin.reports.filterOpen"),
    RESOLVED: t("dashboard.admin.reports.filterResolved"),
    DISMISSED: t("dashboard.admin.reports.filterDismissed"),
  };

  const reasonLabels: Record<ReportReason, string> = {
    SCAM_OR_FRAUD: t("dashboard.admin.reports.reasonScamOrFraud"),
    HARASSMENT: t("dashboard.admin.reports.reasonHarassment"),
    SUSPICIOUS_ACTIVITY: t("dashboard.admin.reports.reasonSuspiciousActivity"),
    FAKE_LISTING: t("dashboard.admin.reports.reasonFakeListing"),
    OTHER: t("dashboard.admin.reports.reasonOther"),
  };

  const statusFilters: { label: string; value: ReportStatus | "ALL" }[] = [
    { label: t("dashboard.admin.reports.filterOpen"), value: "OPEN" },
    { label: t("dashboard.admin.reports.filterResolved"), value: "RESOLVED" },
    { label: t("dashboard.admin.reports.filterDismissed"), value: "DISMISSED" },
    { label: t("dashboard.admin.reports.filterAll"), value: "ALL" },
  ];

  useEffect(() => {
    let cancelled = false;

    api
      .listReports({ status: statusFilter === "ALL" ? undefined : statusFilter, page, limit: PAGE_SIZE })
      .then((result) => {
        if (cancelled) return;
        setReports(result.reports);
        setPagination(result.pagination);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof api.ApiClientError ? err.message : "Unable to load reports right now.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [statusFilter, page, refreshIndex]);

  function changeFilter(value: ReportStatus | "ALL") {
    setStatusFilter(value);
    setPage(1);
  }

  async function handleStatusChange(report: Report, status: ReportStatus) {
    if (status === report.status) return;
    setPendingId(report._id);
    setError(null);
    try {
      await api.updateReportStatus(report._id, status);
      setRefreshIndex((i) => i + 1);
    } catch (err) {
      setError(err instanceof api.ApiClientError ? err.message : "Unable to update this report.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <Card padded={false}>
      <div className="border-b border-zinc-100 p-5">
        <CardHeader
          title={t("dashboard.admin.reports.title")}
          subtitle={t("dashboard.admin.reports.subtitle")}
          actions={<FilterPills options={statusFilters} value={statusFilter} onChange={changeFilter} />}
        />
      </div>

      {error && (
        <div className="p-5 pb-0">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center gap-2 px-5 py-14 text-zinc-400">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-sm">{t("dashboard.admin.reports.loading")}</span>
        </div>
      ) : reports.length === 0 ? (
        <div className="p-5">
          <EmptyState icon={Flag} title={t("dashboard.admin.reports.empty")} />
        </div>
      ) : (
        <ul className="divide-y divide-zinc-50">
          {reports.map((report) => {
            const isPending = pendingId === report._id;

            return (
              <li key={report._id} className="flex flex-col gap-3 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={statusTones[report.status]}>{statusLabels[report.status]}</Badge>
                      <Badge tone="violet">{reasonLabels[report.reason]}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-zinc-900">
                      <span className="font-medium">
                        {report.reporter.firstName} {report.reporter.lastName}
                      </span>{" "}
                      <span className="text-zinc-500">({report.reporter.email})</span>{" "}
                      {t("dashboard.admin.reports.reportedVerb")}{" "}
                      <span className="font-medium">
                        {report.reportedUser.firstName} {report.reportedUser.lastName}
                      </span>{" "}
                      <span className="text-zinc-500">({report.reportedUser.email})</span>
                    </p>
                    {report.property && (
                      <Link
                        href={`/properties/${report.property._id}`}
                        target="_blank"
                        className="mt-2 flex w-fit items-center gap-2.5 rounded-xl border border-zinc-100 p-1.5 pr-3 text-sm text-zinc-700 hover:border-rose-200 hover:bg-rose-50"
                      >
                        {report.property.images[0] && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={report.property.images[0]} alt="" className="h-9 w-12 rounded-lg object-cover" />
                        )}
                        <span>
                          <span className="block text-xs text-zinc-400">{t("dashboard.admin.reports.reportedListing")}</span>
                          <span className="font-medium">
                            {report.property.neighborhood}, {report.property.city}
                          </span>
                        </span>
                        <ExternalLink className="h-3.5 w-3.5 text-zinc-400" />
                      </Link>
                    )}
                    <p className="mt-1 text-xs text-zinc-400">
                      {new Date(report.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <Button
                      variant="secondary"
                      className="px-3 py-1.5 text-xs"
                      disabled={isPending || report.status === "RESOLVED"}
                      loading={isPending}
                      onClick={() => handleStatusChange(report, "RESOLVED")}
                    >
                      {t("dashboard.admin.reports.markResolved")}
                    </Button>
                    <Button
                      variant="secondary"
                      className="px-3 py-1.5 text-xs"
                      disabled={isPending || report.status === "DISMISSED"}
                      loading={isPending}
                      onClick={() => handleStatusChange(report, "DISMISSED")}
                    >
                      {t("dashboard.admin.reports.dismiss")}
                    </Button>
                  </div>
                </div>

                <p className="rounded-xl bg-zinc-50 p-3 text-sm text-zinc-700">{report.details}</p>
              </li>
            );
          })}
        </ul>
      )}

      {pagination && (
        <PaginationFooter
          pagination={pagination}
          page={page}
          onPageChange={setPage}
          label={t("dashboard.admin.reports.pageOf", {
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
