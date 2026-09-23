import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/api-server";
import { AdminOverview } from "@/components/dashboard/admin-overview";

export default async function AdminOverviewPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/dashboard/admin");
  }

  return <AdminOverview currentUser={user} />;
}
