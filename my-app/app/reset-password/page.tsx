"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AuthCard } from "@/components/ui/auth-card";
import { Field } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { useLanguage } from "@/components/language-provider";
import * as api from "@/lib/api-client";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { t } = useLanguage();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError(t("auth.resetPassword.missingTokenError"));
      return;
    }
    if (password !== confirm) {
      setError(t("auth.resetPassword.passwordMismatch"));
      return;
    }

    setLoading(true);
    try {
      await api.resetPassword(token, password);
      setDone(true);
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      setError(err instanceof api.ApiClientError ? err.message : "Unable to reset your password right now.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <AuthCard title={t("auth.resetPassword.successTitle")}>
        <Alert variant="success">{t("auth.resetPassword.successBody")}</Alert>
      </AuthCard>
    );
  }

  return (
    <AuthCard title={t("auth.resetPassword.title")}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <Alert variant="error">{error}</Alert>}
        {!token && <Alert variant="info">{t("auth.resetPassword.missingTokenNotice")}</Alert>}

        <Field
          label={t("auth.resetPassword.newPassword")}
          type="password"
          name="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Field
          label={t("auth.resetPassword.confirmPassword")}
          type="password"
          name="confirm"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />

        <Button type="submit" loading={loading} className="mt-2 w-full">
          {t("auth.resetPassword.submit")}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        <Link href="/login" className="font-medium text-rose-600 hover:text-rose-700">
          {t("auth.resetPassword.backToLogin")}
        </Link>
      </p>
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
