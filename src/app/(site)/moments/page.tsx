import {
  CalendarDays,
  CloudSun,
  MessageSquareText,
  Pin,
  Smile,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { Pagination } from "@/components/content/pagination";
import {
  MomentInteractions,
  type PublicMomentComment,
} from "@/components/site/moments/moment-interactions";
import { getSiteSettings } from "@/lib/data";
import {
  getMomentById,
  getPublishedMoments,
  type PublicMoment,
} from "@/lib/garden-data";

export const metadata: Metadata = {
  title: "说说",
  description: "R7 按时间留下的日常片段、心情与现场照片。",
  alternates: { canonical: "/moments" },
};
export const dynamic = "force-dynamic";

function pageNumber(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? "1", 10);
  return Number.isFinite(parsed) ? Math.max(1, parsed) : 1;
}

function settingEnabled(value: string | undefined) {
  return value?.trim().toLocaleLowerCase("en-US") !== "false";
}

function momentDate(moment: PublicMoment) {
  return moment.publishedAt ?? moment.createdAt;
}

function validatedTimeZone(value: string) {
  try {
    new Intl.DateTimeFormat("zh-CN", { timeZone: value }).format();
    return value;
  } catch {
    return "Asia/Shanghai";
  }
}

function formatDate(value: Date, timeZone: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).format(value);
}

function monthKey(value: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    timeZone,
  }).formatToParts(value);
  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "00";
  return `${year}-${month}`;
}

function monthLabel(key: string) {
  const [year, month] = key.split("-");
  return `${year} 年 ${Number(month)} 月`;
}

type MomentDetail = NonNullable<
  Awaited<ReturnType<typeof getMomentById>>
>;

function serializeComments(
  comments: MomentDetail["comments"] | undefined,
): PublicMomentComment[] {
  return (comments ?? []).map((comment) => ({
    id: comment.id,
    authorName: comment.authorName,
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
    replies: comment.replies.map((reply) => ({
      id: reply.id,
      authorName: reply.authorName,
      content: reply.content,
      createdAt: reply.createdAt.toISOString(),
    })),
  }));
}

function MomentCard({
  comments,
  commentsEnabled,
  moment,
  reactionsEnabled,
  timeZone,
}: {
  comments: PublicMomentComment[];
  commentsEnabled: boolean;
  moment: PublicMoment;
  reactionsEnabled: boolean;
  timeZone: string;
}) {
  const date = momentDate(moment);

  return (
    <article
      id={`moment-${moment.id}`}
      className="min-w-0 rounded-[var(--radius-panel,1.125rem)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow)] md:p-7"
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <time
          dateTime={date.toISOString()}
          className="inline-flex min-h-11 items-center gap-2 text-sm text-[var(--muted)]"
        >
          <CalendarDays aria-hidden size={16} />
          {formatDate(date, timeZone)}
        </time>
        {moment.pinned ? (
          <span className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-[var(--accent)]">
            <Pin aria-hidden size={16} />
            置顶
          </span>
        ) : null}
      </header>

      <p className="mt-3 whitespace-pre-wrap break-words text-[1.0625rem] leading-8">
        {moment.content}
      </p>

      {moment.mood || moment.weather ? (
        <ul className="mt-5 flex flex-wrap gap-2" aria-label="心情与天气">
          {moment.mood ? (
            <li className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-[var(--accent-soft)] px-3 text-sm text-[var(--accent)]">
              <Smile aria-hidden size={15} />
              {moment.mood}
            </li>
          ) : null}
          {moment.weather ? (
            <li className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[var(--line)] px-3 text-sm text-[var(--muted)]">
              <CloudSun aria-hidden size={15} />
              {moment.weather}
            </li>
          ) : null}
        </ul>
      ) : null}

      {moment.media.length ? (
        <ol
          className={[
            "mt-6 gap-3",
            moment.media.length === 1
              ? "columns-1"
              : "columns-1 sm:columns-2",
          ].join(" ")}
          aria-label="说说照片"
        >
          {moment.media.map((item) => {
            const width = item.media.width ?? 1400;
            const height = item.media.height ?? 1050;
            return (
              <li
                key={item.id}
                className="mb-3 break-inside-avoid overflow-hidden rounded-[var(--radius-media,.75rem)] border border-[var(--line)] bg-[var(--surface-strong)]"
              >
                <figure>
                  <Image
                    src={item.media.url}
                    width={width}
                    height={height}
                    alt={item.alt || item.media.alt}
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="h-auto w-full"
                  />
                  {item.caption ? (
                    <figcaption className="px-4 py-3 text-sm leading-6 text-[var(--muted)]">
                      {item.caption}
                    </figcaption>
                  ) : null}
                </figure>
              </li>
            );
          })}
        </ol>
      ) : null}

      <MomentInteractions
        comments={comments}
        commentsEnabled={commentsEnabled}
        initialCommentCount={moment._count.comments}
        initialReactionCount={moment._count.reactions}
        momentId={moment.id}
        reactionsEnabled={reactionsEnabled}
      />
    </article>
  );
}

