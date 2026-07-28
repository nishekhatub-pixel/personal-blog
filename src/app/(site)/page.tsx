import {
  ArrowRight,
  BookOpenText,
  Camera,
  FolderKanban,
  Github,
  Mail,
  MessageCircle,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PetalField } from "@/components/site/atmosphere/petal-field";
import { AnimatedList } from "@/components/site/home/animated-list";
import { ContentCalendar } from "@/components/site/home/content-calendar";
import { PhotoCarousel } from "@/components/site/home/photo-carousel";
import { TimezoneClock } from "@/components/site/home/timezone-clock";
import { CompactAudioPlayer } from "@/components/site/music/audio-player";
import { WeatherCard } from "@/components/site/weather/weather-card";
import { getSiteSettings } from "@/lib/data";
import { db } from "@/lib/db";
import {
  getCurrentMonthCalendarMarkers,
  getGardenHomepageStats,
  getGardenMixedContent,
  type GardenMixedItem,
} from "@/lib/garden-data";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  description:
    "R7 的中文数字花园，记录软件技术学习、项目构建、照片、说说与音乐。",
  title: "首页",
};
export const dynamic = "force-dynamic";

const itemLabels = {
  moment: "说说",
  music: "音乐",
  photo: "照片",
  post: "文章",
  project: "项目",
} as const;

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function zonedDateParts(date: Date, timeZone: string) {
  let formatter: Intl.DateTimeFormat;
  try {
    formatter = new Intl.DateTimeFormat("en-CA", {
      day: "2-digit",
      month: "2-digit",
      timeZone,
      year: "numeric",
    });
  } catch {
    formatter = new Intl.DateTimeFormat("en-CA", {
      day: "2-digit",
      month: "2-digit",
      timeZone: "Asia/Shanghai",
      year: "numeric",
    });
  }
  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
  return {
    dateKey: `${parts.year}-${parts.month}-${parts.day}`,
    month: Number(parts.month),
    year: Number(parts.year),
  };
}

function runningDays(value: string) {
  if (!value) return null;
  const launch = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(launch.getTime())) return null;
  return Math.max(
    0,
    Math.floor((Date.now() - launch.getTime()) / 86_400_000) + 1,
  );
}

function ProfileAvatar({
  name,
  url,
}: {
  name: string;
  url: string;
}) {
  if (!url) {
    return (
      <div aria-label={`${name}文字标识`} className="home-profile__monogram" role="img">
        R7
      </div>
    );
  }
  if (url.startsWith("/")) {
    return (
      <div className="home-profile__avatar">
        <Image
          alt={`${name}的头像`}
          className="object-cover"
          fill
          sizes="88px"
          src={url}
        />
      </div>
    );
  }
  return (
    <div
      aria-label={`${name}的头像`}
      className="home-profile__avatar bg-cover bg-center"
      role="img"
      style={{ backgroundImage: `url(${JSON.stringify(url)})` }}
    />
  );
}

function StreamItem({
  item,
  photo,
}: {
  item: GardenMixedItem;
  photo?: { alt: string; url: string };
}) {
  return (
    <Link
      className={`group home-stream-item home-stream-item--${item.kind}`}
      href={item.href}
    >
      {item.kind === "photo" && photo ? (
        <div className="home-stream-item__media">
          <Image
            alt={photo.alt}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.025] motion-reduce:transition-none"
            fill
            sizes="(max-width: 768px) 100vw, 620px"
            src={photo.url}
          />
        </div>
      ) : null}
      <div className="home-stream-item__body">
        <div className="home-stream-item__meta">
          <span>{itemLabels[item.kind]}</span>
          <time dateTime={item.publishedAt.toISOString()}>
            {dateFormatter.format(item.publishedAt)}
          </time>
        </div>
        <h3>{item.title}</h3>
        <p>{item.summary}</p>
        <span className="home-stream-item__open">
          打开
          <ArrowRight aria-hidden="true" size={15} />
        </span>
      </div>
    </Link>
  );
}

