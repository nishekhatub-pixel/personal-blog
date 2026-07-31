import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PetalField } from "@/components/site/atmosphere/petal-field";
import { AnimatedList } from "@/components/site/home/animated-list";
import { ContentCalendar } from "@/components/site/home/content-calendar";
import { PhotoCarousel } from "@/components/site/home/photo-carousel";
import { CompactAudioPlayer } from "@/components/site/music/audio-player";
import { WeatherCard } from "@/components/site/weather/weather-card";
import { getSiteSettings } from "@/lib/data";
import { db } from "@/lib/db";
import {
  getCurrentMonthCalendarMarkers,
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
  const [mixedItems, markers, heroSlides] = await Promise.all([
    getGardenMixedContent(8),
    getCurrentMonthCalendarMarkers({
      month: calendar.month,
      timeZone: settings.timezone,
      year: calendar.year,
    }),
    db.heroSlide.findMany({
      include: { media: true },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      where: { visible: true },
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
  return (
    <main className="home-page" id="main-content">
      <h1 className="sr-only">R7 Digital Garden</h1>
      <PetalField seed="r7-home-garden" />
      <PhotoCarousel
        slides={heroSlides.map((slide) => ({
          alt: slide.alt || slide.media.alt,
          id: slide.id,
          src: slide.media.url,
        }))}
      />
      <div className="home-layout">
        <aside className="home-profile-column">
          <section className="home-panel home-profile" aria-labelledby="profile-name">
            <div className="home-profile__identity">
              <ProfileAvatar
                name="R7's Garden"
                url={settings.profileAvatar}
              />
              <h2 id="profile-name">R7&apos;s Garden</h2>
              <ul className="home-profile__tags" aria-label="个人标签">
                <li>
                  <span aria-hidden="true">🌱</span>
                  软件技术学生
                </li>
                <li>
                  <span aria-hidden="true">🎹</span>
                  Piano
                </li>
                <li>
                  <span aria-hidden="true">🏸</span>
                  Sports
                </li>
                <li>
                  <span aria-hidden="true">💻</span>
                  Coding
                </li>
              </ul>
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