export default async function MomentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const query = await searchParams;
  const [settings, moments] = await Promise.all([
    getSiteSettings(),
    getPublishedMoments({
      page: pageNumber(query.page),
      pageSize: 12,
    }),
  ]);
  const details = await Promise.all(
    moments.items.map((moment) => getMomentById(moment.id)),
  );
  const detailById = new Map(
    details.flatMap((detail) => (detail ? [[detail.id, detail] as const] : [])),
  );
  const commentsEnabled = settingEnabled(settings.commentsEnabled);
  const reactionsEnabled = true;
  const timeZone = validatedTimeZone(settings.timezone);
  const pinned = moments.items.filter((moment) => moment.pinned);
  const unpinned = moments.items.filter((moment) => !moment.pinned);
  const groups = new Map<string, PublicMoment[]>();
  for (const moment of unpinned) {
    const key = monthKey(momentDate(moment), timeZone);
    groups.set(key, [...(groups.get(key) ?? []), moment]);
  }

  return (
    <main id="main-content">
      <header className="px-[var(--page-gutter)] pb-12 pt-[clamp(3.5rem,8vw,7rem)]">
        <div className="mx-auto max-w-[var(--content-max)]">
          <p className="mb-4 text-sm font-semibold text-[var(--accent)]">
            日常时间线
          </p>
          <h1 className="max-w-4xl text-[clamp(3rem,7vw,6rem)] font-black leading-[.92] tracking-[-.07em]">
            说说
          </h1>
          <div className="mt-6 flex flex-wrap items-end justify-between gap-5">
            <p className="max-w-[58ch] text-lg leading-8 text-[var(--muted)]">
              记录无法长成文章的片刻。文字、心情、天气与照片，都来自真实发布的日常。
            </p>
            <p className="font-mono text-sm text-[var(--muted)]">
              {moments.total} 条公开记录
            </p>
          </div>
        </div>
      </header>

      <section className="px-[var(--page-gutter)] pb-[clamp(5rem,10vw,9rem)]">
        <div className="mx-auto max-w-4xl">
          {moments.items.length ? (
            <>
              {pinned.length ? (
                <section aria-labelledby="pinned-moments-heading">
                  <div className="mb-5 flex items-center gap-3">
                    <Pin aria-hidden className="text-[var(--accent)]" size={18} />
                    <h2
                      id="pinned-moments-heading"
                      className="text-xl font-semibold"
                    >
                      置顶片段
                    </h2>
                  </div>
                  <ol className="space-y-5">
                    {pinned.map((moment) => (
                      <li key={moment.id}>
                        <MomentCard
                          comments={serializeComments(
                            detailById.get(moment.id)?.comments,
                          )}
                          commentsEnabled={commentsEnabled}
                          moment={moment}
                          reactionsEnabled={reactionsEnabled}
                          timeZone={timeZone}
                        />
                      </li>
                    ))}
                  </ol>
                </section>
              ) : null}

              {groups.size ? (
                <div className={pinned.length ? "mt-14" : ""}>
                  {Array.from(groups, ([key, items]) => (
                    <section
                      key={key}
                      aria-labelledby={`moment-month-${key}`}
                      className="relative pb-14 last:pb-0"
                    >
                      <div className="mb-6 flex items-center gap-3">
                        <span className="size-2.5 rounded-full bg-[var(--accent)]" />
                        <h2
                          id={`moment-month-${key}`}
                          className="text-2xl font-semibold tracking-[-.04em]"
                        >
                          {monthLabel(key)}
                        </h2>
                      </div>
                      <ol className="relative space-y-6 border-l border-[var(--line)] pl-5 md:pl-8">
                        {items.map((moment) => (
                          <li key={moment.id} className="relative">
                            <span
                              aria-hidden
                              className="absolute -left-[1.56rem] top-8 size-3 rounded-full border-2 border-[var(--surface)] bg-[var(--line-strong)] md:-left-[2.31rem]"
                            />
                            <MomentCard
                              comments={serializeComments(
                                detailById.get(moment.id)?.comments,
                              )}
                              commentsEnabled={commentsEnabled}
                              moment={moment}
                              reactionsEnabled={reactionsEnabled}
                              timeZone={timeZone}
                            />
                          </li>
                        ))}
                      </ol>
                    </section>
                  ))}
                </div>
              ) : null}

              <Pagination page={moments.page} totalPages={moments.totalPages} />
            </>
          ) : (
            <div className="grid min-h-[28rem] place-items-center rounded-[var(--radius-panel,1.125rem)] border border-[var(--line)] bg-[var(--surface)] px-6 text-center shadow-[var(--shadow)]">
              <div className="max-w-lg">
                <MessageSquareText
                  aria-hidden
                  className="mx-auto text-[var(--accent)]"
                  size={36}
                  strokeWidth={1.4}
                />
                <h2 className="mt-6 text-[clamp(2rem,4vw,3rem)] font-semibold tracking-[-.05em]">
                  时间线还是空的
                </h2>
                <p className="mt-4 leading-8 text-[var(--muted)]">
                  第一条真实说说发布后，会按年月出现在这里。
                </p>
              </div>
            </div>
          )}

          {!commentsEnabled && !reactionsEnabled && moments.items.length ? (
            <p className="mt-8 rounded-[var(--radius-control,.625rem)] border border-[var(--line)] bg-[var(--surface)] p-4 text-sm leading-7 text-[var(--muted)]">
              互动功能目前关闭。公开的文字、照片与既有评论仍可正常阅读。
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
