import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/api-server";
import { ReportUserForm } from "@/components/dashboard/report-user-form";

export default async function ReportUserPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/dashboard/report");
  }

  return <ReportUserForm />;
}
