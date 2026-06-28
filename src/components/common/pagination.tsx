"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
};

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false,
}: PaginationProps) {
  if (totalPages === 0) {
    return null;
  }

  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  const pageNumbers: (number | "...")[] = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
  } else {
    pageNumbers.push(1);

    if (currentPage > 3) {
      pageNumbers.push("...");
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pageNumbers.push(i);
    }

    if (currentPage < totalPages - 2) {
      pageNumbers.push("...");
    }

    pageNumbers.push(totalPages);
  }

  return (
    <div className="flex items-center justify-center gap-1">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!hasPrev || isLoading}
        className="inline-flex size-7 items-center justify-center rounded border border-border bg-surface-1 transition hover:border-cyan/30 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Previous page"
      >
        <ChevronLeft className="size-3.5 text-muted-foreground" />
      </button>

      {pageNumbers.map((pageNum, index) => {
        if (pageNum === "...") {
          return (
            <span
              key={`ellipsis-${index}`}
              className="label-mono px-1 text-[10px] text-muted-foreground"
            >
              …
            </span>
          );
        }

        const isActive = pageNum === currentPage;

        return (
          <button
            key={pageNum}
            type="button"
            onClick={() => onPageChange(pageNum as number)}
            disabled={isLoading}
            className={`inline-flex size-7 items-center justify-center rounded border text-[10px] transition label-mono ${
              isActive
                ? "border-cyan/40 bg-cyan/10 text-cyan-ice"
                : "border-border bg-surface-1 text-muted-foreground hover:border-cyan/30 hover:text-cyan-ice disabled:cursor-not-allowed disabled:opacity-50"
            }`}
          >
            {pageNum}
          </button>
        );
      })}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasNext || isLoading}
        className="inline-flex size-7 items-center justify-center rounded border border-border bg-surface-1 transition hover:border-cyan/30 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Next page"
      >
        <ChevronRight className="size-3.5 text-muted-foreground" />
      </button>
    </div>
  );
}
