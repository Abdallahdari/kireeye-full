import { PropertyGridSkeleton } from "@/components/property-card-skeleton";

/** Shown while navigating to /properties. */
export default function Loading() {
  return (
    <div className="flex-1 bg-zinc-50/60 px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-col gap-2">
          <span className="block h-9 w-64 animate-pulse rounded-md bg-zinc-200/80" />
          <span className="block h-4 w-80 max-w-full animate-pulse rounded-md bg-zinc-200/80" />
        </div>
        <span className="block h-16 w-full animate-pulse rounded-2xl bg-zinc-200/60" />
        <PropertyGridSkeleton />
      </div>
    </div>
  );
}
