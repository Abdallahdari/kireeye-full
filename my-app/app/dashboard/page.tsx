import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/api-server";
import { DashboardView } from "./dashboard-view";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  if (user.role === "SUPER_ADMIN") {
    redirect("/dashboard/admin");
  }

  if (user.role === "BUSINESS") {
    redirect("/dashboard/business");
  }

  return <DashboardView user={user} />;
}
