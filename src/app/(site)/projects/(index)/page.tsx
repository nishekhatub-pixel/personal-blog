import { ArrowRight, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedProjects, getTags } from "@/lib/data";
import { EmptyState } from "@/components/content/empty-state";
import type { PublicProject, Taxonomy } from "@/components/content/content-types";
import { Pagination } from "@/components/content/pagination";
import { ProjectCard } from "@/components/content/project-card";
import { PageIntro } from "@/components/site/page-intro";

export const metadata: Metadata = {
  title: "项目",
  description: "R7 的完整项目案例，包含问题、目标、技术实现、界面证据与真实复盘。",
  alternates: { canonical: "/projects" },
};
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const single = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function ProjectsPage({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams;
  const tag = single(raw.tag);
  const query = single(raw.q)?.trim();
  const page = Math.max(1, Number(single(raw.page)) || 1);
  const [result, tagRows] = await Promise.all([
    getPublishedProjects({ tag, query, page, pageSize: 6 }),
    getTags(),
  ]);
  const projects = result.items as PublicProject[];
  const tags = (tagRows as Taxonomy[]).filter((item) => (item._count?.projects || 0) > 0);

  return (
    <main id="main-content">
      <PageIntro
        eyebrow="Build log"
        title="把学习做成作品"
        description="这里不只展示完成后的界面，也保留问题、约束、选择和失误。每个项目都是一段可以回看的成长记录。"
      />

      <section className="px-[var(--page-gutter)] pb-6" aria-label="项目筛选">
        <div className="garden-panel mx-auto flex max-w-[var(--content-max)] flex-col gap-5 p-4 lg:flex-row lg:items-center lg:justify-between lg:p-5">
          <nav className="flex max-w-full gap-2 overflow-x-auto pb-1" aria-label="按技术筛选项目">
            <Link href={query ? `/projects?q=${encodeURIComponent(query)}` : "/projects"} aria-current={!tag ? "page" : undefined} className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold ${!tag ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]" : "border-[var(--line)]"}`}>
              全部
            </Link>
            {tags.map((item) => (
              <Link
                key={item.slug}
                href={`/projects?tag=${item.slug}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
                aria-current={tag === item.slug ? "page" : undefined}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold ${tag === item.slug ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]" : "border-[var(--line)]"}`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
          <form action="/projects" role="search" className="relative w-full lg:max-w-sm">
            {tag ? <input type="hidden" name="tag" value={tag} /> : null}
            <label htmlFor="project-search" className="sr-only">搜索项目</label>
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" aria-hidden size={18} />
            <input id="project-search" name="q" type="search" defaultValue={query} className="min-h-12 w-full rounded-full border border-[var(--line)] bg-[var(--surface)] pl-11 pr-4 outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]" placeholder="搜索项目目标或技术" />
          </form>
        </div>
      </section>

      <section className="px-[var(--page-gutter)] py-[clamp(3rem,8vw,7rem)]">
        <div className="mx-auto max-w-[var(--content-max)]">
          {projects.length ? (
            <>
              <div className="grid gap-x-6 gap-y-20 md:grid-cols-12">
                {projects.map((project, index) => (
                  <div
                    key={project.id}
                    className={
                      index % 5 === 0 ? "md:col-span-7" :
                      index % 5 === 1 ? "md:col-span-5 md:pt-20" :
                      index % 5 === 2 ? "md:col-span-5" :
                      index % 5 === 3 ? "md:col-span-7 md:pt-12" :
                      "md:col-span-6 md:col-start-4"
                    }
                  >
                    <ProjectCard project={project} ratio={index % 5 === 1 ? "portrait" : index % 5 === 2 ? "square" : "wide"} priority={index === 0} />
                  </div>
                ))}
              </div>
              <Pagination page={result.page} totalPages={result.totalPages} searchParams={{ tag, q: query }} />
            </>
          ) : (
            <EmptyState title="没有相符项目" description={tag || query ? "清除技术筛选或换一个关键词再试。" : "项目资料正在整理，完成后会展示可运行结果与过程。"} href={tag || query ? "/projects" : undefined} action={tag || query ? "清除筛选" : undefined} />
          )}
        </div>
      </section>

      <section className="soft-section border-t border-[var(--line)] px-[var(--page-gutter)] py-16">
        <div className="mx-auto flex max-w-[var(--content-max)] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-lg font-semibold">想了解某个项目没有写下的细节？</p>
          <Link href="/contact" className="inline-flex items-center gap-2 font-semibold text-[var(--accent)]">直接问我 <ArrowRight aria-hidden size={18} /></Link>
        </div>
      </section>
    </main>
  );
}
