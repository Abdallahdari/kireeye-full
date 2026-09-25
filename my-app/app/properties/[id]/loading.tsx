function Bone({ className }: { className: string }) {
  return <span className={`block animate-pulse rounded-md bg-zinc-200/80 motion-reduce:animate-none ${className}`} />;
}

/** Skeleton for a single listing page, shaped like <PropertyDetail>. */
export default function Loading() {
  return (
    <div role="status" aria-busy className="flex-1 px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <Bone className="h-4 w-24" />
        <Bone className="h-9 w-2/3 sm:w-1/2" />

        <div className="flex flex-col gap-3">
          <Bone className="aspect-[16/10] w-full rounded-2xl sm:aspect-[16/8]" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }, (_, i) => (
              <Bone key={i} className="h-16 w-24 rounded-lg" />
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }, (_, i) => (
                <Bone key={i} className="h-24 rounded-2xl" />
              ))}
            </div>
            <div className="flex flex-col gap-2 rounded-2xl border border-zinc-100 bg-white p-6">
              <Bone className="h-5 w-40" />
              <Bone className="mt-2 h-3 w-full" />
              <Bone className="h-3 w-full" />
              <Bone className="h-3 w-5/6" />
              <Bone className="h-3 w-2/3" />
            </div>
          </div>
          <div className="flex flex-col gap-3 rounded-2xl border border-zinc-100 bg-white p-6">
            <Bone className="h-9 w-1/2" />
            <Bone className="h-4 w-1/3" />
            <Bone className="mt-4 h-3 w-20" />
            <Bone className="h-5 w-2/3" />
            <Bone className="h-5 w-1/2" />
            <Bone className="mt-2 h-11 w-full rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
