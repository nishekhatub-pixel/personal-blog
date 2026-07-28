import {
  ExternalLink,
  LockKeyhole,
  MessageSquareText,
  Pin,
  Sprout,
} from "lucide-react";
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
  sand: "color-mix(in srgb, var(--surface) 74%, #f4d88d 26%)",
  sage: "color-mix(in srgb, var(--surface) 74%, #b8d2b4 26%)",
  peach: "color-mix(in srgb, var(--surface) 72%, #efb7aa 28%)",
  rose: "color-mix(in srgb, var(--surface) 75%, #d7c0e8 25%)",
  stone: "color-mix(in srgb, var(--surface) 74%, #b9d7e8 26%)",
};

const fallbackColors = [
  noteColors.stone,
  noteColors.rose,
  noteColors.sand,
  noteColors.sage,
  noteColors.peach,
];

const noteAngles = [
  "-rotate-[0.8deg]",
  "rotate-[1.1deg]",
  "-rotate-[0.45deg]",
  "rotate-[0.65deg]",
  "-rotate-[1deg]",
  "rotate-[0.35deg]",
];

function pageNumber(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? "1", 10);
  return Number.isFinite(parsed) ? Math.max(1, parsed) : 1;
}

function enabled(value: string | undefined) {
  return value?.trim().toLocaleLowerCase("en-US") !== "false";
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
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

  return (
    <main
      id="main-content"
      className="relative isolate overflow-hidden pb-[max(5rem,env(safe-area-inset-bottom))]"
    >
      <PetalField className="opacity-35" seed="r7-guestbook" />

      <header className="relative px-[var(--page-gutter)] pb-10 pt-[clamp(3.75rem,8vw,7.5rem)] md:pb-14">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 -z-10 h-full bg-[radial-gradient(circle_at_18%_32%,color-mix(in_srgb,var(--accent)_10%,transparent),transparent_34%),radial-gradient(circle_at_82%_12%,color-mix(in_srgb,#c3d9eb_24%,transparent),transparent_30%)] opacity-80"
        />
        <div className="mx-auto max-w-[var(--content-max)]">
          <div className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--accent)_25%,var(--line))] bg-[color-mix(in_srgb,var(--surface)_88%,transparent)] px-4 text-sm font-semibold text-[var(--accent)] shadow-[0_10px_30px_color-mix(in_srgb,var(--accent)_8%,transparent)]">
            <Sprout aria-hidden size={17} strokeWidth={1.8} />
            花园来信
          </div>
          <h1 className="mt-6 max-w-4xl text-[clamp(3rem,5.5vw,5.25rem)] font-semibold leading-[1.02] tracking-[-.035em] text-[var(--ink)]">
            留下你的足迹
          </h1>
          <p className="mt-6 max-w-[44rem] text-base leading-8 text-[var(--muted)] md:text-lg">
            每一张便签，都是来访者留给这座数字花园的一点温暖。留言会先经过审核，邮箱、IP
            与其他隐私信息不会公开展示。
          </p>
        </div>
      </header>

      <section className="px-[var(--page-gutter)]">
        <div className="mx-auto grid max-w-[var(--content-max)] gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(20rem,.72fr)] xl:items-start xl:gap-8">
          <div className="order-2 min-w-0 xl:order-1">
            <div className="relative overflow-hidden rounded-[clamp(1.5rem,3vw,2.25rem)] border border-white/65 bg-[color-mix(in_srgb,var(--surface)_82%,#d9e7ef_18%)] p-4 shadow-[0_28px_80px_color-mix(in_srgb,var(--ink)_10%,transparent)] sm:p-7 lg:p-9">
              <div
                aria-hidden
                className="absolute inset-0 bg-[radial-gradient(circle_at_15%_12%,rgba(255,255,255,.75),transparent_26%),radial-gradient(circle_at_84%_88%,color-mix(in_srgb,var(--accent)_8%,transparent),transparent_32%)]"
              />
              <div className="relative mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-[color-mix(in_srgb,var(--line)_70%,transparent)] pb-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[.2em] text-[var(--accent)]">
                    Visitor notes
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-.025em] md:text-3xl">
                    花园里的便签
                  </h2>
                </div>
                <p className="text-sm text-[var(--muted)]">
                  {messages.total} 条已公开留言
                </p>
              </div>

              {messages.items.length ? (
                <>
                  <ol className="relative grid grid-cols-1 gap-5 sm:grid-cols-2 lg:gap-6">
                    {messages.items.map((message, index) => (
                      <li
                        key={message.id}
                        className={`min-w-0 py-1 motion-reduce:rotate-0 ${noteAngles[index % noteAngles.length]}`}
                      >
                        <article
                          className="group relative flex h-full min-h-[15rem] flex-col overflow-hidden rounded-[1.35rem_1.35rem_1.65rem_1.2rem] border border-white/60 p-5 shadow-[0_14px_30px_rgba(73,62,51,.12),0_2px_4px_rgba(73,62,51,.05)] transition duration-300 hover:-translate-y-1 hover:rotate-0 hover:shadow-[0_20px_38px_rgba(73,62,51,.16)] motion-reduce:transform-none motion-reduce:transition-none sm:p-6"
                          style={
                            {
                              background:
                                noteColors[message.colorKey] ??
                                fallbackColors[index % fallbackColors.length],
                            } as CSSProperties
                          }
                        >
                          {index % 3 === 1 ? (
                            <span
                              aria-hidden
                              className="absolute left-1/2 top-0 h-6 w-20 -translate-x-1/2 -translate-y-2 rotate-[-2deg] border-x border-white/35 bg-[rgba(247,231,194,.72)] shadow-sm"
                            />
                          ) : (
                            <span
                              aria-hidden
                              className="absolute left-1/2 top-3 grid size-7 -translate-x-1/2 place-items-center rounded-full bg-[color-mix(in_srgb,var(--accent)_72%,#7b91aa_28%)] text-white shadow-[0_5px_10px_rgba(65,55,50,.2)]"
                            >
                              <Pin size={14} strokeWidth={2} />
                            </span>
                          )}

                          <div className="mt-5 flex items-start justify-between gap-3">
                            {message.website ? (
                              <a
                                href={message.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex min-h-11 min-w-0 items-center gap-2 rounded-full px-1 font-semibold text-[var(--ink)] underline decoration-[color-mix(in_srgb,var(--accent)_45%,transparent)] decoration-2 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                              >
                                <span className="truncate">{message.nickname}</span>
                                <ExternalLink
                                  aria-hidden
                                  className="shrink-0 opacity-55"
                                  size={15}
                                />
                              </a>
                            ) : (
                              <p className="flex min-h-11 min-w-0 items-center font-semibold">
                                <span className="truncate">{message.nickname}</span>
                              </p>
                            )}
                            {message.pinned ? (
                              <span className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full bg-white/40 px-3 text-xs font-semibold text-[var(--accent)]">
                                <Pin aria-hidden size={14} />
                                置顶
                              </span>
                            ) : null}
                          </div>

                          <p className="mt-4 whitespace-pre-wrap break-words text-[1.02rem] leading-8 text-[var(--ink)]">
                            {message.content}
                          </p>

                          {message.replyContent ? (
                            <blockquote className="mt-5 rounded-2xl border border-white/55 bg-white/35 px-4 py-3 text-sm leading-7 text-[var(--muted)]">
                              <span className="mb-1 block font-semibold text-[var(--ink)]">
                                R7 的回复
                              </span>
                              {message.replyContent}
                            </blockquote>
                          ) : null}

                          <time
                            dateTime={message.createdAt.toISOString()}
                            className="mt-auto border-t border-[color-mix(in_srgb,var(--ink)_9%,transparent)] pt-5 text-xs tracking-[.03em] text-[var(--muted)]"
                          >
                            {formatDateTime(message.createdAt)}
                          </time>

                          <span
                            aria-hidden
                            className="absolute -bottom-5 -right-4 size-16 rounded-full border border-white/30 bg-white/20 transition-transform duration-300 group-hover:scale-110 motion-reduce:transition-none"
                          />
                        </article>
                      </li>
                    ))}
                  </ol>
                  <Pagination
                    page={messages.page}
                    totalPages={messages.totalPages}
                  />
                </>
              ) : (
                <div className="relative grid min-h-[26rem] place-items-center overflow-hidden rounded-[1.75rem] border border-dashed border-[color-mix(in_srgb,var(--accent)_28%,var(--line))] bg-[color-mix(in_srgb,var(--canvas)_62%,transparent)] px-6 text-center">
                  <span
                    aria-hidden
                    className="absolute left-[12%] top-[18%] h-32 w-28 -rotate-6 rounded-2xl bg-[color-mix(in_srgb,var(--surface)_72%,#b9d7e8_28%)] opacity-55 shadow-[0_14px_30px_rgba(73,62,51,.09)]"
                  />
                  <span
                    aria-hidden
                    className="absolute bottom-[12%] right-[10%] h-28 w-28 rotate-6 rounded-2xl bg-[color-mix(in_srgb,var(--surface)_72%,#efb7aa_28%)] opacity-55 shadow-[0_14px_30px_rgba(73,62,51,.09)]"
                  />
                  <div className="relative max-w-md rounded-[1.75rem] border border-white/70 bg-[color-mix(in_srgb,var(--surface)_90%,transparent)] px-7 py-10 shadow-[0_22px_55px_rgba(73,62,51,.1)] backdrop-blur-sm">
                    <MessageSquareText
                      aria-hidden
                      className="mx-auto text-[var(--accent)]"
                      size={36}
                      strokeWidth={1.45}
                    />
                    <h2 className="mt-6 text-[clamp(1.8rem,4vw,2.7rem)] font-semibold tracking-[-.035em]">
                      第一张便签，等你写下
                    </h2>
                    <p className="mt-4 leading-8 text-[var(--muted)]">
                      留言通过审核后会出现在这里。写一句问候、分享一个念头，或只是说声你好。
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <aside className="order-1 xl:order-2 xl:sticky xl:top-[calc(var(--header-height)+1.5rem)]">
            {formEnabled ? (
              <GuestbookForm />
            ) : (
              <div className="relative overflow-hidden rounded-[1.75rem] border border-[var(--line)] bg-[color-mix(in_srgb,var(--surface)_92%,transparent)] p-7 shadow-[0_20px_55px_color-mix(in_srgb,var(--ink)_9%,transparent)]">
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-2 bg-[color-mix(in_srgb,var(--accent)_65%,#efb7aa_35%)]"
                />
                <LockKeyhole
                  aria-hidden
                  className="text-[var(--accent)]"
                  size={29}
                  strokeWidth={1.5}
                />
                <h2 className="mt-5 text-2xl font-semibold tracking-[-.025em]">
                  留言提交暂时关闭
                </h2>
                <p className="mt-3 leading-7 text-[var(--muted)]">
                  已审核的留言仍然可以阅读。重新开放时，会在这里说明。
                </p>
              </div>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}
