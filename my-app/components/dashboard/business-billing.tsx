"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarClock, CreditCard, EyeOff, Home, Loader2, Receipt, Smartphone, Wallet } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PhoneField } from "@/components/ui/phone-field";
import { TableEmptyRow } from "@/components/ui/empty-state";
import { useAuth } from "@/components/auth-provider";
import { useLanguage } from "@/components/language-provider";
import * as api from "@/lib/api-client";
import { formatUsd } from "@/lib/format";
import { SOMALI_NATIONAL_NUMBER_LENGTH, describeSomaliPhone, toSomaliNationalDigits } from "@/lib/somali-phone";
import type { BillingStatus, BillingSummary, Payment, PaymentStatus } from "@/lib/types";

const POLL_INTERVAL_MS = 3000;

export const billingStatusTones: Record<BillingStatus, "emerald" | "amber" | "zinc"> = {
  PAID: "emerald",
  UNPAID: "amber",
  FREE: "zinc",
};

const paymentStatusTones: Record<PaymentStatus, "emerald" | "amber" | "rose"> = {
  SUCCEEDED: "emerald",
  PENDING: "amber",
  FAILED: "rose",
};

export function BusinessBilling() {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [billing, setBilling] = useState<BillingSummary | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [phone, setPhone] = useState(() => (user ? toSomaliNationalDigits(user.phone) : ""));
  const [starting, setStarting] = useState(false);
  // The payment we're waiting on the customer to approve on their phone.
  const [pending, setPending] = useState<Payment | null>(null);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const { billing } = await api.getMyBilling();
      setBilling(billing);
      setLoadError(null);
      return billing;
    } catch (err) {
      setLoadError(err instanceof api.ApiClientError ? err.message : t("billing.errorLoad"));
      return null;
    }
  }, [t]);

  useEffect(() => {
    let cancelled = false;
    api
      .getMyBilling()
      .then(({ billing }) => {
        if (cancelled) return;
        setBilling(billing);
        // Resume waiting if the page was reloaded mid-payment.
        if (billing.pendingPayment) setPending(billing.pendingPayment);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof api.ApiClientError ? err.message : t("billing.errorLoad"));
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  const pendingId = pending?._id;
  useEffect(() => {
    if (!pendingId) return;
    let cancelled = false;

    const timer = setInterval(async () => {
      try {
        const { payment } = await api.getPayment(pendingId);
        if (cancelled || payment.status === "PENDING") return;
        clearInterval(timer);
        setPending(null);
        setResult(
          payment.status === "SUCCEEDED"
            ? {
                ok: true,
                message: t("billing.paySuccess", {
                  date: payment.periodEnd ? new Date(payment.periodEnd).toLocaleDateString() : "",
                }),
              }
            : { ok: false, message: payment.responseMessage ?? t("billing.payFailed") }
        );
        load();
      } catch {
        // Transient network error — keep polling.
      }
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [pendingId, load, t]);

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    if (phone.length !== SOMALI_NATIONAL_NUMBER_LENGTH) {
      setResult({ ok: false, message: t("listings.form.errorPhone") });
      return;
    }
    setStarting(true);
    try {
      const { payment } = await api.startPayment(`+252${phone}`);
      setPending(payment);
    } catch (err) {
      setResult({ ok: false, message: err instanceof api.ApiClientError ? err.message : t("billing.payFailed") });
    } finally {
      setStarting(false);
    }
  }

  if (loadError && !billing) {
    return <Alert variant="error">{loadError}</Alert>;
  }

  if (!billing) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-zinc-400">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="text-sm">{t("common.loading")}</span>
      </div>
    );
  }

  const price = formatUsd(billing.monthlyPriceUsd);
  const statusLabel = t(`billing.status.${billing.status}`);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={CreditCard}
          tone={billingStatusTones[billing.status]}
          label={t("billing.statusLabel")}
          value={statusLabel}
          hint={
            billing.status === "PAID"
              ? t("billing.paidUntil", { date: new Date(billing.subscriptionPaidUntil!).toLocaleDateString() })
              : billing.status === "UNPAID"
                ? t("billing.cannotPublish")
                : t("billing.freeRemaining", { count: billing.freeListingsRemaining })
          }
        />
        <StatCard
          icon={Home}
          tone="zinc"
          label={t("billing.listingsPublished")}
          value={billing.listingsPublished}
          hint={t("billing.freeOf", { limit: billing.freeListingLimit })}
        />
        <StatCard
          icon={EyeOff}
          tone={billing.hiddenListings > 0 ? "amber" : "zinc"}
          label={t("billing.hiddenListings")}
          value={billing.hiddenListings}
          hint={t("billing.ofCurrent", { count: billing.currentListings })}
        />
        <StatCard icon={Wallet} tone="violet" label={t("billing.totalPaid")} value={formatUsd(billing.totalPaid)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader
            title={billing.status === "PAID" ? t("billing.extendTitle") : t("billing.payTitle")}
            subtitle={t("billing.paySubtitle", { price, limit: billing.freeListingLimit })}
          />

          <div className="mt-5 flex flex-col gap-4">
            {result && <Alert variant={result.ok ? "success" : "error"}>{result.message}</Alert>}

            {!billing.paymentsEnabled ? (
              <Alert variant="info">{t("billing.paymentsDisabled")}</Alert>
            ) : pending ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
                <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white text-amber-700 shadow-sm">
                  <Smartphone className="h-6 w-6" />
                  <span className="absolute inset-0 animate-ping rounded-full border-2 border-amber-300" />
                </span>
                <p className="font-semibold text-amber-900">{t("billing.approveTitle")}</p>
                <p className="text-sm text-amber-800">
                  {t("billing.approveBody", {
                    price: formatUsd(pending.amount),
                    phone: describeSomaliPhone(pending.phone ?? "").formatted,
                  })}
                </p>
                <Loader2 className="h-5 w-5 animate-spin text-amber-700" />
              </div>
            ) : (
              <form onSubmit={handlePay} className="flex flex-col gap-4">
                <PhoneField label={t("billing.walletNumber")} value={phone} onChange={setPhone} required />
                <p className="-mt-2 text-xs text-zinc-500">{t("billing.walletHint")}</p>
                <Button type="submit" loading={starting} className="w-full">
                  {t("billing.payButton", { price })}
                </Button>
                {billing.testMode && <Alert variant="info">{t("billing.testMode")}</Alert>}
              </form>
            )}
          </div>
        </Card>

        <Card padded={false} className="lg:col-span-3">
          <div className="border-b border-zinc-100 p-5">
            <CardHeader title={t("billing.historyTitle")} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-xs uppercase tracking-wide text-zinc-400">
                  <th className="px-5 py-3 font-medium">{t("billing.colDate")}</th>
                  <th className="px-5 py-3 font-medium">{t("billing.colAmount")}</th>
                  <th className="px-5 py-3 font-medium">{t("billing.colStatus")}</th>
                  <th className="px-5 py-3 font-medium">{t("billing.colPeriod")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {billing.payments.length === 0 ? (
                  <TableEmptyRow icon={Receipt} message={t("billing.noPayments")} colSpan={4} />
                ) : (
                  billing.payments.map((p) => (
                    <tr key={p._id} className="align-top">
                      <td className="px-5 py-3 text-zinc-700">
                        {new Date(p.createdAt).toLocaleDateString()}
                        <p className="text-xs text-zinc-400">
                          {p.method === "MANUAL" ? t("billing.methodManual") : t("billing.methodWallet")}
                        </p>
                      </td>
                      <td className="px-5 py-3 font-medium text-zinc-900">{formatUsd(p.amount)}</td>
                      <td className="px-5 py-3">
                        <Badge tone={paymentStatusTones[p.status]}>{t(`billing.paymentStatus.${p.status}`)}</Badge>
                        {p.status === "FAILED" && p.responseMessage && (
                          <p className="mt-1 max-w-[16rem] text-xs text-zinc-500">{p.responseMessage}</p>
                        )}
                      </td>
                      <td className="px-5 py-3 text-zinc-600">
                        {p.periodStart && p.periodEnd ? (
                          <span className="flex items-center gap-1.5">
                            <CalendarClock className="h-3.5 w-3.5 text-zinc-400" />
                            {new Date(p.periodStart).toLocaleDateString()} – {new Date(p.periodEnd).toLocaleDateString()}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
