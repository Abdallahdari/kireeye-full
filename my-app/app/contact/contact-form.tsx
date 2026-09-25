"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { CircleCheck } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { useAuth } from "@/components/auth-provider";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";
import * as api from "@/lib/api-client";

const TOPICS: api.ContactTopic[] = ["GENERAL", "RENTING", "LISTING", "BILLING", "SUPPORT"];

function isTopic(value: string | null): value is api.ContactTopic {
  return TOPICS.includes(value as api.ContactTopic);
}

const inputClass =
  "rounded-xl border border-zinc-200 px-3.5 py-2.5 text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100";

export function ContactForm() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const topicParam = searchParams.get("topic");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setSubmitting(true);
    setError(null);
    try {
      await api.sendContactMessage({
        name: String(data.get("name") ?? ""),
        email: String(data.get("email") ?? ""),
        phone: String(data.get("phone") ?? "") || undefined,
        topic: String(data.get("topic")) as api.ContactTopic,
        message: String(data.get("message") ?? ""),
      });
      form.reset();
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="mt-8 flex flex-col items-start rounded-xl border border-emerald-200 bg-emerald-50 p-6">
        <CircleCheck aria-hidden className="h-7 w-7 text-emerald-600" />
        <p className="mt-3 max-w-sm font-medium text-emerald-900">{t("contact.success")}</p>
        <Button variant="secondary" className="mt-6" onClick={() => setSent(false)}>
          {t("contact.sendAnother")}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
      {error && <Alert>{error}</Alert>}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label={t("contact.name")}
          name="name"
          required
          minLength={2}
          maxLength={100}
          autoComplete="name"
          placeholder={t("contact.namePlaceholder")}
          defaultValue={user ? `${user.firstName} ${user.lastName}` : undefined}
        />
        <Field
          label={t("contact.email")}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          defaultValue={user?.email}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label={t("contact.phone")}
          name="phone"
          type="tel"
          maxLength={30}
          autoComplete="tel"
          placeholder="+252 61 234 5678"
          defaultValue={user?.phone}
        />
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-zinc-700">{t("contact.topic")}</span>
          <select
            name="topic"
            // Keyed so a ?topic= change (e.g. from the navbar) re-applies the default.
            key={topicParam ?? "GENERAL"}
            defaultValue={isTopic(topicParam) ? topicParam : "GENERAL"}
            className={`${inputClass} bg-white`}
          >
            {TOPICS.map((topic) => (
              <option key={topic} value={topic}>
                {t(`contact.topic${topic}`)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-zinc-700">{t("contact.message")}</span>
        <textarea
          name="message"
          required
          minLength={10}
          maxLength={2000}
          rows={6}
          placeholder={t("contact.messagePlaceholder")}
          className={`${inputClass} resize-y`}
        />
      </label>

      <Button
        type="submit"
        loading={submitting}
        className="self-start px-6 py-3"
      >
        {submitting ? t("contact.sending") : t("contact.send")}
      </Button>
    </form>
  );
}
