import type { Metadata } from "next";
import Link from "next/link";
import { getTags } from "@/lib/data";
import { EmptyState } from "@/components/content/empty-state";
import type { Taxonomy } from "@/components/content/content-types";

export const metadata: Metadata = {
  title: "内容标签",
  description: "浏览 R7 文章与项目之间交叉出现的技术和主题标签。",
  alternates: { canonical: "/tags" },
};
export const dynamic = "force-dynamic";

export default async function TagsPage() {
  const tags = (await getTags()) as Taxonomy[];
  const maxCount = Math.max(1, ...tags.map((tag) => (tag._count?.posts || 0) + (tag._count?.projects || 0)));

  return (
    <main id="main-content" className="px-[clamp(1rem,4vw,4rem)] py-[clamp(4rem,10vw,9rem)]">
      <div className="mx-auto max-w-[1180px]">
        <header className="grid gap-7 lg:grid-cols-12 lg:items-end">
          <h1 className="text-[clamp(3.5rem,9vw,8rem)] font-black leading-[.88] tracking-[-.08em] lg:col-span-8">标签</h1>
          <p className="max-w-md leading-7 text-[var(--muted)] lg:col-span-4">连接文章与项目的细粒度线索。字号只表达内容数量，不表达能力高低。</p>
        </header>
        {tags.length ? (
          <ul className="mt-20 flex flex-wrap items-baseline gap-x-7 gap-y-8" aria-label="全部标签">
            {tags.map((tag) => {
              const count = (tag._count?.posts || 0) + (tag._count?.projects || 0);
              const size = 1.05 + (count / maxCount) * 2.2;
              return (
                <li key={tag.slug}>
                  <Link
                    href={`/blog?tag=${tag.slug}`}
                    className="group inline-flex items-baseline gap-2 font-semibold tracking-[-.045em] hover:text-[var(--success)]"
                    style={{ fontSize: `${size}rem` }}
                  >
                    {tag.name}
                    <span className="font-mono text-[.7rem] font-normal text-[var(--muted)]">{count}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="mt-16"><EmptyState title="还没有标签" description="文章和项目使用标签后，跨内容的线索会出现在这里。" /></div>
        )}
      </div>
    </main>
  );
}
