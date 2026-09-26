"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AuthCard } from "@/components/ui/auth-card";
import { Field } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { useAuth } from "@/components/auth-provider";
import { useLanguage } from "@/components/language-provider";
import * as api from "@/lib/api-client";

function LoginFormFields() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();
  const { t } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { user } = await api.login(email, password);
      setUser(user);
      router.push(safeNextPath(searchParams.get("next")));
      router.refresh();
    } catch (err) {
      setError(err instanceof api.ApiClientError ? err.message : "Unable to log in right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title={t("auth.login.title")} subtitle={t("auth.login.subtitle")}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <Alert variant="error">{error}</Alert>}

        <Field
          label={t("auth.login.email")}
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Field
          label={t("auth.login.password")}
          type="password"
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm font-medium text-rose-600 hover:text-rose-700">
            {t("auth.login.forgotPassword")}
          </Link>
        </div>

        <Button type="submit" loading={loading} className="mt-2 w-full">
          {t("auth.login.submit")}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        {t("auth.login.noAccount")}{" "}
        <Link href="/register" className="font-medium text-rose-600 hover:text-rose-700">
          {t("auth.login.signUp")}
        </Link>
      </p>
    </AuthCard>
  );
}

export function LoginForm() {
  return (
    <Suspense>
      <LoginFormFields />
    </Suspense>
  );
}

/** Only same-site paths ("/x"), never "//evil.site", "/\\evil.site" or "https://…". */
function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "/dashboard";
  return next;
}
