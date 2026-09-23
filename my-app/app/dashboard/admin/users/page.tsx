import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/api-server";
import { ManageUsers } from "@/components/dashboard/manage-users";

export default async function AdminUsersPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/dashboard/admin/users");
  }

  return <ManageUsers currentUser={user} />;
}
