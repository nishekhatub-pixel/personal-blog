import { Archive, ArrowUpRight, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getCategories, getPublishedPosts } from "@/lib/data";
import { EmptyState } from "@/components/content/empty-state";
import { formatDate, type PublicPost, type Taxonomy } from "@/components/content/content-types";
import { MediaFrame } from "@/components/content/media-frame";
import { Pagination } from "@/components/content/pagination";
import { PostCard } from "@/components/content/post-card";

export const metadata: Metadata = {
  title: "文章",
  description: "R7 关于前端、后端、工程实践、学习方法与生活观察的中文文章。",
  alternates: { canonical: "/blog" },
};
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const raw = await searchParams;
  const category = valueOf(raw.category);
  const tag = valueOf(raw.tag);
  const query = valueOf(raw.q)?.trim();
  const page = Math.max(1, Number(valueOf(raw.page)) || 1);
  const [result, categoryRows] = await Promise.all([
    getPublishedPosts({ category, tag, query, page, pageSize: 7 }),
    getCategories(),
  ]);
  const posts = result.items as PublicPost[];
  const categories = categoryRows as Taxonomy[];
  const lead = posts[0];
  const rest = posts.slice(1);

  return (
    <main id="main-content">
      <header className="px-[clamp(1rem,4vw,4rem)] pb-12 pt-[clamp(4rem,10vw,9rem)]">
        <div className="mx-auto grid max-w-[1400px] gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <h1 className="text-[clamp(4rem,10vw,9rem)] font-black leading-[.85] tracking-[-.08em]">文章</h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[var(--muted)]">
              从一个问题开始，留下查找、试错、判断和复盘。这里共有 {result.total} 篇公开记录。
            </p>
          </div>
          <Link href="/archive" className="inline-flex w-fit items-center gap-2 font-semibold lg:col-span-3 lg:col-start-10">
            <Archive aria-hidden size={18} strokeWidth={1.7} /> 按时间查看归档
          </Link>
        </div>
      </header>

      <section className="border-y border-[var(--line)] px-[clamp(1rem,4vw,4rem)] py-7" aria-label="文章筛选">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <nav className="flex max-w-full gap-2 overflow-x-auto pb-1" aria-label="按分类筛选">
            <Link
              href={query ? `/blog?q=${encodeURIComponent(query)}` : "/blog"}
              aria-current={!category && !tag ? "page" : undefined}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold ${
                !category && !tag ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--success)]" : "border-[var(--line)]"
              }`}
            >
              全部
            </Link>
            {categories.map((item) => (
              <Link
                key={item.slug}
                href={`/blog?category=${encodeURIComponent(item.slug)}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
                aria-current={category === item.slug ? "page" : undefined}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold ${
                  category === item.slug ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--success)]" : "border-[var(--line)]"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
          <form action="/blog" role="search" className="relative w-full lg:max-w-sm">
            {category ? <input type="hidden" name="category" value={category} /> : null}
            {tag ? <input type="hidden" name="tag" value={tag} /> : null}
            <label htmlFor="blog-search" className="sr-only">搜索文章</label>
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" aria-hidden size={18} />
            <input
              id="blog-search"
              name="q"
              type="search"
              defaultValue={query}
              className="min-h-12 w-full rounded-full border border-[var(--line)] bg-[var(--surface)] pl-11 pr-4 outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
              placeholder="搜索标题、摘要和正文"
            />
          </form>
        </div>
      </section>

      <section className="px-[clamp(1rem,4vw,4rem)] py-[clamp(4rem,10vw,9rem)]">
        <div className="mx-auto max-w-[1400px]">
          {lead ? (
            <>
              <PostCard post={lead} featured priority />
              {rest.length ? (
                <div className="mt-20">
                  <h2 className="text-3xl font-semibold tracking-[-.05em]">继续阅读</h2>
                  <div className="mt-8">
                    {rest.map((post, index) => (
                      <article key={post.id} className="group grid gap-6 border-t border-[var(--line)] py-8 md:grid-cols-12 md:items-center">
                        <div className="md:col-span-2">
                          <time className="font-mono text-xs text-[var(--muted)]" dateTime={post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined}>
                            {formatDate(post.publishedAt)}
                          </time>
                        </div>
                        <Link href={`/blog/${post.slug}`} className="md:col-span-7">
                          <p className="text-xs font-semibold text-[var(--success)]">{post.category.name} · {post.readingMinutes} 分钟</p>
                          <h3 className="mt-2 text-[clamp(1.5rem,2.4vw,2.25rem)] font-semibold leading-[1.1] tracking-[-.045em] group-hover:text-[var(--success)]">
                            {post.title}
                            <ArrowUpRight className="ml-2 inline-block opacity-0 transition-opacity group-hover:opacity-100" aria-hidden size={19} />
                          </h3>
                          <p className="mt-3 line-clamp-2 leading-7 text-[var(--muted)]">{post.excerpt}</p>
                        </Link>
                        <Link href={`/blog/${post.slug}`} className="hidden md:col-span-3 md:block" tabIndex={-1} aria-hidden>
                          <MediaFrame src={post.coverImage} alt="" title={post.title} ratio={index % 2 ? "wide" : "landscape"} />
                        </Link>
                      </article>
                    ))}
                  </div>
                </div>
              ) : null}
              <Pagination
                page={result.page}
                totalPages={result.totalPages}
                searchParams={{ category, tag, q: query }}
              />
            </>
          ) : (
            <EmptyState
              title="没有找到相符文章"
              description={query || category || tag ? "试试更短的关键词，或者清除当前筛选。" : "第一篇公开文章正在整理。"}
              href={query || category || tag ? "/blog" : undefined}
              action={query || category || tag ? "清除筛选" : undefined}
            />
          )}
        </div>
      </section>
    </main>
  );
}
