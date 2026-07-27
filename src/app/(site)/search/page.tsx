import { Search } from "lucide-react";
import type { Metadata } from "next";
import { searchContent } from "@/lib/data";
import { EmptyState } from "@/components/content/empty-state";
import type { PublicPost, PublicProject } from "@/components/content/content-types";
import { PostCard } from "@/components/content/post-card";
import { ProjectCard } from "@/components/content/project-card";

export const metadata: Metadata = {
  title: "站内搜索",
  description: "搜索 R7 数字花园中的文章与项目。",
  robots: { index: false, follow: true },
};
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams;
  const value = Array.isArray(raw.q) ? raw.q[0] : raw.q;
  const query = value?.trim() || "";
  const result = query ? await searchContent(query, 18) : { query: "", posts: [], projects: [], total: 0 };
  const posts = result.posts as PublicPost[];
  const projects = result.projects as PublicProject[];

  return (
    <main id="main-content" className="px-[clamp(1rem,4vw,4rem)] py-[clamp(4rem,9vw,8rem)]">
      <div className="mx-auto max-w-[1180px]">
        <h1 className="text-[clamp(3.4rem,9vw,7.5rem)] font-black leading-[.88] tracking-[-.08em]">搜索</h1>
        <form action="/search" role="search" className="relative mt-10">
          <label htmlFor="site-search" className="sr-only">搜索文章和项目</label>
          <Search className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[var(--muted)]" aria-hidden size={24} />
          <input
            id="site-search"
            name="q"
            type="search"
            defaultValue={query}
            autoFocus
            className="min-h-16 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] pl-14 pr-5 text-xl outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            placeholder="输入标题、技术或正在解决的问题"
          />
        </form>

        {query ? (
          <p className="mt-6 text-sm text-[var(--muted)]">
            “{query}” 找到 {result.total} 条结果
          </p>
        ) : null}

        {!query ? (
          <div className="mt-16">
            <EmptyState title="从一个关键词开始" description="可以搜索技术名称、文章标题、项目目标或正文中的一句话。" />
          </div>
        ) : query.length < 2 ? (
          <div className="mt-16">
            <EmptyState title="再输入一个字符" description="搜索词至少需要两个字符，这样结果会更准确。" />
          </div>
        ) : result.total === 0 ? (
          <div className="mt-16">
            <EmptyState title="没有相符内容" description="试试更短的关键词，或者换一种表达。" href="/blog" action="浏览全部文章" />
          </div>
        ) : (
          <div className="mt-16 space-y-20">
            {posts.length ? (
              <section aria-labelledby="search-posts">
                <h2 id="search-posts" className="text-3xl font-semibold tracking-[-.05em]">文章 <span className="font-mono text-sm text-[var(--muted)]">{posts.length}</span></h2>
                <div className="mt-8 grid gap-x-6 gap-y-14 md:grid-cols-2">
                  {posts.map((post) => <PostCard key={post.id} post={post} />)}
                </div>
              </section>
            ) : null}
            {projects.length ? (
              <section aria-labelledby="search-projects">
                <h2 id="search-projects" className="text-3xl font-semibold tracking-[-.05em]">项目 <span className="font-mono text-sm text-[var(--muted)]">{projects.length}</span></h2>
                <div className="mt-8 grid gap-x-6 gap-y-14 md:grid-cols-2">
                  {projects.map((project) => <ProjectCard key={project.id} project={project} />)}
                </div>
              </section>
            ) : null}
          </div>
        )}
      </div>
    </main>
  );
}
