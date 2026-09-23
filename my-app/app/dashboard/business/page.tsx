import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/api-server";
import { BusinessOverview } from "@/components/dashboard/business-overview";

export default async function BusinessOverviewPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/dashboard/business");
  }

  return <BusinessOverview user={user} />;
}
