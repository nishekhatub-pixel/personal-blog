import type { ContentStatus, Prisma } from "@prisma/client";
import { Edit3, ExternalLink, FolderKanban, Trash2 } from "lucide-react";
import Link from "next/link";
import { deleteProject } from "@/actions/admin";
import { ConfirmButton, SearchField } from "@/components/admin/AdminControls";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Pagination } from "@/components/admin/Pagination";
import { db } from "@/lib/db";

const PAGE_SIZE = 10;
const statuses = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
const statusLabel = {
  DRAFT: "草稿",
  PUBLISHED: "已发布",
  ARCHIVED: "已归档",
} as const;

export default async function AdminProjectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const rawStatus = typeof params.status === "string" ? params.status : "";
  const status = statuses.includes(rawStatus as (typeof statuses)[number])
    ? (rawStatus as ContentStatus)
    : undefined;
  const parsedPage = Number(typeof params.page === "string" ? params.page : "1");
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1;
  const where: Prisma.ProjectWhereInput = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q } },
            { slug: { contains: q } },
            { summary: { contains: q } },
          ],
        }
      : {}),
  };
  const [projects, count] = await Promise.all([
    db.project.findMany({
      include: { _count: { select: { pageViews: true } } },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      where,
    }),
    db.project.count({ where }),
  ]);
  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <>
      <AdminHeader
        action={{ href: "/admin/projects/new", label: "新增项目" }}
        description="项目页不是缩略图仓库，而是可复用的案例档案：背景、目标、过程、结果与复盘都应完整。"
        eyebrow="WORK / PROJECTS"
        title="项目"
      />

      <form className="mb-8 flex flex-col gap-3 border-b border-[var(--line)] pb-6 sm:flex-row" method="get">
        <SearchField defaultValue={q} placeholder="搜索项目名称、摘要或 slug" />
        <select
          aria-label="按状态筛选"
          className="min-h-11 border border-[var(--line)] bg-[var(--canvas)] px-3 text-sm sm:w-44"
          defaultValue={status ?? ""}
          name="status"
        >
          <option value="">全部状态</option>
          {statuses.map((item) => (
            <option key={item} value={item}>{statusLabel[item]}</option>
          ))}
        </select>
        <button className="min-h-11 border border-[var(--ink)] px-5 text-sm" type="submit">
          应用筛选
        </button>
      </form>

      {projects.length ? (
        <ol className="border-t border-[var(--line)]">
          {projects.map((project, index) => (
            <li
              className="grid gap-5 border-b border-[var(--line)] py-7 md:grid-cols-[3rem_minmax(0,1fr)_auto] md:items-center"
              key={project.id}
            >
              <span className="font-mono text-xs text-[var(--accent)]">
                {String((page - 1) * PAGE_SIZE + index + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Link
                    className="line-clamp-1 text-lg font-semibold tracking-[-0.02em] underline-offset-4 hover:text-[var(--accent)] hover:underline"
                    href={`/admin/projects/${project.id}/edit`}
                  >
                    {project.title}
                  </Link>
                  {project.featured ? (
                    <span className="font-mono text-[10px] uppercase text-[var(--accent)]">Featured</span>
                  ) : null}
                </div>
                <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">{project.summary}</p>
                <p className="mt-3 font-mono text-[11px] text-[var(--muted)]">
                  {statusLabel[project.status]} · {project._count.pageViews} VIEWS · /projects/{project.slug}
                </p>
              </div>
              <div className="flex items-center gap-1 md:justify-end">
                {project.status === "PUBLISHED" ? (
                  <Link
                    aria-label={`查看项目“${project.title}”`}
                    className="grid size-10 place-items-center text-[var(--muted)] hover:text-[var(--ink)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                    href={`/projects/${project.slug}`}
                    target="_blank"
                  >
                    <ExternalLink aria-hidden="true" size={16} />
                  </Link>
                ) : null}
                <Link
                  aria-label={`编辑项目“${project.title}”`}
                  className="grid size-10 place-items-center text-[var(--muted)] hover:text-[var(--ink)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                  href={`/admin/projects/${project.id}/edit`}
                >
                  <Edit3 aria-hidden="true" size={16} />
                </Link>
                <form action={deleteProject}>
                  <input name="id" type="hidden" value={project.id} />
                  <ConfirmButton message={`确定删除项目“${project.title}”？相关浏览记录也会被移除。`}>
                    <span className="sr-only">删除项目“{project.title}”</span>
                    <Trash2 aria-hidden="true" size={16} />
                  </ConfirmButton>
                </form>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="grid min-h-72 place-items-center border-y border-[var(--line)] text-center">
          <div>
            <FolderKanban aria-hidden="true" className="mx-auto mb-4 text-[var(--muted)]" size={30} strokeWidth={1.3} />
            <p className="font-medium">没有匹配的项目</p>
            <p className="mt-2 text-sm text-[var(--muted)]">调整筛选，或整理第一个项目案例。</p>
          </div>
        </div>
      )}
      <Pagination page={Math.min(page, pageCount)} pageCount={pageCount} searchParams={{ q, status }} />
    </>
  );
}
