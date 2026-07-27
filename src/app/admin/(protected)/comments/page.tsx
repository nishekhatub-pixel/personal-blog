import type { CommentStatus, Prisma } from "@prisma/client";
import {
  Check,
  EyeOff,
  MessageSquareText,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { deleteComment, moderateComment } from "@/actions/admin";
import { ConfirmButton, SearchField } from "@/components/admin/AdminControls";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Pagination } from "@/components/admin/Pagination";
import { db } from "@/lib/db";

const PAGE_SIZE = 12;
const statuses = ["PENDING", "APPROVED", "HIDDEN", "SPAM"] as const;
const statusLabel = {
  PENDING: "待审核",
  APPROVED: "已通过",
  HIDDEN: "已隐藏",
  SPAM: "垃圾评论",
} as const;
const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function AdminCommentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const rawStatus = typeof params.status === "string" ? params.status : "";
  const status = statuses.includes(rawStatus as (typeof statuses)[number])
    ? (rawStatus as CommentStatus)
    : undefined;
  const postId = typeof params.post === "string" ? params.post : "";
  const parsedPage = Number(typeof params.page === "string" ? params.page : "1");
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1;
  const where: Prisma.CommentWhereInput = {
    ...(status ? { status } : {}),
    ...(postId ? { postId } : {}),
    ...(q
      ? {
          OR: [
            { authorName: { contains: q } },
            { email: { contains: q } },
            { content: { contains: q } },
            { post: { title: { contains: q } } },
          ],
        }
      : {}),
  };
  const [comments, count, posts, pendingCount] = await Promise.all([
    db.comment.findMany({
      include: {
        post: { select: { slug: true, title: true } },
        _count: { select: { replies: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      where,
    }),
    db.comment.count({ where }),
    db.post.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } }),
    db.comment.count({ where: { status: "PENDING" } }),
  ]);
  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <>
      <AdminHeader
        description={`${pendingCount} 条评论等待判断。通过、隐藏与标记垃圾评论都即时写入数据库。`}
        eyebrow="COMMUNITY / MODERATION"
        title="评论审核"
      />

      <form className="mb-8 grid gap-3 border-b border-[var(--line)] pb-6 md:grid-cols-[minmax(15rem,1fr)_11rem_minmax(12rem,0.55fr)_auto]" method="get">
        <SearchField defaultValue={q} placeholder="搜索作者、邮箱、内容或文章" />
        <select aria-label="按状态筛选" className="min-h-11 border border-[var(--line)] bg-[var(--canvas)] px-3 text-sm" defaultValue={status ?? ""} name="status">
          <option value="">全部状态</option>
          {statuses.map((item) => <option key={item} value={item}>{statusLabel[item]}</option>)}
        </select>
        <select aria-label="按文章筛选" className="min-h-11 min-w-0 border border-[var(--line)] bg-[var(--canvas)] px-3 text-sm" defaultValue={postId} name="post">
          <option value="">全部文章</option>
          {posts.map((post) => <option key={post.id} value={post.id}>{post.title}</option>)}
        </select>
        <button className="min-h-11 border border-[var(--ink)] px-5 text-sm" type="submit">筛选</button>
      </form>

      {comments.length ? (
        <ol className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {comments.map((comment) => (
            <li className="py-6" key={comment.id}>
              <div className="grid gap-5 lg:grid-cols-[11rem_minmax(0,1fr)_auto]">
                <div>
                  <p className="text-sm font-semibold">{comment.authorName}</p>
                  <a className="mt-1 block break-all text-xs text-[var(--muted)] hover:text-[var(--ink)]" href={`mailto:${comment.email}`}>
                    {comment.email}
                  </a>
                  <p className="mt-3 font-mono text-[10px] text-[var(--muted)]">{dateFormatter.format(comment.createdAt)}</p>
                  <p className="mt-1 font-mono text-[10px] uppercase text-[var(--accent)]">{statusLabel[comment.status]}</p>
                </div>
                <div className="min-w-0">
                  <p className="whitespace-pre-wrap text-sm leading-7">{comment.content}</p>
                  <p className="mt-3 text-xs text-[var(--muted)]">
                    文章：
                    <Link className="underline underline-offset-4 hover:text-[var(--ink)]" href={`/blog/${comment.post.slug}`} target="_blank">
                      {comment.post.title}
                    </Link>
                    {comment._count.replies ? ` · ${comment._count.replies} 条回复` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-start gap-1 lg:w-36 lg:justify-end">
                  {comment.status !== "APPROVED" ? (
                    <form action={moderateComment}>
                      <input name="id" type="hidden" value={comment.id} />
                      <input name="status" type="hidden" value="APPROVED" />
                      <button aria-label="通过评论" className="grid size-10 place-items-center text-[var(--success)] hover:bg-emerald-500/10 focus-visible:ring-2 focus-visible:ring-[var(--accent)]" title="通过" type="submit">
                        <Check aria-hidden="true" size={16} />
                      </button>
                    </form>
                  ) : null}
                  {comment.status !== "HIDDEN" ? (
                    <form action={moderateComment}>
                      <input name="id" type="hidden" value={comment.id} />
                      <input name="status" type="hidden" value="HIDDEN" />
                      <button aria-label="隐藏评论" className="grid size-10 place-items-center text-[var(--muted)] hover:bg-[color-mix(in_srgb,var(--ink)_5%,transparent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]" title="隐藏" type="submit">
                        <EyeOff aria-hidden="true" size={16} />
                      </button>
                    </form>
                  ) : null}
                  {comment.status !== "SPAM" ? (
                    <form action={moderateComment}>
                      <input name="id" type="hidden" value={comment.id} />
                      <input name="status" type="hidden" value="SPAM" />
                      <button aria-label="标记垃圾评论" className="grid size-10 place-items-center text-[var(--danger)] hover:bg-red-500/10 focus-visible:ring-2 focus-visible:ring-[var(--accent)]" title="标记垃圾" type="submit">
                        <ShieldAlert aria-hidden="true" size={16} />
                      </button>
                    </form>
                  ) : null}
                  <form action={deleteComment}>
                    <input name="id" type="hidden" value={comment.id} />
                    <ConfirmButton message={`确定永久删除 ${comment.authorName} 的这条评论及其回复关系？`}>
                      <span className="sr-only">永久删除评论</span>
                      <Trash2 aria-hidden="true" size={16} />
                    </ConfirmButton>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="grid min-h-64 place-items-center border-y border-[var(--line)] text-center">
          <div>
            <MessageSquareText aria-hidden="true" className="mx-auto mb-4 text-[var(--muted)]" size={30} strokeWidth={1.3} />
            <p className="font-medium">没有匹配的评论</p>
            <p className="mt-2 text-sm text-[var(--muted)]">调整筛选条件查看其他互动。</p>
          </div>
        </div>
      )}
      <Pagination
        page={Math.min(page, pageCount)}
        pageCount={pageCount}
        searchParams={{ q, status, post: postId }}
      />
    </>
  );
}
