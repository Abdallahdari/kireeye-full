"use client";

import { CalendarCheck } from "lucide-react";
import { ComingSoonPanel } from "@/components/dashboard/coming-soon-panel";
import { useLanguage } from "@/components/language-provider";

export default function BusinessBookingsPage() {
  const { t } = useLanguage();

  return (
    <ComingSoonPanel
      icon={CalendarCheck}
      title={t("dashboard.business.bookingsTitle")}
      description={t("dashboard.business.bookingsBody")}
    />
  );
}
