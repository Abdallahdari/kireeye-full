import { cn } from "@/lib/cn";

export function Alert({
  variant = "error",
  children,
}: {
  variant?: "error" | "success" | "info";
  children: React.ReactNode;
}) {
  const styles = {
    error: "bg-red-50 text-red-700 border-red-100",
    success: "bg-emerald-50 text-emerald-700 border-emerald-100",
    info: "bg-amber-50 text-amber-800 border-amber-100",
  } as const;

  return (
    <div className={cn("rounded-xl border px-4 py-3 text-sm font-medium", styles[variant])} role="status">
      {children}
    </div>
  );
}
