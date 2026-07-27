import type { CommentStatus, ContentStatus, Prisma } from "@prisma/client";
import {
  Edit3,
  MessageCircleMore,
  Pin,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import {
  deleteMoment,
  deleteMomentComment,
  moderateMomentComment,
} from "@/actions/garden-admin";
import {
  ConfirmButton,
  SearchField,
  SubmitButton,
} from "@/components/admin/AdminControls";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { GardenActionForm } from "@/components/admin/GardenActionForm";
import { Pagination } from "@/components/admin/Pagination";
import { db } from "@/lib/db";

const PAGE_SIZE = 12;
const contentStatuses = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
const commentStatuses = ["PENDING", "APPROVED", "HIDDEN", "SPAM"] as const;
const contentStatusLabel = {
  ARCHIVED: "已归档",
  DRAFT: "草稿",
  PUBLISHED: "已发布",
} as const;
const commentStatusLabel = {
  APPROVED: "已通过",
  HIDDEN: "已隐藏",
  PENDING: "待审核",
  SPAM: "垃圾评论",
} as const;
const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  month: "2-digit",
  year: "numeric",
});

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminMomentsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const view = params.view === "comments" ? "comments" : "content";
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const rawStatus = typeof params.status === "string" ? params.status : "";
  const requestedPage = Number(typeof params.page === "string" ? params.page : "1");
  const page =
    Number.isFinite(requestedPage) && requestedPage > 0
      ? Math.floor(requestedPage)
      : 1;

  return (
    <>
      <AdminHeader
        action={{ href: "/admin/moments/new", label: "新建说说" }}
        description="管理短内容、关联媒体与读者回应。公开评论仍需审核。"
        eyebrow="GARDEN / MOMENTS"
        title="说说"
      />

      <nav aria-label="说说管理视图" className="mb-8 flex border-b border-[var(--line)]">
        <Link
          aria-current={view === "content" ? "page" : undefined}
          className={[
            "inline-flex min-h-11 items-center border-b-2 px-4 text-sm",
            view === "content"
              ? "border-[var(--accent)] text-[var(--ink)]"
              : "border-transparent text-[var(--muted)]",
          ].join(" ")}
          href="/admin/moments"
        >
          内容
        </Link>
        <Link
          aria-current={view === "comments" ? "page" : undefined}
          className={[
            "inline-flex min-h-11 items-center border-b-2 px-4 text-sm",
            view === "comments"
              ? "border-[var(--accent)] text-[var(--ink)]"
              : "border-transparent text-[var(--muted)]",
          ].join(" ")}
          href="/admin/moments?view=comments"
        >
          评论审核
        </Link>
      </nav>

      {view === "comments" ? (
        <MomentComments q={q} page={page} rawStatus={rawStatus} />
      ) : (
        <MomentList q={q} page={page} rawStatus={rawStatus} />
      )}
    </>
  );
}

