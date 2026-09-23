import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/api-server";
import { RegisterForm } from "./register-form";

export default async function RegisterPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return <RegisterForm />;
}
