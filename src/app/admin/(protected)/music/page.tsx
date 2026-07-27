import type { AudioSourceType, ContentStatus, Prisma } from "@prisma/client";
import { Disc3, Edit3, FileAudio, Radio, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { deleteMusicTrack } from "@/actions/garden-admin";
import { ConfirmButton, SearchField } from "@/components/admin/AdminControls";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { GardenActionForm } from "@/components/admin/GardenActionForm";
import { Pagination } from "@/components/admin/Pagination";
import { db } from "@/lib/db";

const PAGE_SIZE = 15;
const statuses = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
const sources = ["UPLOAD", "REMOTE"] as const;
const statusLabel = {
  ARCHIVED: "已归档",
  DRAFT: "草稿",
  PUBLISHED: "已发布",
} as const;
const sourceLabel = {
  REMOTE: "远程音频",
  UPLOAD: "本站上传",
} as const;

export default async function AdminMusicPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const rawStatus = typeof params.status === "string" ? params.status : "";
  const rawSource = typeof params.source === "string" ? params.source : "";
  const status = statuses.includes(rawStatus as (typeof statuses)[number])
    ? (rawStatus as ContentStatus)
    : undefined;
  const sourceType = sources.includes(rawSource as (typeof sources)[number])
    ? (rawSource as AudioSourceType)
    : undefined;
  const rawPage = Number(typeof params.page === "string" ? params.page : "1");
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
  const where: Prisma.MusicTrackWhereInput = {
    ...(sourceType ? { sourceType } : {}),
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q } },
            { artist: { contains: q } },
            { album: { contains: q } },
            { note: { contains: q } },
          ],
        }
      : {}),
  };
  const [tracks, count] = await Promise.all([
    db.musicTrack.findMany({
      include: {
        _count: { select: { playlists: true } },
        coverMedia: { select: { alt: true, url: true } },
      },
      orderBy: [
        { featured: "desc" },
        { favorite: "desc" },
        { publishedAt: "desc" },
        { createdAt: "desc" },
      ],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      where,
    }),
    db.musicTrack.count({ where }),
  ]);
  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <>
      <AdminHeader
        action={{ href: "/admin/music/new", label: "添加曲目" }}
        description="管理本站上传与远程 HTTPS 音频，维护封面、歌词、私人注记及公开状态。"
        eyebrow="GARDEN / MUSIC"
        title="音乐"
      />

      <form className="mb-7 grid gap-3 border-b border-[var(--line)] pb-6 md:grid-cols-[minmax(14rem,1fr)_12rem_12rem_auto]" method="get">
        <SearchField defaultValue={q} placeholder="搜索曲目、艺术家、专辑或注记" />
        <label>
          <span className="sr-only">按音频来源筛选</span>
          <select
            className="min-h-11 w-full border border-[var(--line)] bg-[var(--canvas)] px-3 text-sm"
            defaultValue={sourceType ?? ""}
            name="source"
          >
            <option value="">全部来源</option>
            {sources.map((source) => (
              <option key={source} value={source}>
                {sourceLabel[source]}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">按状态筛选</span>
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

      {tracks.length ? (
        <ul className="grid border-l border-t border-[var(--line)] lg:grid-cols-2">
          {tracks.map((track) => (
            <li className="grid min-w-0 grid-cols-[5rem_minmax(0,1fr)] border-b border-r border-[var(--line)]" key={track.id}>
              <div className="relative m-4 mr-0 aspect-square overflow-hidden bg-[color-mix(in_srgb,var(--ink)_6%,transparent)]">
                {track.coverMedia ? (
                  <Image
                    alt={track.coverMedia.alt}
                    className="object-cover"
                    fill
                    sizes="80px"
                    src={track.coverMedia.url}
                  />
                ) : (
                  <Disc3 aria-hidden="true" className="absolute inset-0 m-auto text-[var(--muted)]" size={28} strokeWidth={1.3} />
                )}
              </div>
              <div className="min-w-0 p-4">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      className="block truncate font-semibold hover:text-[var(--accent)]"
                      href={`/admin/music/${track.id}/edit`}
                    >
                      {track.title}
                    </Link>
                    <p className="mt-1 truncate text-sm text-[var(--muted)]">
                      {track.artist || "未填写艺术家"}
                      {track.album ? ` · ${track.album}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-[10px] text-[var(--muted)]">
                    {statusLabel[track.status]}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[var(--muted)]">
                  <span className="inline-flex items-center gap-1.5">
                    {track.sourceType === "UPLOAD" ? (
                      <FileAudio aria-hidden="true" size={14} />
                    ) : (
                      <Radio aria-hidden="true" size={14} />
                    )}
                    {sourceLabel[track.sourceType]}
                  </span>
                  <span>{track.durationSeconds ? `${track.durationSeconds} 秒` : "时长未填写"}</span>
                  <span>{track._count.playlists} 个歌单</span>
                  {track.favorite ? <span>喜欢</span> : null}
                  {track.featured ? <span>精选</span> : null}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-[var(--line)] pt-2">
                  <Link
                    className="inline-flex min-h-11 items-center gap-2 text-sm text-[var(--accent)]"
                    href={`/admin/music/${track.id}/edit`}
                  >
                    <Edit3 aria-hidden="true" size={15} />
                    编辑
                  </Link>
                  <GardenActionForm action={deleteMusicTrack} successMessage="曲目已删除。">
                    <input name="id" type="hidden" value={track.id} />
                    <ConfirmButton message={`确定删除曲目“${track.title}”？本站上传的音频文件也会被清理。`}>
                      <span className="grid size-11 place-items-center">
                        <span className="sr-only">删除曲目“{track.title}”</span>
                        <Trash2 aria-hidden="true" size={15} />
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
            <Disc3 aria-hidden="true" className="mx-auto mb-4 text-[var(--muted)]" size={34} strokeWidth={1.2} />
            <p className="font-medium">没有匹配的曲目</p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              可上传你有权使用的音频，或登记公开的 HTTPS 音频地址。
            </p>
          </div>
        </div>
      )}
      <Pagination
        page={Math.min(page, pageCount)}
        pageCount={pageCount}
        searchParams={{ q, source: sourceType, status }}
      />
    </>
  );
}
