"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AuthCard } from "@/components/ui/auth-card";
import { Field } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { useLanguage } from "@/components/language-provider";
import * as api from "@/lib/api-client";

type Status = "verifying" | "success" | "error";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { t } = useLanguage();

  const [status, setStatus] = useState<Status>(token ? "verifying" : "error");
  const [message, setMessage] = useState<string | null>(null);
  const [resendEmail, setResendEmail] = useState("");
  const [resendSent, setResendSent] = useState(false);

  useEffect(() => {
    if (!token) return;

    api
      .verifyEmail(token)
      .then(() => setStatus("success"))
      .catch((err) => {
        setStatus("error");
        setMessage(err instanceof api.ApiClientError ? err.message : "Unable to verify this link.");
      });
  }, [token]);

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.resendVerification(resendEmail);
    } finally {
      setResendSent(true);
    }
  }

  if (status === "verifying") {
    return (
      <AuthCard title={t("auth.verifyEmail.verifyingTitle")}>
        <Alert variant="info">{t("auth.verifyEmail.verifyingBody")}</Alert>
      </AuthCard>
    );
  }

  if (status === "success") {
    return (
      <AuthCard title={t("auth.verifyEmail.successTitle")}>
        <Alert variant="success">{t("auth.verifyEmail.successBody")}</Alert>
        <Link href="/login" className="mt-6 block">
          <Button className="w-full">{t("auth.verifyEmail.goToLogin")}</Button>
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title={t("auth.verifyEmail.invalidTitle")} subtitle={t("auth.verifyEmail.invalidSubtitle")}>
      {message && <Alert variant="error">{message}</Alert>}

      {resendSent ? (
        <Alert variant="success">{t("auth.verifyEmail.resentBody")}</Alert>
      ) : (
        <form onSubmit={handleResend} className="mt-4 flex flex-col gap-4">
          <Field
            label={t("auth.verifyEmail.email")}
            type="email"
            name="email"
            required
            value={resendEmail}
            onChange={(e) => setResendEmail(e.target.value)}
          />
          <Button type="submit" className="w-full">
            {t("auth.verifyEmail.resendSubmit")}
          </Button>
        </form>
      )}
    </AuthCard>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
