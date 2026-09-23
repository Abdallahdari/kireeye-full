"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, BadgeCheck, Download, Gift, Loader2, Search, Users, Wallet } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FilterPills } from "@/components/ui/filter-pills";
import { PaginationFooter } from "@/components/ui/pagination";
import { TableEmptyRow } from "@/components/ui/empty-state";
import { billingStatusTones } from "@/components/dashboard/business-billing";
import { useLanguage } from "@/components/language-provider";
import * as api from "@/lib/api-client";
import { formatUsd } from "@/lib/format";
import { describeSomaliPhone } from "@/lib/somali-phone";
import type { BillingStatus, BillingTotals, BusinessBillingRow } from "@/lib/types";

const PAGE_SIZE = 20;

export function AdminBilling() {
  const { t } = useLanguage();
  const [status, setStatus] = useState<BillingStatus | "ALL">("ALL");
  const [draftQ, setDraftQ] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<BusinessBillingRow[]>([]);
  const [totals, setTotals] = useState<BillingTotals | null>(null);
  const [pagination, setPagination] = useState<api.Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const filters = { q: q.trim() || undefined, status: status === "ALL" ? undefined : status };

  useEffect(() => {
    let cancelled = false;
    api
      .listBillingBusinesses({ q: q.trim() || undefined, status: status === "ALL" ? undefined : status, page, limit: PAGE_SIZE })
      .then((result) => {
        if (cancelled) return;
        setRows(result.businesses);
        setTotals(result.totals);
        setPagination(result.pagination);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof api.ApiClientError ? err.message : t("billing.errorLoad"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [q, status, page, refreshIndex, t]);

  function changeStatus(value: BillingStatus | "ALL") {
    setStatus(value);
    setPage(1);
  }

  async function handleExport() {
    setExporting(true);
    setError(null);
    try {
      await api.exportBilling(filters);
    } catch (err) {
      setError(err instanceof api.ApiClientError ? err.message : t("listings.admin.exportError"));
    } finally {
      setExporting(false);
    }
  }

  async function handleRecord(row: BusinessBillingRow) {
    setSavingId(row._id);
    setError(null);
    setSuccess(null);
    try {
      const { payment } = await api.recordManualPayment(row._id, note.trim());
      setSuccess(
        t("billing.admin.recorded", {
          name: `${row.firstName} ${row.lastName}`,
          date: payment.periodEnd ? new Date(payment.periodEnd).toLocaleDateString() : "",
        })
      );
      setConfirmId(null);
      setNote("");
      setRefreshIndex((i) => i + 1);
    } catch (err) {
      setError(err instanceof api.ApiClientError ? err.message : t("billing.payFailed"));
    } finally {
      setSavingId(null);
    }
  }

  const statusFilters: { label: string; value: BillingStatus | "ALL" }[] = [
    { label: t("billing.admin.filterAll"), value: "ALL" },
    { label: t("billing.status.PAID"), value: "PAID" },
    { label: t("billing.status.UNPAID"), value: "UNPAID" },
    { label: t("billing.status.FREE"), value: "FREE" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={BadgeCheck} tone="emerald" label={t("billing.admin.paidCount")} value={totals?.paid} />
        <StatCard
          icon={AlertTriangle}
          tone="amber"
          label={t("billing.admin.unpaidCount")}
          value={totals?.unpaid}
          hint={t("billing.admin.unpaidHint")}
        />
        <StatCard icon={Gift} tone="zinc" label={t("billing.admin.freeCount")} value={totals?.free} />
        <StatCard
          icon={Wallet}
          tone="violet"
          label={t("billing.admin.revenueMonth")}
          value={totals ? formatUsd(totals.revenueThisMonth) : undefined}
          hint={totals ? t("billing.admin.revenueTotal", { total: formatUsd(totals.revenueTotal) }) : undefined}
        />
      </div>

      <Card padded={false}>
        <div className="flex flex-col gap-4 border-b border-zinc-100 p-5">
          <CardHeader
            title={t("billing.admin.title")}
            subtitle={t("billing.admin.subtitle")}
            actions={
              <Button variant="secondary" onClick={handleExport} loading={exporting} disabled={pagination?.total === 0}>
                <Download className="h-4 w-4" />
                {filters.q || filters.status ? t("listings.admin.exportFiltered") : t("listings.admin.exportAll")}
              </Button>
            }
          />
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <FilterPills options={statusFilters} value={status} onChange={changeStatus} />
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setQ(draftQ);
                setPage(1);
              }}
              className="relative w-full lg:w-80"
            >
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="search"
                value={draftQ}
                onChange={(e) => setDraftQ(e.target.value)}
                placeholder={t("billing.admin.searchPlaceholder")}
                aria-label={t("billing.admin.searchPlaceholder")}
                className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-3.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
              />
            </form>
          </div>
        </div>

        {(error || success) && (
          <div className="p-5 pb-0">
            {error ? <Alert variant="error">{error}</Alert> : <Alert variant="success">{success}</Alert>}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-xs uppercase tracking-wide text-zinc-400">
                <th className="px-5 py-3 font-medium">{t("billing.admin.colBusiness")}</th>
                <th className="px-5 py-3 font-medium">{t("billing.admin.colPhone")}</th>
                <th className="px-5 py-3 font-medium">{t("billing.colStatus")}</th>
                <th className="px-5 py-3 font-medium">{t("billing.admin.colListings")}</th>
                <th className="px-5 py-3 font-medium">{t("billing.totalPaid")}</th>
                <th className="px-5 py-3 font-medium">{t("billing.admin.colPaidUntil")}</th>
                <th className="px-5 py-3 text-right font-medium">{t("billing.admin.colActions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {loading ? (
                <TableEmptyRow icon={Loader2} message={t("common.loading")} colSpan={7} spin />
              ) : rows.length === 0 ? (
                <TableEmptyRow icon={Users} message={t("billing.admin.empty")} colSpan={7} />
              ) : (
                rows.map((row) => {
                  const phone = describeSomaliPhone(row.phone);
                  const isConfirming = confirmId === row._id;
                  return (
                    <tr key={row._id} className="align-top transition-colors hover:bg-zinc-50/60">
                      <td className="px-5 py-3">
                        <p className="font-medium text-zinc-900">
                          {row.firstName} {row.lastName}
                        </p>
                        <p className="text-xs text-zinc-500">{row.email}</p>
                        {row.city && <p className="text-xs text-zinc-400">{row.city}</p>}
                      </td>
                      <td className="px-5 py-3">
                        <p className="whitespace-nowrap text-zinc-900">{phone.formatted}</p>
                        {phone.provider && <p className="text-xs text-zinc-400">{phone.provider}</p>}
                      </td>
                      <td className="px-5 py-3">
                        <Badge tone={billingStatusTones[row.status]}>{t(`billing.status.${row.status}`)}</Badge>
                        {!row.isActive && <p className="mt-1 text-xs text-red-600">{t("common.statusSuspended")}</p>}
                      </td>
                      <td className="px-5 py-3 text-zinc-700">
                        <p>{t("billing.admin.publishedCount", { count: row.listingsPublished })}</p>
                        <p className="text-xs text-zinc-400">
                          {t("billing.admin.currentCount", { count: row.currentListings })}
                          {row.hiddenListings > 0 && (
                            <span className="text-amber-700"> · {t("billing.admin.hiddenCount", { count: row.hiddenListings })}</span>
                          )}
                        </p>
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-zinc-900">{formatUsd(row.totalPaid)}</p>
                        <p className="text-xs text-zinc-400">
                          {t("billing.admin.paymentsCount", { count: row.paymentsCount })}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-zinc-600">
                        {row.subscriptionPaidUntil ? new Date(row.subscriptionPaidUntil).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {isConfirming ? (
                          <div className="ml-auto flex w-56 flex-col gap-2">
                            <input
                              value={note}
                              onChange={(e) => setNote(e.target.value)}
                              maxLength={500}
                              placeholder={t("billing.admin.notePlaceholder")}
                              className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                            />
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="secondary"
                                className="px-3 py-1.5 text-xs"
                                disabled={savingId === row._id}
                                onClick={() => setConfirmId(null)}
                              >
                                {t("listings.form.cancel")}
                              </Button>
                              <Button
                                className="px-3 py-1.5 text-xs"
                                loading={savingId === row._id}
                                onClick={() => handleRecord(row)}
                              >
                                {t("billing.admin.confirmRecord", { price: formatUsd(totals?.monthlyPriceUsd) })}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            variant="secondary"
                            className="whitespace-nowrap px-3 py-1.5 text-xs"
                            onClick={() => {
                              setConfirmId(row._id);
                              setNote("");
                            }}
                          >
                            {t("billing.admin.recordPayment")}
                          </Button>
                        )}
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
            label={t("billing.admin.pageOf", { page: pagination.page, pages: pagination.pages, total: pagination.total })}
            previousLabel={t("common.previous")}
            nextLabel={t("common.next")}
          />
        )}
      </Card>
    </div>
  );
}
