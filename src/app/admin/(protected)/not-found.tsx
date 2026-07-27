import { ArrowLeft, SearchX } from "lucide-react";
import Link from "next/link";

export default function AdminNotFound() {
  return (
    <section
      aria-labelledby="admin-not-found-title"
      className="grid min-h-[60dvh] place-items-center"
    >
      <div className="max-w-lg border-y border-[var(--line)] py-10 text-center">
        <SearchX
          aria-hidden="true"
          className="mx-auto mb-5 text-[var(--accent)]"
          size={31}
          strokeWidth={1.4}
        />
        <p className="font-mono text-xs text-[var(--accent)]">404 / ADMIN</p>
        <h1
          className="mt-3 text-3xl font-semibold tracking-[-0.04em]"
          id="admin-not-found-title"
        >
          没有找到这条记录
        </h1>
        <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
          它可能已被删除，或地址中的标识已经失效。
        </p>
        <Link
          className="mt-7 inline-flex min-h-11 items-center gap-2 bg-[var(--ink)] px-5 text-sm text-[var(--canvas)]"
          href="/admin"
        >
          <ArrowLeft aria-hidden="true" size={16} />
          返回后台概览
        </Link>
      </div>
    </section>
  );
}
