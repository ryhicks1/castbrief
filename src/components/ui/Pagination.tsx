"use client";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 pt-6">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="px-3 py-1.5 text-sm rounded-md border border-[#2A2D35] bg-[#1E2128] text-[#E8E3D8] disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#B8964C] transition-colors"
      >
        Previous
      </button>
      <span className="text-sm text-[#8B8D93] px-3">
        Page {page} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="px-3 py-1.5 text-sm rounded-md border border-[#2A2D35] bg-[#1E2128] text-[#E8E3D8] disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#B8964C] transition-colors"
      >
        Next
      </button>
    </div>
  );
}
