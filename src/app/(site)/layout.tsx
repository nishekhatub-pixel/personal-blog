import type { ReactNode } from "react";
import { AtmosphereProvider } from "@/components/site/atmosphere/atmosphere-provider";
import {
  AudioPlayerProvider,
  type AudioTrack,
} from "@/components/site/music/audio-player-provider";
import { MobileDock } from "@/components/site/navigation/mobile-dock";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { getSiteSettings } from "@/lib/data";
import { db } from "@/lib/db";
import { getPublishedMusicTracks } from "@/lib/garden-data";

function petalDensity(value: string): "high" | "low" | "medium" {
  return value === "medium" || value === "high" ? value : "low";
}

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const now = new Date();
  const published = {
    publishedAt: { lte: now },
    status: "PUBLISHED" as const,
  };
  const [
    settings,
    music,
    pageViews,
    latestPost,
    latestProject,
    latestMoment,
    latestPhoto,
    latestTrack,
  ] = await Promise.all([
    getSiteSettings(),
    getPublishedMusicTracks({ pageSize: 50 }),
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
  const tracks: AudioTrack[] =
    settings.musicEnabled === "true"
      ? music.items.map((track) => ({
          album: track.album,
          artist: track.artist,
          audioUrl: track.audioUrl,
          coverAlt: track.coverMedia?.alt ?? null,
          coverUrl: track.coverMedia?.url ?? null,
          durationSeconds: track.durationSeconds,
          id: track.id,
          lyrics: track.lyrics,
          note: track.note,
          title: track.title,
        }))
      : [];
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

  return (
    <AtmosphereProvider
      adminEnabled={settings.petalsEnabled === "true"}
      density={petalDensity(settings.petalsDensity)}
    >
      <AudioPlayerProvider tracks={tracks}>
        <div className="site-shell" id="top">
          <SiteHeader
            announcement={settings.noticeText || settings.nowText}
            siteName={settings.siteName}
          />
          {children}
          <SiteFooter
            latestUpdateIso={latestUpdate?.toISOString() ?? null}
            pageViews={pageViews}
            siteLaunchDate={settings.siteLaunchDate}
            siteName={settings.siteName}
            siteSubtitle={settings.siteSubtitle}
          />
          <MobileDock />
        </div>
      </AudioPlayerProvider>
    </AtmosphereProvider>
  );
}
