import { Lock } from "lucide-react";
import { cn } from "@/lib/cn";

export type ChartTone = "zinc" | "rose" | "violet" | "emerald" | "amber";

const toneHex: Record<ChartTone, string> = {
  zinc: "#a1a1aa",
  rose: "#f43f5e",
  violet: "#8b5cf6",
  emerald: "#10b981",
  amber: "#f59e0b",
};

const toneDot: Record<ChartTone, string> = {
  zinc: "bg-zinc-400",
  rose: "bg-rose-500",
  violet: "bg-violet-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
};

export interface ChartDatum {
  label: string;
  value: number;
  tone: ChartTone;
}

export function DonutChart({
  data,
  centerLabel,
  centerValue,
  size = 160,
}: {
  data: ChartDatum[];
  centerLabel?: string;
  centerValue?: React.ReactNode;
  size?: number;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" width={size} height={size} className="-rotate-90">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#f4f4f5" strokeWidth="12" />
          {total > 0 &&
            data
              .filter((d) => d.value > 0)
              .map((d) => {
                const fraction = d.value / total;
                const dash = fraction * circumference;
                const gap = circumference - dash;
                const dashoffset = -offset;
                offset += dash;
                return (
                  <circle
                    key={d.label}
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    stroke={toneHex[d.tone]}
                    strokeWidth="12"
                    strokeDasharray={`${dash} ${gap}`}
                    strokeDashoffset={dashoffset}
                    strokeLinecap="butt"
                  />
                );
              })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold text-zinc-900">{centerValue ?? total}</span>
          {centerLabel && <span className="text-xs text-zinc-400">{centerLabel}</span>}
        </div>
      </div>

      <ul className="flex w-full flex-col gap-2.5">
        {data.map((d) => (
          <li key={d.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-zinc-600">
              <span className={cn("h-2.5 w-2.5 rounded-full", toneDot[d.tone])} />
              {d.label}
            </span>
            <span className="font-semibold text-zinc-900">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BarList({ data }: { data: ChartDatum[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <ul className="flex flex-col gap-3.5">
      {data.map((d) => (
        <li key={d.label}>
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-600">{d.label}</span>
            <span className="font-semibold text-zinc-900">{d.value}</span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-zinc-100">
            <div
              className={cn("h-full rounded-full transition-all", toneDot[d.tone])}
              style={{ width: `${Math.max(4, (d.value / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Decorative, non-data faded bars used behind locked/upcoming analytics panels. */
function GhostBars() {
  const heights = [30, 55, 40, 70, 50, 65, 35];
  return (
    <div className="flex h-24 w-full items-end gap-2 px-2">
      {heights.map((h, i) => (
        <div key={i} className="flex-1 rounded-t-md bg-zinc-200" style={{ height: `${h}%` }} />
      ))}
    </div>
  );
}

export function LockedAnalyticsPanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-6">
      <div className="opacity-40">
        <GhostBars />
      </div>
      <div className="mt-2 flex flex-col items-center text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-zinc-400 shadow-sm">
          <Lock className="h-5 w-5" />
        </span>
        <p className="mt-3 font-semibold text-zinc-900">{title}</p>
        <p className="mt-1 max-w-sm text-sm text-zinc-500">{description}</p>
      </div>
    </div>
  );
}
