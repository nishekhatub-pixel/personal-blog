import { ArrowLeft, CalendarDays } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getSiteSettings } from "@/lib/data";
import { getCurrentMonthCalendarMarkers } from "@/lib/garden-data";

export const metadata: Metadata = {
  title: "内容日历",
  description: "按日期回看 R7 Digital Garden 中公开的文章、项目、说说与照片。",
  alternates: { canonical: "/calendar" },
};
export const dynamic = "force-dynamic";

const typeLabels = {
  post: "文章",
  project: "项目",
  moment: "说说",
  photo: "照片",
} as const;

function validDate(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return { day, month, value, year };
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawDate = typeof params.date === "string" ? params.date : "";
  const selected = validDate(rawDate);
  const settings = await getSiteSettings();
  const now = new Date();
  const todayParts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      day: "2-digit",
      month: "2-digit",
      timeZone: settings.timezone,
      year: "numeric",
    })
      .formatToParts(now)
      .map((part) => [part.type, part.value]),
  );
  const fallback = {
    day: Number(todayParts.day),
    month: Number(todayParts.month),
    value: [
      todayParts.year,
      todayParts.month,
      todayParts.day,
    ].join("-"),
    year: Number(todayParts.year),
  };
  const date = selected ?? fallback;
  const markers = await getCurrentMonthCalendarMarkers({
    year: date.year,
    month: date.month,
    timeZone: settings.timezone,
  });
  const marker = markers.find((item) => item.date === date.value);
  const formattedDate = new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "full",
    timeZone: settings.timezone,
  }).format(new Date(`${date.value}T12:00:00Z`));

  return (
    <main className="px-[var(--page-gutter)] py-[clamp(3rem,8vw,7rem)]" id="main-content">
      <div className="mx-auto max-w-[58rem]">
        <Link
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--muted)] hover:text-[var(--ink)]"
          href="/"
        >
          <ArrowLeft aria-hidden="true" size={17} />
          返回首页日历
        </Link>
        <header className="mt-8 border-b border-[var(--line)] pb-8">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
            Content calendar
          </p>
          <h1 className="mt-3 text-[clamp(2.7rem,7vw,5.8rem)] font-semibold tracking-[-.065em]">
            {formattedDate}
          </h1>
          <p className="mt-5 max-w-2xl leading-8 text-[var(--muted)]">
            日历只汇总已经公开的文章、项目更新、说说与照片，不展示草稿或审核中的互动内容。
          </p>
        </header>

        {marker ? (
          <section className="mt-10" aria-labelledby="day-summary">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-2xl font-semibold" id="day-summary">
                当天内容摘要
              </h2>
              <p className="text-sm text-[var(--muted)]">
                {marker.count} 条 ·{" "}
                {marker.types.map((type) => typeLabels[type]).join("、")}
              </p>
            </div>
            <ul className="mt-5 divide-y divide-[var(--line)] border-y border-[var(--line)]">
              {marker.labels.map((label) => (
                <li className="py-5 leading-7" key={label}>
                  {label}
                </li>
              ))}
            </ul>
            {marker.count > marker.labels.length ? (
              <p className="mt-3 text-sm text-[var(--muted)]">
                还有 {marker.count - marker.labels.length} 条记录，可从对应内容页继续查看。
              </p>
            ) : null}
          </section>
        ) : (
          <section className="mt-10 rounded-[1.125rem] border border-dashed border-[var(--line)] bg-[var(--surface)] p-8">
            <CalendarDays aria-hidden="true" className="text-[var(--accent)]" size={30} />
            <h2 className="mt-5 text-2xl font-semibold">这一天没有公开记录</h2>
            <p className="mt-3 leading-7 text-[var(--muted)]">
              可以回到首页切换月份，或从归档、说说和照片墙继续浏览。
            </p>
          </section>
        )}

        <nav
          aria-label="继续浏览"
          className="mt-10 grid border-l border-t border-[var(--line)] sm:grid-cols-4"
        >
          {[
            ["/archive", "文章归档"],
            ["/projects", "项目"],
            ["/moments", "说说"],
            ["/photos", "照片墙"],
          ].map(([href, label]) => (
            <Link
              className="grid min-h-14 place-items-center border-b border-r border-[var(--line)] px-3 text-sm font-semibold hover:bg-[var(--surface)]"
              href={href}
              key={href}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </main>
  );
}
