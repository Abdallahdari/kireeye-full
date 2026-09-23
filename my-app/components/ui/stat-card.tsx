import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/cn";

type Tone = "zinc" | "rose" | "violet" | "emerald" | "amber";

const toneStyles: Record<Tone, string> = {
  zinc: "bg-zinc-100 text-zinc-700",
  rose: "bg-rose-100 text-rose-700",
  violet: "bg-violet-100 text-violet-700",
  emerald: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-800",
};

export function StatCard({
  icon: Icon,
  tone = "zinc",
  label,
  value,
  hint,
  trend,
  className,
}: {
  icon: LucideIcon;
  tone?: Tone;
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  trend?: { value: string; direction: "up" | "down" };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm shadow-zinc-900/[0.02] transition-shadow hover:shadow-md",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-500">{label}</p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight text-zinc-900">
            {value === undefined || value === null ? (
              <span className="inline-block h-7 w-16 animate-pulse rounded-md bg-zinc-100" />
            ) : (
              value
            )}
          </p>
        </div>
        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", toneStyles[tone])}>
          <Icon className="h-5 w-5" />
        </span>
      </div>

      {(hint || trend) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 font-semibold",
                trend.direction === "up" ? "text-emerald-600" : "text-rose-600"
              )}
            >
              {trend.direction === "up" ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}
              {trend.value}
            </span>
          )}
          {hint && <span className="text-zinc-400">{hint}</span>}
        </div>
      )}
    </div>
  );
}
