"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";
import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="grid min-h-[60dvh] place-items-center" aria-labelledby="admin-error-title">
      <div className="max-w-lg border-y border-[var(--line)] py-10 text-center">
        <TriangleAlert
          aria-hidden="true"
          className="mx-auto mb-5 text-[var(--danger)]"
          size={30}
          strokeWidth={1.4}
        />
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--danger)]">
          Admin request failed
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]" id="admin-error-title">
          这次操作没有完成
        </h1>
        <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
          数据库拒绝了请求，或提交内容没有通过校验。原有数据不会被静默覆盖。
        </p>
        <button
          className="mx-auto mt-7 inline-flex min-h-11 items-center gap-2 bg-[var(--ink)] px-5 text-sm text-[var(--canvas)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          onClick={reset}
          type="button"
        >
          <RotateCcw aria-hidden="true" size={16} />
          重新加载
        </button>
        {error.digest ? (
          <p className="mt-5 font-mono text-[10px] text-[var(--muted)]">
            TRACE {error.digest}
          </p>
        ) : null}
      </div>
    </section>
  );
}
