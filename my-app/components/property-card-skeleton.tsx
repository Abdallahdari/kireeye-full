import { cn } from "@/lib/cn";

function Bone({ className }: { className?: string }) {
  return <span className={cn("block animate-pulse rounded-md bg-zinc-200/80 motion-reduce:animate-none", className)} />;
}

/** Placeholder with the same shape as <PropertyCard>, shown while listings load. */
export function PropertyCardSkeleton() {
  return (
    <div aria-hidden className="flex flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm">
      <Bone className="aspect-[4/3] w-full rounded-none" />

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-col gap-2">
          <Bone className="h-6 w-2/5" />
          <Bone className="h-3 w-1/3" />
          <Bone className="mt-1 h-5 w-3/5" />
          <div className="mt-1 flex gap-3">
            <Bone className="h-4 w-20" />
            <Bone className="h-4 w-20" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Bone className="h-3 w-full" />
          <Bone className="h-3 w-full" />
          <Bone className="h-3 w-2/3" />
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-zinc-100 pt-3">
          <Bone className="h-3 w-1/4" />
          <Bone className="h-4 w-20" />
        </div>
      </div>
    </div>
  );
}

/** A grid of card skeletons matching the listings grid. */
export function PropertyGridSkeleton({
  count = 6,
  className = "grid gap-6 sm:grid-cols-2 lg:grid-cols-3",
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div role="status" aria-busy className={className}>
      {Array.from({ length: count }, (_, i) => (
        <PropertyCardSkeleton key={i} />
      ))}
    </div>
  );
}
