import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";

function makeHref(page: number, searchParams: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value) params.set(key, value);
  }
  if (page > 1) params.set("page", String(page));
  return `?${params.toString()}`;
}

export function Pagination({
  page,
  totalPages,
  searchParams = {},
}: {
  page: number;
  totalPages: number;
  searchParams?: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;
  const visible = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (value) => value === 1 || value === totalPages || Math.abs(value - page) <= 1,
  );

  return (
    <nav className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--line)] pt-6" aria-label="分页">
      {page > 1 ? (
        <Link href={makeHref(page - 1, searchParams)} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--line)] px-5 font-semibold">
          <ArrowLeft aria-hidden size={17} /> 上一页
        </Link>
      ) : (
        <span className="inline-flex min-h-11 items-center rounded-full border border-[var(--line)] px-5 text-[var(--muted)] opacity-50">上一页</span>
      )}
      <div className="flex items-center gap-1">
        {visible.map((value, index) => (
          <span key={value} className="contents">
            {index > 0 && value - visible[index - 1] > 1 ? <span className="px-2 text-[var(--muted)]">…</span> : null}
            <Link
              href={makeHref(value, searchParams)}
              aria-current={value === page ? "page" : undefined}
              className={`grid size-10 place-items-center rounded-full text-sm font-semibold ${
                value === page ? "bg-[var(--accent)] text-[var(--accent-ink)]" : "hover:bg-[var(--surface-strong)]"
              }`}
            >
              {value}
            </Link>
          </span>
        ))}
      </div>
      {page < totalPages ? (
        <Link href={makeHref(page + 1, searchParams)} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--line)] px-5 font-semibold">
          下一页 <ArrowRight aria-hidden size={17} />
        </Link>
      ) : (
        <span className="inline-flex min-h-11 items-center rounded-full border border-[var(--line)] px-5 text-[var(--muted)] opacity-50">下一页</span>
      )}
    </nav>
  );
}
