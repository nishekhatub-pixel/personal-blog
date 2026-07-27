import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getArchive } from "@/lib/data";
import { EmptyState } from "@/components/content/empty-state";
import { formatDate, type PublicPost } from "@/components/content/content-types";

export const metadata: Metadata = {
  title: "文章归档",
  description: "按年份回看 R7 的公开文章与学习轨迹。",
  alternates: { canonical: "/archive" },
};
export const dynamic = "force-dynamic";

export default async function ArchivePage() {
  const archive = (await getArchive()) as { year: number; posts: PublicPost[] }[];
  const total = archive.reduce((sum, group) => sum + group.posts.length, 0);

  return (
    <main id="main-content" className="px-[clamp(1rem,4vw,4rem)] pb-[clamp(5rem,10vw,9rem)] pt-[clamp(4rem,10vw,9rem)]">
      <div className="mx-auto max-w-[1180px]">
        <header className="grid gap-7 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <h1 className="text-[clamp(3.6rem,9vw,8rem)] font-black leading-[.88] tracking-[-.08em]">归档</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--muted)]">按时间保存判断如何变化。共 {total} 篇公开文章。</p>
          </div>
          <div className="flex gap-5 text-sm font-semibold lg:col-span-3 lg:col-start-10">
            <Link href="/categories">分类</Link>
            <Link href="/tags">标签</Link>
          </div>
        </header>

        {archive.length ? (
          <div className="mt-20 space-y-20">
            {archive.map((group) => (
              <section key={group.year} aria-labelledby={`year-${group.year}`} className="grid gap-8 md:grid-cols-12">
                <div className="md:col-span-3">
                  <h2 id={`year-${group.year}`} className="sticky top-24 text-[clamp(3rem,7vw,6rem)] font-black tracking-[-.08em] text-[color:var(--ink)/.18]">
                    {group.year}
                  </h2>
                </div>
                <ol className="md:col-span-9">
                  {group.posts.map((post) => (
                    <li key={post.id} className="border-t border-[var(--line)]">
                      <Link href={`/blog/${post.slug}`} className="group grid gap-3 py-7 sm:grid-cols-[7rem_1fr_auto] sm:items-center">
                        <time className="font-mono text-xs text-[var(--muted)]" dateTime={post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined}>
                          {formatDate(post.publishedAt, false)}
                        </time>
                        <div>
                          <h3 className="text-xl font-semibold tracking-[-.035em] group-hover:text-[var(--success)]">{post.title}</h3>
                          <p className="mt-1 text-sm text-[var(--muted)]">{post.category.name} · {post.readingMinutes} 分钟</p>
                        </div>
                        <ArrowUpRight className="hidden sm:block" aria-hidden size={19} strokeWidth={1.7} />
                      </Link>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
        ) : (
          <div className="mt-16">
            <EmptyState title="归档仍是空的" description="公开文章发布后，会按年份出现在这里。" href="/blog" action="返回文章页" />
          </div>
        )}
      </div>
    </main>
  );
}
