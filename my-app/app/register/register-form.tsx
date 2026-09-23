"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthCard } from "@/components/ui/auth-card";
import { Field } from "@/components/ui/input";
import { PhoneField } from "@/components/ui/phone-field";
import { CitySelect } from "@/components/ui/city-select";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { useLanguage } from "@/components/language-provider";
import { cn } from "@/lib/cn";
import * as api from "@/lib/api-client";
import type { RegisterInput } from "@/lib/api-client";
import { SOMALI_NATIONAL_NUMBER_LENGTH } from "@/lib/somali-phone";

export function RegisterForm() {
  const { t } = useLanguage();

  const roles: { value: RegisterInput["role"]; title: string; description: string }[] = [
    { value: "TENANT", title: t("auth.register.roleTenantTitle"), description: t("auth.register.roleTenantDesc") },
    {
      value: "BUSINESS",
      title: t("auth.register.roleBusinessTitle"),
      description: t("auth.register.roleBusinessDesc"),
    },
  ];

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    city: "",
    password: "",
    role: "TENANT" as RegisterInput["role"],
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.phone.length !== SOMALI_NATIONAL_NUMBER_LENGTH) {
      setError(t("auth.register.phoneIncomplete"));
      return;
    }
    if (!form.city) {
      setError(t("auth.register.cityRequired"));
      return;
    }

    setLoading(true);
    try {
      await api.register({ ...form, phone: `+252${form.phone}` });
      setSubmittedEmail(form.email);
    } catch (err) {
      setError(err instanceof api.ApiClientError ? err.message : "Unable to register right now.");
    } finally {
      setLoading(false);
    }
  }

  if (submittedEmail) {
    return (
      <AuthCard title={t("auth.register.checkInboxTitle")}>
        <Alert variant="success">{t("auth.register.checkInboxBody", { email: submittedEmail })}</Alert>
        {form.role === "BUSINESS" && (
          <div className="mt-3">
            <Alert variant="info">{t("auth.register.businessPendingNote")}</Alert>
          </div>
        )}
        <Link href="/login" className="mt-6 block">
          <Button className="w-full">{t("auth.register.goToLogin")}</Button>
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title={t("auth.register.title")} subtitle={t("auth.register.subtitle")}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <Alert variant="error">{error}</Alert>}

        <div className="grid grid-cols-2 gap-3">
          {roles.map((role) => (
            <button
              key={role.value}
              type="button"
              onClick={() => update("role", role.value)}
              className={cn(
                "rounded-xl border p-3 text-left transition-colors",
                form.role === role.value
                  ? "border-rose-500 bg-rose-50"
                  : "border-zinc-200 hover:border-zinc-300"
              )}
            >
              <p className="text-sm font-semibold text-zinc-900">{role.title}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{role.description}</p>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field
            label={t("auth.register.firstName")}
            name="firstName"
            required
            value={form.firstName}
            onChange={(e) => update("firstName", e.target.value)}
          />
          <Field
            label={t("auth.register.lastName")}
            name="lastName"
            required
            value={form.lastName}
            onChange={(e) => update("lastName", e.target.value)}
          />
        </div>

        <Field
          label={t("auth.register.email")}
          type="email"
          name="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
        />
        <PhoneField
          label={t("auth.register.phone")}
          required
          value={form.phone}
          onChange={(digits) => update("phone", digits)}
        />
        <CitySelect
          label={form.role === "BUSINESS" ? t("auth.register.cityBusiness") : t("auth.register.cityTenant")}
          placeholder={t("auth.register.cityPlaceholder")}
          required
          value={form.city}
          onChange={(city) => update("city", city)}
        />
        <Field
          label={t("auth.register.password")}
          type="password"
          name="password"
          autoComplete="new-password"
          required
          value={form.password}
          onChange={(e) => update("password", e.target.value)}
        />
        <p className="-mt-2 text-xs text-zinc-400">{t("auth.register.passwordHint")}</p>

        <Button type="submit" loading={loading} className="mt-2 w-full">
          {t("auth.register.submit")}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        {t("auth.register.haveAccount")}{" "}
        <Link href="/login" className="font-medium text-rose-600 hover:text-rose-700">
          {t("auth.register.logIn")}
        </Link>
      </p>
    </AuthCard>
  );
}
