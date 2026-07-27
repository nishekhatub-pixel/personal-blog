import Link from "next/link";

export default function ArticleNotFound() {
  return (
    <main id="main-content" className="grid min-h-[70dvh] place-items-center px-5 text-center">
      <div>
        <p className="font-mono text-sm text-[var(--success)]">404 / POST</p>
        <h1 className="mt-4 text-5xl font-semibold tracking-[-.06em]">这篇文章没有找到</h1>
        <p className="mt-4 text-[var(--muted)]">它可能还没有发布，或者已经移动到新的位置。</p>
        <Link href="/blog" className="mt-8 inline-flex min-h-11 items-center rounded-full bg-[var(--accent)] px-6 font-semibold text-[var(--accent-ink)]">
          返回文章列表
        </Link>
      </div>
    </main>
  );
}
