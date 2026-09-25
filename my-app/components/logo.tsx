import { cn } from "@/lib/cn";

export const BRAND_NAME = "Kireeye";

/**
 * The Kireeye mark: an arched doorway (after the carved doors of Hamar Weyne)
 * with a keyhole cut out of it. One solid colour, so it holds up at favicon size.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("h-8 w-8 shrink-0 text-rose-600", className)}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M5 30V15C5 8.9 9.9 4 16 4s11 4.9 11 11v15H5Zm11-16.2a2.7 2.7 0 0 0-1.35 5.04L14 23.5h4l-.65-4.66A2.7 2.7 0 0 0 16 13.8Z"
      />
    </svg>
  );
}

/** Mark + lowercase "kireeye" wordmark. `tone` picks the text colour for light or dark backgrounds. */
export function Logo({
  tone = "dark",
  showName = true,
  className,
  markClassName,
  nameClassName,
}: {
  tone?: "dark" | "light";
  showName?: boolean;
  className?: string;
  markClassName?: string;
  nameClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark className={markClassName} />
      {showName && (
        <span
          className={cn(
            "text-[1.35rem] font-semibold leading-none tracking-[-0.035em]",
            tone === "dark" ? "text-[#16202B]" : "text-white",
            nameClassName,
          )}
        >
          kireeye
        </span>
      )}
    </span>
  );
}
