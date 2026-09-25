import type { Metadata } from "next";
import { BlogList } from "@/components/blog-list";

export const metadata: Metadata = {
  title: "Blog — Kireeye",
  description: "Renting tips, neighborhood guides and news from the Kireeye team.",
};

export default function BlogPage() {
  return (
    <div className="flex-1 bg-zinc-50/60 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <BlogList />
      </div>
    </div>
  );
}
