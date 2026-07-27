import type { ContentStatus, Prisma } from "@prisma/client";
import { Edit3, Eye, FileText, Trash2 } from "lucide-react";
import Link from "next/link";
import { deletePost } from "@/actions/admin";
import { ConfirmButton, SearchField } from "@/components/admin/AdminControls";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Pagination } from "@/components/admin/Pagination";
import { db } from "@/lib/db";

const PAGE_SIZE = 10;
const statuses = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
const statusLabel: Record<(typeof statuses)[number], string> = {
  DRAFT: "草稿",
  PUBLISHED: "已发布",
  ARCHIVED: "已归档",
};
const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const rawStatus = typeof params.status === "string" ? params.status : "";
  const status = statuses.includes(rawStatus as (typeof statuses)[number])
    ? (rawStatus as ContentStatus)
    : undefined;
  const requestedPage = Number(typeof params.page === "string" ? params.page : "1");
  const page = Number.isFinite(requestedPage) && requestedPage > 0
    ? Math.floor(requestedPage)
    : 1;
  const where: Prisma.PostWhereInput = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q } },
            { excerpt: { contains: q } },
            { slug: { contains: q } },
          ],
        }
      : {}),
  };
  const [posts, count] = await Promise.all([
    db.post.findMany({
      include: {
        category: { select: { name: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      where,
    }),
    db.post.count({ where }),
  ]);
  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <>
      <AdminHeader
        action={{ href: "/admin/posts/create", label: "新建文章" }}
        description={`共 ${count} 篇匹配内容。搜索、筛选、编辑与发布都作用于真实数据库。`}
        eyebrow="CONTENT / POSTS"
        title="文章"
      />

      <form className="mb-7 flex flex-col gap-3 border-b border-[var(--line)] pb-6 sm:flex-row" method="get">
        <SearchField defaultValue={q} placeholder="搜索标题、摘要或 slug" />
        <label className="sm:w-44">
          <span className="sr-only">按状态筛选</span>
          <select
            className="min-h-11 w-full border border-[var(--line)] bg-[var(--canvas)] px-3 text-sm outline-none focus:border-[var(--accent)]"
            defaultValue={status ?? ""}
            name="status"
          >
            <option value="">全部状态</option>
            {statuses.map((item) => (
              <option key={item} value={item}>
                {statusLabel[item]}
              </option>
            ))}
          </select>
        </label>
        <button
          className="min-h-11 border border-[var(--ink)] px-5 text-sm transition-colors hover:bg-[var(--ink)] hover:text-[var(--canvas)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          type="submit"
        >
          应用筛选
        </button>
      </form>

      {posts.length ? (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[var(--line)] font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">
                  <th className="px-3 py-4 font-normal">文章</th>
                  <th className="px-3 py-4 font-normal">状态</th>
                  <th className="px-3 py-4 font-normal">分类</th>
                  <th className="px-3 py-4 font-normal">评论</th>
                  <th className="px-3 py-4 font-normal">更新</th>
                  <th className="px-3 py-4 text-right font-normal">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {posts.map((post) => (
                  <tr className="group hover:bg-[color-mix(in_srgb,var(--ink)_3%,transparent)]" key={post.id}>
                    <td className="max-w-md px-3 py-5">
                      <Link
                        className="line-clamp-1 text-sm font-medium underline-offset-4 group-hover:text-[var(--accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                        href={`/admin/posts/${post.id}/edit`}
                      >
                        {post.title}
                      </Link>
                      <p className="mt-1 line-clamp-1 font-mono text-[11px] text-[var(--muted)]">
                        /blog/{post.slug}
                      </p>
                    </td>
                    <td className="px-3 py-5 text-xs">
                      {statusLabel[post.status]}
                      {post.featured ? (
                        <span className="ml-2 text-[var(--accent)]">推荐</span>
                      ) : null}
                    </td>
                    <td className="px-3 py-5 text-sm text-[var(--muted)]">
                      {post.category.name}
                    </td>
                    <td className="px-3 py-5 font-mono text-xs text-[var(--muted)]">
                      {post._count.comments}
                    </td>
                    <td className="px-3 py-5 font-mono text-xs text-[var(--muted)]">
                      {dateFormatter.format(post.updatedAt)}
                    </td>
                    <td className="px-3 py-5">
                      <div className="flex items-center justify-end gap-1">
                        {post.status === "PUBLISHED" ? (
                          <Link
                            aria-label={`查看《${post.title}》`}
                            className="grid size-10 place-items-center text-[var(--muted)] hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                            href={`/blog/${post.slug}`}
                            target="_blank"
                          >
                            <Eye aria-hidden="true" size={16} />
                          </Link>
                        ) : null}
                        <Link
                          aria-label={`编辑《${post.title}》`}
                          className="grid size-10 place-items-center text-[var(--muted)] hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                          href={`/admin/posts/${post.id}/edit`}
                        >
                          <Edit3 aria-hidden="true" size={16} />
                        </Link>
                        <form action={deletePost}>
                          <input name="id" type="hidden" value={post.id} />
                          <ConfirmButton message={`确定删除《${post.title}》？文章及其评论将永久移除。`}>
                            <span className="sr-only">删除《{post.title}》</span>
                            <Trash2 aria-hidden="true" size={16} />
                          </ConfirmButton>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ol className="divide-y divide-[var(--line)] md:hidden">
            {posts.map((post) => (
              <li className="py-5" key={post.id}>
                <div className="flex items-start gap-3">
                  <FileText aria-hidden="true" className="mt-1 shrink-0 text-[var(--accent)]" size={18} />
                  <div className="min-w-0 flex-1">
                    <Link className="line-clamp-2 text-sm font-medium" href={`/admin/posts/${post.id}/edit`}>
                      {post.title}
                    </Link>
                    <p className="mt-2 text-xs text-[var(--muted)]">
                      {statusLabel[post.status]} · {post.category.name} · {dateFormatter.format(post.updatedAt)}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <Link className="min-h-10 py-2 text-sm text-[var(--accent)]" href={`/admin/posts/${post.id}/edit`}>
                        编辑文章
                      </Link>
                      <form action={deletePost}>
                        <input name="id" type="hidden" value={post.id} />
                        <ConfirmButton message={`确定删除《${post.title}》？此操作无法撤销。`}>
                          删除
                        </ConfirmButton>
                      </form>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <Pagination
            page={Math.min(page, pageCount)}
            pageCount={pageCount}
            searchParams={{ q, status }}
          />
        </>
      ) : (
        <div className="grid min-h-72 place-items-center border-y border-[var(--line)] text-center">
          <div>
            <FileText aria-hidden="true" className="mx-auto mb-4 text-[var(--muted)]" size={28} strokeWidth={1.3} />
            <p className="text-base font-medium">没有匹配的文章</p>
            <p className="mt-2 text-sm text-[var(--muted)]">调整搜索条件，或创建一篇新文章。</p>
          </div>
        </div>
      )}
    </>
  );
}
