"use client";

import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface PaginationBarProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (limit: number) => void;
}

export default function PaginationBar({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}: PaginationBarProps) {
  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
      {/* Items count & Per-page selector */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted font-medium">
        <span>
          Showing <strong className="text-foreground">{startItem}</strong> to{" "}
          <strong className="text-foreground">{endItem}</strong> of{" "}
          <strong className="text-foreground">{totalItems}</strong> products
        </span>

        <div className="flex items-center gap-1.5 pl-3 border-l border-zinc-200 dark:border-zinc-800">
          <span>Show:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-velina-rose cursor-pointer"
          >
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
          </select>
        </div>
      </div>

      {/* Numeric Page Buttons */}
      <div className="flex items-center gap-1.5">
        {/* First Page */}
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(1)}
          className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-surface text-muted hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          title="First page"
        >
          <ChevronsLeft size={14} />
        </button>

        {/* Prev Page */}
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-surface text-muted hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          title="Previous page"
        >
          <ChevronLeft size={14} />
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((p, idx) => {
            if (p === "...") {
              return (
                <span key={`ellipsis-${idx}`} className="px-2 py-1 text-xs text-muted font-bold">
                  ...
                </span>
              );
            }

            const isCurrent = p === currentPage;
            return (
              <button
                key={`page-${p}`}
                type="button"
                onClick={() => onPageChange(Number(p))}
                className={`min-w-[34px] h-[34px] rounded-xl text-xs font-black transition-all flex items-center justify-center ${
                  isCurrent
                    ? "bg-velina-rose text-white shadow-xs shadow-velina-rose/40 scale-105"
                    : "border border-zinc-200 dark:border-zinc-800 bg-surface text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-surface text-muted hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          title="Next page"
        >
          <ChevronRight size={14} />
        </button>

        {/* Last Page */}
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(totalPages)}
          className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-surface text-muted hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          title="Last page"
        >
          <ChevronsRight size={14} />
        </button>
      </div>
    </div>
  );
}
