import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getArchive } from "@/lib/data";
import { EmptyState } from "@/components/content/empty-state";
import { formatDate, type PublicPost } from "@/components/content/content-types";
import { PageIntro } from "@/components/site/page-intro";

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
    <main id="main-content">
      <PageIntro
        eyebrow="时间索引"
        title="文章归档"
        description={`按时间保存判断如何变化。这里共有 ${total} 篇公开文章。`}
        actions={
          <>
            <Link href="/categories">分类</Link>
            <Link href="/tags">标签</Link>
          </>
        }
      />

      <div className="mx-auto max-w-[1180px] px-[var(--page-gutter)] pb-[clamp(5rem,10vw,9rem)]">
        {archive.length ? (
          <div className="space-y-16">
            {archive.map((group) => (
              <section key={group.year} aria-labelledby={`year-${group.year}`} className="grid gap-8 md:grid-cols-12">
                <div className="md:col-span-3">
                  <h2 id={`year-${group.year}`} className="text-[clamp(3rem,7vw,6rem)] font-black tracking-[-.08em] text-[color:var(--ink)/.18] md:sticky md:top-24">
                    {group.year}
                  </h2>
                </div>
                <ol className="garden-panel overflow-hidden px-5 md:col-span-9 md:px-7">
                  {group.posts.map((post) => (
                    <li key={post.id} className="border-t border-[var(--line)]">
                      <Link href={`/blog/${post.slug}`} className="group grid gap-3 py-7 sm:grid-cols-[7rem_1fr_auto] sm:items-center">
                        <time className="font-mono text-xs text-[var(--muted)]" dateTime={post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined}>
                          {formatDate(post.publishedAt, false)}
                        </time>
                        <div>
                    <h3 className="text-xl font-semibold tracking-[-.035em] group-hover:text-[var(--accent)]">{post.title}</h3>
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
          <div>
            <EmptyState title="归档仍是空的" description="公开文章发布后，会按年份出现在这里。" href="/blog" action="返回文章页" />
          </div>
        )}
      </div>
    </main>
  );
}
