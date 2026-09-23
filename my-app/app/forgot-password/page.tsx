"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthCard } from "@/components/ui/auth-card";
import { Field } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { useLanguage } from "@/components/language-provider";
import * as api from "@/lib/api-client";

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof api.ApiClientError ? err.message : "Unable to send reset link right now.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <AuthCard title={t("auth.forgotPassword.sentTitle")}>
        <Alert variant="success">{t("auth.forgotPassword.sentBody")}</Alert>
        <Link href="/login" className="mt-6 block">
          <Button className="w-full">{t("auth.forgotPassword.backToLogin")}</Button>
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title={t("auth.forgotPassword.title")} subtitle={t("auth.forgotPassword.subtitle")}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <Alert variant="error">{error}</Alert>}

        <Field
          label={t("auth.forgotPassword.email")}
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Button type="submit" loading={loading} className="mt-2 w-full">
          {t("auth.forgotPassword.submit")}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        {t("auth.forgotPassword.rememberedIt")}{" "}
        <Link href="/login" className="font-medium text-rose-600 hover:text-rose-700">
          {t("auth.forgotPassword.logIn")}
        </Link>
      </p>
    </AuthCard>
  );
}