export default async function HomePage() {
  const settings = await getSiteSettings();
  const now = new Date();
  const calendar = zonedDateParts(now, settings.timezone);
  const published = {
    publishedAt: { lte: now },
    status: "PUBLISHED" as const,
  };
  const [
    stats,
    mixedItems,
    markers,
    pageViews,
    latestPost,
    latestProject,
    latestMoment,
    latestPhoto,
    latestTrack,
  ] = await Promise.all([
    getGardenHomepageStats(),
    getGardenMixedContent(8),
    getCurrentMonthCalendarMarkers({
      month: calendar.month,
      timeZone: settings.timezone,
      year: calendar.year,
    }),
    db.pageView.count(),
    db.post.findFirst({
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
      where: published,
    }),
    db.project.findFirst({
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
      where: published,
    }),
    db.moment.findFirst({
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
      where: published,
    }),
    db.photo.findFirst({
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
      where: { ...published, album: published },
    }),
    db.musicTrack.findFirst({
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
      where: published,
    }),
  ]);
  const photoIds = mixedItems
    .filter((item) => item.kind === "photo")
    .map((item) => item.id);
  const photoRecords = photoIds.length
    ? await db.photo.findMany({
        select: {
          alt: true,
          id: true,
          media: { select: { url: true } },
        },
        where: { id: { in: photoIds } },
      })
    : [];
  const photoMap = new Map(
    photoRecords.map((photo) => [
      photo.id,
      { alt: photo.alt, url: photo.media.url },
    ]),
  );
  const days = runningDays(settings.siteLaunchDate);
  const latestUpdate =
    [
      latestPost?.updatedAt,
      latestProject?.updatedAt,
      latestMoment?.updatedAt,
      latestPhoto?.updatedAt,
      latestTrack?.updatedAt,
    ]
      .filter((date): date is Date => Boolean(date))
      .sort((left, right) => right.getTime() - left.getTime())[0] ?? null;
  const profileEmail = settings.email || settings.contactEmail;
  const statsRows = [
    {
      href: "/blog",
      icon: BookOpenText,
      label: "文章",
      value: stats.posts,
    },
    {
      href: "/projects",
      icon: FolderKanban,
      label: "项目",
      value: stats.projects,
    },
    {
      href: "/moments",
      icon: MessageCircle,
      label: "说说",
      value: stats.moments,
    },
    {
      href: "/photos",
      icon: Camera,
      label: "照片",
      value: stats.photos,
    },
  ];

  return (
    <main className="home-page" id="main-content">
      <h1 className="sr-only">R7 Digital Garden</h1>
      <PetalField seed="r7-home-garden" />
      <PhotoCarousel />
      <div className="home-layout">
        <aside className="home-profile-column">
          <section className="home-panel home-profile" aria-labelledby="profile-name">
            <div className="home-profile__identity">
              <ProfileAvatar
                name={settings.profileName}
                url={settings.profileAvatar}
              />
              <div className="min-w-0">
                <p className="home-profile__site">{settings.siteName}</p>
                <h2 id="profile-name">{settings.profileName}</h2>
                <p className="home-profile__role">软件技术专业学生</p>
                <p className="home-profile__bio">
                  {settings.profileBio || "个人简介尚未填写。"}
                </p>
                {settings.githubUrl || profileEmail ? (
                  <div className="home-profile__contacts">
                    {settings.githubUrl ? (
                      <Link href={settings.githubUrl} rel="noreferrer" target="_blank">
                        <Github aria-hidden="true" size={14} />
                        GitHub
                      </Link>
                    ) : null}
                    {profileEmail ? (
                      <Link href={`mailto:${profileEmail}`}>
                        <Mail aria-hidden="true" size={14} />
                        邮箱
                      </Link>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="home-profile__stats" aria-label="公开内容统计">
              {statsRows.map(({ href, icon: Icon, label, value }) => (
                <Link href={href} key={href}>
                  <Icon aria-hidden="true" size={15} strokeWidth={1.7} />
                  <span>{label}</span>
                  <strong>{value.toLocaleString("zh-CN")}</strong>
                </Link>
              ))}
            </div>

            <nav aria-label="个人快捷导航" className="home-profile__quick">
              <Link href="/archive">归档</Link>
              <Link href="/moments">说说</Link>
              <Link href="/photos">照片墙</Link>
              <Link href="/projects">开源项目</Link>
              <Link href="/friends">友链</Link>
              <Link href="/about">关于</Link>
            </nav>

            <div className="home-profile__runtime">
              <TimezoneClock
                initialIso={now.toISOString()}
                timeZone={settings.timezone}
              />
              <dl>
                <div>
                  <dt>运行天数</dt>
                  <dd>
                    {days !== null ? `${days.toLocaleString("zh-CN")} 天` : "未设置"}
                  </dd>
                </div>
                <div>
                  <dt>累计浏览</dt>
                  <dd>{pageViews.toLocaleString("zh-CN")}</dd>
                </div>
                <div>
                  <dt>最近更新</dt>
                  <dd>
                    {latestUpdate ? (
                      <time dateTime={latestUpdate.toISOString()}>
                        {dateFormatter.format(latestUpdate)}
                      </time>
                    ) : (
                      "暂无公开内容"
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </section>
        </aside>

        <div className="home-main-column">
          <section className="home-stream" aria-labelledby="home-stream-title">
            <div className="home-stream__heading">
              <div>
                <h2 id="home-stream-title">最近更新</h2>
                <p>文章、项目、说说、照片与音乐按时间汇入同一条内容流。</p>
              </div>
              <Link href="/archive">查看归档</Link>
            </div>
            {mixedItems.length ? (
              <AnimatedList className="home-stream__list">
                {mixedItems.map((item) => (
                  <StreamItem
                    item={item}
                    key={`${item.kind}-${item.id}`}
                    photo={photoMap.get(item.id)}
                  />
                ))}
              </AnimatedList>
            ) : (
              <div className="home-empty">
                <h3>公开内容还没有开始</h3>
                <p>发布第一篇文章、项目、说说、照片或曲目后，这里会按时间显示。</p>
              </div>
            )}
          </section>
        </div>

        <aside className="home-widget-column" aria-label="首页小工具">
          <CompactAudioPlayer />
          <WeatherCard />
          <ContentCalendar
            initialMarkers={markers}
            initialMonth={calendar.month}
            initialYear={calendar.year}
            todayKey={calendar.dateKey}
          />
        </aside>
      </div>
    </main>
  );
}
