import type { CommentStatus, Prisma } from "@prisma/client";
import { ExternalLink, MessageCircleMore, Pin, Trash2 } from "lucide-react";
import Link from "next/link";
import {
  deleteGuestbookMessage,
  moderateGuestbookMessage,
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
const statuses = ["PENDING", "APPROVED", "HIDDEN", "SPAM"] as const;
const statusLabel = {
  APPROVED: "已通过",
  HIDDEN: "已隐藏",
  PENDING: "待审核",
  SPAM: "垃圾信息",
} as const;
const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function AdminGuestbookPage({
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
  const rawPage = Number(typeof params.page === "string" ? params.page : "1");
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
  const where: Prisma.GuestbookMessageWhereInput = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { nickname: { contains: q } },
            { content: { contains: q } },
            { website: { contains: q } },
            { replyContent: { contains: q } },
          ],
        }
      : {}),
  };
  const [messages, count, pendingCount] = await Promise.all([
    db.guestbookMessage.findMany({
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      select: {
        colorKey: true,
        content: true,
        createdAt: true,
        id: true,
        nickname: true,
        pinned: true,
        repliedAt: true,
        replyContent: true,
        status: true,
        website: true,
      },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      where,
    }),
    db.guestbookMessage.count({ where }),
    db.guestbookMessage.count({ where: { status: "PENDING" } }),
  ]);
  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <>
      <AdminHeader
        description="审核访客留言、控制公开状态、置顶并以站长身份回复；技术指纹不会出现在此页面。"
        eyebrow="GARDEN / GUESTBOOK"
        title="留言墙"
      />

      <div className="mb-7 flex min-h-11 flex-wrap items-center justify-between gap-4 border-y border-[var(--line)] py-3 text-sm">
        <span>
          待审核
          <strong className="ml-2 font-mono text-[var(--accent)]">{pendingCount}</strong>
        </span>
        <span className="text-xs text-[var(--muted)]">
          公开页仅展示审核通过的留言及回复
        </span>
      </div>

      <form className="mb-7 grid gap-3 border-b border-[var(--line)] pb-6 md:grid-cols-[minmax(14rem,1fr)_12rem_auto]" method="get">
        <SearchField defaultValue={q} placeholder="搜索昵称、留言、网址或回复" />
        <label>
          <span className="sr-only">按审核状态筛选</span>
          <select
            className="min-h-11 w-full border border-[var(--line)] bg-[var(--canvas)] px-3 text-sm"
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
        <button className="min-h-11 border border-[var(--ink)] px-5 text-sm" type="submit">
          筛选
        </button>
      </form>

      {messages.length ? (
        <ul className="grid gap-5">
          {messages.map((message) => (
            <li className="border border-[var(--line)]" key={message.id}>
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--line)] p-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold">{message.nickname}</h2>
                    {message.pinned ? (
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase text-[var(--accent)]">
                        <Pin aria-hidden="true" size={12} />
                        置顶
                      </span>
                    ) : null}
                    <span className="font-mono text-[10px] uppercase text-[var(--muted)]">
                      {statusLabel[message.status]} · {message.colorKey}
                    </span>
                  </div>
                  <time
                    className="mt-2 block text-xs text-[var(--muted)]"
                    dateTime={message.createdAt.toISOString()}
                  >
                    {dateFormatter.format(message.createdAt)}
                  </time>
                </div>
                {message.website ? (
                  <Link
                    className="inline-flex min-h-11 items-center gap-2 text-sm text-[var(--accent)]"
                    href={message.website}
                    rel="noreferrer"
                    target="_blank"
                  >
                    访问站点
                    <ExternalLink aria-hidden="true" size={14} />
                  </Link>
                ) : null}
              </div>
              <div className="grid gap-5 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)]">
                <div>
                  <p className="whitespace-pre-wrap text-sm leading-7">{message.content}</p>
                  {message.replyContent ? (
                    <div className="mt-5 border-l-2 border-[var(--accent)] pl-4">
                      <p className="text-xs font-medium text-[var(--accent)]">当前站长回复</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[var(--muted)]">
                        {message.replyContent}
                      </p>
                      {message.repliedAt ? (
                        <time
                          className="mt-2 block text-[11px] text-[var(--muted)]"
                          dateTime={message.repliedAt.toISOString()}
                        >
                          {dateFormatter.format(message.repliedAt)}
                        </time>
                      ) : null}
                    </div>
                  ) : null}
                </div>
                <div className="grid content-start gap-3">
                  <GardenActionForm
                    action={moderateGuestbookMessage}
                    className="grid gap-3"
                    successMessage="留言审核信息已保存。"
                  >
                    <input name="id" type="hidden" value={message.id} />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="grid gap-2 text-sm">
                        <span>审核状态</span>
                        <select
                          className="min-h-11 border border-[var(--line)] bg-[var(--canvas)] px-3"
                          defaultValue={message.status}
                          name="status"
                        >
                          {statuses.map((item) => (
                            <option key={item} value={item}>
                              {statusLabel[item]}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="flex min-h-11 items-center gap-3 self-end border-y border-[var(--line)] px-2 text-sm">
                        <input
                          className="size-4 accent-[var(--accent)]"
                          defaultChecked={message.pinned}
                          name="pinned"
                          type="checkbox"
                          value="true"
                        />
                        置顶留言
                      </label>
                    </div>
                    <label className="grid gap-2 text-sm">
                      <span>站长回复</span>
                      <textarea
                        className="min-h-28 resize-y border border-[var(--line)] bg-transparent p-3 leading-6 outline-none focus:border-[var(--accent)]"
                        defaultValue={message.replyContent ?? ""}
                        maxLength={3000}
                        name="replyContent"
                      />
                    </label>
                    <SubmitButton className="w-full" pendingLabel="正在保存审核…">
                      保存审核与回复
                    </SubmitButton>
                  </GardenActionForm>
                  <GardenActionForm
                    action={deleteGuestbookMessage}
                    className="flex justify-end"
                    successMessage="留言已删除。"
                  >
                    <input name="id" type="hidden" value={message.id} />
                    <ConfirmButton message={`确定永久删除 ${message.nickname} 的这条留言？`}>
                      <span className="inline-flex min-h-11 items-center gap-2">
                        <Trash2 aria-hidden="true" size={15} />
                        删除留言
                      </span>
                    </ConfirmButton>
                  </GardenActionForm>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="grid min-h-72 place-items-center border-y border-[var(--line)] text-center">
          <div>
            <MessageCircleMore aria-hidden="true" className="mx-auto mb-4 text-[var(--muted)]" size={34} strokeWidth={1.2} />
            <p className="font-medium">没有匹配的留言</p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              新留言提交后会进入待审核队列。
            </p>
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
