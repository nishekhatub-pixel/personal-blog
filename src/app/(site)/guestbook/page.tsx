import { LockKeyhole, MessageSquareText, Pin } from "lucide-react";
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { Pagination } from "@/components/content/pagination";
import { PetalField } from "@/components/site/atmosphere/petal-field";
import { GuestbookForm } from "@/components/site/guestbook/guestbook-form";
import { getSiteSettings } from "@/lib/data";
import { getApprovedGuestbookMessages } from "@/lib/garden-data";

export const metadata: Metadata = {
  title: "留言墙",
  description: "在 R7 的数字花园留下一句真实、友善的话。",
  alternates: { canonical: "/guestbook" },
};
export const dynamic = "force-dynamic";

const noteColors: Record<string, string> = {
  sand: "color-mix(in srgb, var(--surface) 72%, #e9c985 28%)",
  sage: "color-mix(in srgb, var(--surface) 72%, #9eb89e 28%)",
  peach: "color-mix(in srgb, var(--surface) 70%, #e9a174 30%)",
  rose: "color-mix(in srgb, var(--surface) 74%, #d79a9a 26%)",
  stone: "color-mix(in srgb, var(--surface) 78%, #9c9187 22%)",
};

function pageNumber(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? "1", 10);
  return Number.isFinite(parsed) ? Math.max(1, parsed) : 1;
}

function enabled(value: string | undefined) {
  return value?.trim().toLocaleLowerCase("en-US") !== "false";
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(value);
}

export default async function GuestbookPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const query = await searchParams;
  const [settings, messages] = await Promise.all([
    getSiteSettings(),
    getApprovedGuestbookMessages({
      page: pageNumber(query.page),
      pageSize: 12,
    }),
  ]);
  const formEnabled = enabled(settings.guestbookEnabled);
  const spans = [
    "md:col-span-3",
    "md:col-span-3",
    "md:col-span-2",
    "md:col-span-4",
  ];

  return (
    <main id="main-content">
      <PetalField className="opacity-45" seed="r7-guestbook" />
      <header className="px-[var(--page-gutter)] pb-12 pt-[clamp(3.5rem,8vw,7rem)]">
        <div className="mx-auto max-w-[var(--content-max)]">
          <p className="mb-4 text-sm font-semibold text-[var(--accent)]">
            公开留言
          </p>
          <h1 className="max-w-4xl text-[clamp(3rem,7vw,6rem)] font-black leading-[.92] tracking-[-.07em]">
            留言墙
          </h1>
          <p className="mt-6 max-w-[56ch] text-lg leading-8 text-[var(--muted)]">
            把一句真诚的话留在这里。公开留言经过审核，不展示邮箱、IP 或其他隐私信息。
          </p>
        </div>
      </header>

      <section className="px-[var(--page-gutter)] pb-[clamp(5rem,10vw,9rem)]">
        <div className="mx-auto grid max-w-[var(--content-max)] gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(20rem,.75fr)] xl:items-start">
          <div>
            <h2 className="sr-only">公开留言墙</h2>
            {messages.items.length ? (
              <>
                <ol className="grid gap-4 md:grid-cols-6">
                  {messages.items.map((message, index) => (
                    <li
                      key={message.id}
                      className={`${spans[index % spans.length]} min-w-0`}
                    >
                      <article
                        className="flex h-full min-h-52 flex-col rounded-[var(--radius-media,.75rem)] border border-[var(--line)] p-5 shadow-[var(--shadow)] md:p-6"
                        style={
                          {
                            background:
                              noteColors[message.colorKey] ?? noteColors.sand,
                          } as CSSProperties
                        }
                      >
                        <div className="flex items-start justify-between gap-4">
                          {message.website ? (
                            <a
                              href={message.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="min-h-11 font-semibold underline decoration-[var(--line-strong)] underline-offset-4"
                            >
                              {message.nickname}
                            </a>
                          ) : (
                            <p className="font-semibold">{message.nickname}</p>
                          )}
                          {message.pinned ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)]">
                              <Pin aria-hidden size={14} />
                              置顶
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-5 whitespace-pre-wrap break-words leading-8">
                          {message.content}
                        </p>
                        {message.replyContent ? (
                          <blockquote className="mt-5 border-l-2 border-[var(--accent)] pl-4 text-sm leading-7 text-[var(--muted)]">
                            <span className="font-semibold text-[var(--ink)]">R7 回复：</span>
                            {message.replyContent}
                          </blockquote>
                        ) : null}
                        <time
                          dateTime={message.createdAt.toISOString()}
                          className="mt-auto pt-6 text-xs text-[var(--muted)]"
                        >
                          {formatDate(message.createdAt)}
                        </time>
                      </article>
                    </li>
                  ))}
                </ol>
                <Pagination page={messages.page} totalPages={messages.totalPages} />
              </>
            ) : (
              <div className="grid min-h-[28rem] place-items-center rounded-[var(--radius-panel,1.125rem)] border border-[var(--line)] bg-[var(--surface)] px-6 text-center shadow-[var(--shadow)]">
                <div className="max-w-lg">
                  <MessageSquareText
                    aria-hidden
                    className="mx-auto text-[var(--accent)]"
                    size={34}
                    strokeWidth={1.4}
                  />
                  <h2 className="mt-6 text-[clamp(2rem,4vw,3rem)] font-semibold tracking-[-.05em]">
                    还没有公开留言
                  </h2>
                  <p className="mt-4 leading-8 text-[var(--muted)]">
                    第一张便签会来自真实访客，并在审核通过后出现在这里。
                  </p>
                </div>
              </div>
            )}
          </div>

          <aside className="xl:sticky xl:top-[calc(var(--header-height)+1.5rem)]">
            {formEnabled ? (
              <GuestbookForm />
            ) : (
              <div className="rounded-[var(--radius-panel,1.125rem)] border border-[var(--line)] bg-[var(--surface)] p-7 shadow-[var(--shadow)]">
                <LockKeyhole
                  aria-hidden
                  className="text-[var(--accent)]"
                  size={28}
                  strokeWidth={1.5}
                />
                <h2 className="mt-5 text-2xl font-semibold tracking-[-.04em]">
                  留言提交暂时关闭
                </h2>
                <p className="mt-3 leading-7 text-[var(--muted)]">
                  已审核的留言仍然可以阅读。开放时间会在这里说明。
                </p>
              </div>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}
