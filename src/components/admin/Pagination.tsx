import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

type PaginationProps = {
  page: number;
  pageCount: number;
  searchParams?: Record<string, string | undefined>;
};

function pageHref(
  page: number,
  searchParams: Record<string, string | undefined>,
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value) params.set(key, value);
  }
  params.set("page", String(page));
  return `?${params.toString()}`;
}

export function Pagination({
  page,
  pageCount,
  searchParams = {},
}: PaginationProps) {
  if (pageCount <= 1) return null;

  return (
    <nav
      aria-label="分页"
      className="mt-7 flex items-center justify-between border-t border-[var(--line)] pt-5"
    >
      {page > 1 ? (
        <Link
          className="inline-flex min-h-11 items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          href={pageHref(page - 1, searchParams)}
        >
          <ChevronLeft aria-hidden="true" size={17} />
          上一页
        </Link>
      ) : (
        <span />
      )}
      <span className="font-mono text-xs text-[var(--muted)]">
        {String(page).padStart(2, "0")} / {String(pageCount).padStart(2, "0")}
      </span>
      {page < pageCount ? (
        <Link
          className="inline-flex min-h-11 items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          href={pageHref(page + 1, searchParams)}
        >
          下一页
          <ChevronRight aria-hidden="true" size={17} />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
