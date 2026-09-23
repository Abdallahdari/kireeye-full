import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Pagination as PaginationInfo } from "@/lib/api-client";

export function PaginationFooter({
  pagination,
  page,
  onPageChange,
  label,
  previousLabel,
  nextLabel,
}: {
  pagination: PaginationInfo;
  page: number;
  onPageChange: (page: number) => void;
  label: string;
  previousLabel: string;
  nextLabel: string;
}) {
  if (pagination.pages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-zinc-100 px-5 py-4">
      <p className="text-sm text-zinc-500">{label}</p>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          className="gap-1 px-3 py-1.5 text-xs"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          {previousLabel}
        </Button>
        <Button
          variant="secondary"
          className="gap-1 px-3 py-1.5 text-xs"
          disabled={page >= pagination.pages}
          onClick={() => onPageChange(Math.min(pagination.pages, page + 1))}
        >
          {nextLabel}
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
