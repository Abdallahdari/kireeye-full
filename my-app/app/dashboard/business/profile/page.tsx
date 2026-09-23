import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/api-server";
import { ProfileCard } from "@/components/dashboard/profile-card";

export default async function BusinessProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/dashboard/business/profile");
  }

  return (
    <div className="max-w-md">
      <ProfileCard user={user} />
    </div>
  );
}
