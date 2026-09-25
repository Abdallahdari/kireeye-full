import { LogoMark } from "@/components/logo";

/** Shown while a route's server data loads during navigation. */
export default function Loading() {
  return (
    <div role="status" aria-label="Loading" className="flex flex-1 items-center justify-center px-6 py-32">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <span className="absolute inset-0 animate-spin rounded-full border-4 border-rose-100 border-t-rose-600 motion-reduce:animate-none" />
        <LogoMark className="h-9 w-9" />
      </div>
    </div>
  );
}
