import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export function EmptyState({
  icon: Icon,
  title,
  description,
  badge,
  action,
  className,
}: {
  icon: LucideIcon;
  title: React.ReactNode;
  description?: React.ReactNode;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-10 text-center",
        className
      )}
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-rose-600 shadow-sm">
        <Icon className="h-6 w-6" />
      </span>
      <p className="mt-4 font-semibold text-zinc-900">{title}</p>
      {description && <p className="mt-2 max-w-sm text-sm text-zinc-500">{description}</p>}
      {badge && (
        <span className="mt-5 rounded-full bg-zinc-200 px-3.5 py-1.5 text-xs font-semibold text-zinc-600">
          {badge}
        </span>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function TableEmptyRow({
  icon: Icon,
  message,
  colSpan,
  spin,
}: {
  icon: LucideIcon;
  message: string;
  colSpan: number;
  spin?: boolean;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-5 py-12 text-center">
        <div className="flex flex-col items-center gap-2 text-zinc-400">
          <Icon className={cn("h-6 w-6", spin && "animate-spin")} />
          <span className="text-sm">{message}</span>
        </div>
      </td>
    </tr>
  );
}
