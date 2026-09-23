"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthCard } from "@/components/ui/auth-card";
import { Field } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { useLanguage } from "@/components/language-provider";
import * as api from "@/lib/api-client";
import type { ReportReason } from "@/lib/types";

export function ReportUserForm() {
  const { t } = useLanguage();

  const reasons: { value: ReportReason; label: string }[] = [
    { value: "SCAM_OR_FRAUD", label: t("reportForm.reasonScamOrFraud") },
    { value: "HARASSMENT", label: t("reportForm.reasonHarassment") },
    { value: "SUSPICIOUS_ACTIVITY", label: t("reportForm.reasonSuspiciousActivity") },
    { value: "FAKE_LISTING", label: t("reportForm.reasonFakeListing") },
    { value: "OTHER", label: t("reportForm.reasonOther") },
  ];

  const [reportedEmail, setReportedEmail] = useState("");
  const [reason, setReason] = useState<ReportReason>("SUSPICIOUS_ACTIVITY");
  const [details, setDetails] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.createReport({ reportedEmail, reason, details });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof api.ApiClientError ? err.message : "Unable to submit this report right now.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <AuthCard title={t("reportForm.submittedTitle")}>
        <Alert variant="success">{t("reportForm.submittedBody")}</Alert>
        <Link href="/dashboard" className="mt-6 block">
          <Button className="w-full">{t("reportForm.backToDashboard")}</Button>
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title={t("reportForm.title")} subtitle={t("reportForm.subtitle")}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <Alert variant="error">{error}</Alert>}

        <Field
          label={t("reportForm.theirEmail")}
          type="email"
          name="reportedEmail"
          required
          value={reportedEmail}
          onChange={(e) => setReportedEmail(e.target.value)}
        />

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-zinc-700">{t("reportForm.reason")}</span>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value as ReportReason)}
            className="rounded-xl border border-zinc-200 px-3.5 py-2.5 text-zinc-900 outline-none transition-colors focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
          >
            {reasons.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-zinc-700">{t("reportForm.details")}</span>
          <textarea
            required
            minLength={10}
            maxLength={1000}
            rows={5}
            placeholder={t("reportForm.detailsPlaceholder")}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            className="rounded-xl border border-zinc-200 px-3.5 py-2.5 text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
          />
        </label>

        <Button type="submit" loading={loading} className="mt-2 w-full">
          {t("reportForm.submit")}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        <Link href="/dashboard" className="font-medium text-rose-600 hover:text-rose-700">
          {t("reportForm.backToDashboard")}
        </Link>
      </p>
    </AuthCard>
  );
}
