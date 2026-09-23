import type { Metadata } from "next";
import { Suspense } from "react";
import { PropertiesHeader } from "./properties-header";
import { PropertyBrowser } from "@/components/property-browser";

export const metadata: Metadata = {
  title: "Properties for rent — Stayly",
  description: "Browse homes and apartments for rent posted by verified businesses.",
};

export default function PropertiesPage() {
  return (
    <div className="flex-1 bg-zinc-50/60 px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <PropertiesHeader />
        {/* useSearchParams inside PropertyBrowser needs a Suspense boundary. */}
        <Suspense>
          <PropertyBrowser />
        </Suspense>
      </div>
    </div>
  );
}