async function MomentList({
  page,
  q,
  rawStatus,
}: {
  page: number;
  q: string;
  rawStatus: string;
}) {
  const status = contentStatuses.includes(
    rawStatus as (typeof contentStatuses)[number],
  )
    ? (rawStatus as ContentStatus)
    : undefined;
  const where: Prisma.MomentWhereInput = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { content: { contains: q } },
            { mood: { contains: q } },
            { weather: { contains: q } },
          ],
        }
      : {}),
  };
  const [moments, count] = await Promise.all([
    db.moment.findMany({
      include: {
        _count: { select: { comments: true, media: true, reactions: true } },
      },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      where,
    }),
    db.moment.count({ where }),
  ]);
  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <>
      <form className="mb-7 flex flex-col gap-3 border-b border-[var(--line)] pb-6 sm:flex-row" method="get">
        <SearchField defaultValue={q} placeholder="搜索内容、心情或天气" />
        <label className="sm:w-44">
          <span className="sr-only">按状态筛选</span>
          <select
            className="min-h-11 w-full border border-[var(--line)] bg-[var(--canvas)] px-3 text-sm"
            defaultValue={status ?? ""}
            name="status"
          >
            <option value="">全部状态</option>
            {contentStatuses.map((item) => (
              <option key={item} value={item}>
                {contentStatusLabel[item]}
              </option>
            ))}
          </select>
        </label>
        <button className="min-h-11 border border-[var(--ink)] px-5 text-sm" type="submit">
          筛选
        </button>
      </form>

      {moments.length ? (
        <ol className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {moments.map((moment) => (
            <li className="grid gap-5 py-6 md:grid-cols-[minmax(0,1fr)_auto]" key={moment.id}>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                  <span>{contentStatusLabel[moment.status]}</span>
                  {moment.pinned ? (
                    <span className="inline-flex items-center gap-1 text-[var(--accent)]">
                      <Pin aria-hidden="true" size={13} />
                      置顶
                    </span>
                  ) : null}
                  <span>{dateFormatter.format(moment.publishedAt ?? moment.createdAt)}</span>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7">
                  {moment.content}
                </p>
                <p className="mt-3 font-mono text-[11px] text-[var(--muted)]">
                  {moment._count.media} MEDIA · {moment._count.comments} COMMENTS ·{" "}
                  {moment._count.reactions} REACTIONS
                </p>
              </div>
              <div className="flex items-start gap-1">
                <Link
                  aria-label="编辑说说"
                  className="grid size-11 place-items-center text-[var(--muted)] hover:text-[var(--ink)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                  href={`/admin/moments/${moment.id}/edit`}
                >
                  <Edit3 aria-hidden="true" size={16} />
                </Link>
                <GardenActionForm
                  action={deleteMoment}
                  successMessage="说说已删除。"
                >
                  <input name="id" type="hidden" value={moment.id} />
                  <ConfirmButton message="确定删除这条说说？关联媒体关系、评论和回应也会移除。">
                    <span className="grid size-11 place-items-center">
                      <span className="sr-only">删除说说</span>
                      <Trash2 aria-hidden="true" size={16} />
                    </span>
                  </ConfirmButton>
                </GardenActionForm>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="grid min-h-64 place-items-center border-y border-[var(--line)] text-center">
          <div>
            <MessageCircleMore
              aria-hidden="true"
              className="mx-auto mb-4 text-[var(--muted)]"
              size={30}
              strokeWidth={1.3}
            />
            <p className="font-medium">没有匹配的说说</p>
            <p className="mt-2 text-sm text-[var(--muted)]">调整筛选，或记录第一条内容。</p>
          </div>
        </div>
      )}
      <Pagination
        page={Math.min(page, pageCount)}
        pageCount={pageCount}
        searchParams={{ q, status }}
      />
    </>
  );
}

async function MomentComments({
  page,
  q,
  rawStatus,
}: {
  page: number;
  q: string;
  rawStatus: string;
}) {
  const status = commentStatuses.includes(
    rawStatus as (typeof commentStatuses)[number],
  )
    ? (rawStatus as CommentStatus)
    : undefined;
  const where: Prisma.MomentCommentWhereInput = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { authorName: { contains: q } },
            { email: { contains: q } },
            { content: { contains: q } },
            { moment: { content: { contains: q } } },
          ],
        }
      : {}),
  };
  const [comments, count, pendingCount] = await Promise.all([
    db.momentComment.findMany({
      include: {
        moment: { select: { content: true } },
        _count: { select: { replies: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      where,
    }),
    db.momentComment.count({ where }),
    db.momentComment.count({ where: { status: "PENDING" } }),
  ]);
  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <>
      <p className="mb-5 text-sm text-[var(--muted)]">
        {pendingCount} 条说说评论等待审核。
      </p>
      <form className="mb-7 flex flex-col gap-3 border-b border-[var(--line)] pb-6 sm:flex-row" method="get">
        <input name="view" type="hidden" value="comments" />
        <SearchField defaultValue={q} placeholder="搜索作者、邮箱、评论或说说" />
        <label className="sm:w-44">
          <span className="sr-only">按评论状态筛选</span>
          <select
            className="min-h-11 w-full border border-[var(--line)] bg-[var(--canvas)] px-3 text-sm"
            defaultValue={status ?? ""}
            name="status"
          >
            <option value="">全部状态</option>
            {commentStatuses.map((item) => (
              <option key={item} value={item}>
                {commentStatusLabel[item]}
              </option>
            ))}
          </select>
        </label>
        <button className="min-h-11 border border-[var(--ink)] px-5 text-sm" type="submit">
          筛选
        </button>
      </form>

      {comments.length ? (
        <ol className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {comments.map((comment) => (
            <li className="grid gap-5 py-6 lg:grid-cols-[11rem_minmax(0,1fr)_13rem]" key={comment.id}>
              <div>
                <p className="text-sm font-semibold">{comment.authorName}</p>
                <a
                  className="mt-1 block break-all text-xs text-[var(--muted)]"
                  href={`mailto:${comment.email}`}
                >
                  {comment.email}
                </a>
                <p className="mt-3 font-mono text-[10px] text-[var(--muted)]">
                  {dateFormatter.format(comment.createdAt)}
                </p>
              </div>
              <div className="min-w-0">
                <p className="whitespace-pre-wrap text-sm leading-7">{comment.content}</p>
                <p className="mt-3 line-clamp-2 text-xs leading-5 text-[var(--muted)]">
                  原说说：{comment.moment.content}
                  {comment._count.replies ? ` · ${comment._count.replies} 条回复` : ""}
                </p>
              </div>
              <div className="grid content-start gap-3">
                <GardenActionForm
                  action={moderateMomentComment}
                  className="grid gap-2"
                  successMessage="评论状态已更新。"
                >
                  <input name="id" type="hidden" value={comment.id} />
                  <label className="grid gap-1 text-xs">
                    <span>审核状态</span>
                    <select
                      className="min-h-11 border border-[var(--line)] bg-[var(--canvas)] px-3"
                      defaultValue={comment.status}
                      name="status"
                    >
                      {commentStatuses.map((item) => (
                        <option key={item} value={item}>
                          {commentStatusLabel[item]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <SubmitButton pendingLabel="更新中…">更新状态</SubmitButton>
                </GardenActionForm>
                <GardenActionForm
                  action={deleteMomentComment}
                  successMessage="评论已删除。"
                >
                  <input name="id" type="hidden" value={comment.id} />
                  <ConfirmButton message={`确定永久删除 ${comment.authorName} 的评论？`}>
                    <span className="inline-flex min-h-11 items-center">删除评论</span>
                  </ConfirmButton>
                </GardenActionForm>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="border-y border-[var(--line)] py-12 text-center text-sm text-[var(--muted)]">
          没有匹配的说说评论。
        </p>
      )}
      <Pagination
        page={Math.min(page, pageCount)}
        pageCount={pageCount}
        searchParams={{ q, status, view: "comments" }}
      />
    </>
  );
}
