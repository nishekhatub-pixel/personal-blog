import type { ContentStatus, Prisma } from "@prisma/client";
import { Edit3, ListMusic, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { deletePlaylist } from "@/actions/garden-admin";
import { ConfirmButton, SearchField } from "@/components/admin/AdminControls";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { GardenActionForm } from "@/components/admin/GardenActionForm";
import { Pagination } from "@/components/admin/Pagination";
import { db } from "@/lib/db";

const PAGE_SIZE = 12;
const statuses = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
const statusLabel = {
  ARCHIVED: "已归档",
  DRAFT: "草稿",
  PUBLISHED: "已发布",
} as const;

export default async function AdminPlaylistsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const rawStatus = typeof params.status === "string" ? params.status : "";
  const status = statuses.includes(rawStatus as (typeof statuses)[number])
    ? (rawStatus as ContentStatus)
    : undefined;
  const rawPage = Number(typeof params.page === "string" ? params.page : "1");
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
  const where: Prisma.PlaylistWhereInput = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q } },
            { slug: { contains: q } },
            { description: { contains: q } },
          ],
        }
      : {}),
  };
  const [playlists, count] = await Promise.all([
    db.playlist.findMany({
      include: {
        _count: { select: { tracks: true } },
        coverMedia: { select: { alt: true, url: true } },
      },
      orderBy: [
        { featured: "desc" },
        { position: "asc" },
        { publishedAt: "desc" },
        { createdAt: "desc" },
      ],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      where,
    }),
    db.playlist.count({ where }),
  ]);
  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <>
      <AdminHeader
        action={{ href: "/admin/playlists/new", label: "创建歌单" }}
        description="将真实曲目编入歌单，维护唯一排序、封面、说明和发布状态。"
        eyebrow="GARDEN / PLAYLISTS"
        title="歌单"
      />

      <form className="mb-7 grid gap-3 border-b border-[var(--line)] pb-6 md:grid-cols-[minmax(14rem,1fr)_12rem_auto]" method="get">
        <SearchField defaultValue={q} placeholder="搜索歌单名、Slug 或说明" />
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

      {playlists.length ? (
        <ul className="grid border-l border-t border-[var(--line)] sm:grid-cols-2 xl:grid-cols-3">
          {playlists.map((playlist) => (
            <li className="min-w-0 border-b border-r border-[var(--line)]" key={playlist.id}>
              <div className="relative aspect-[16/10] overflow-hidden bg-[color-mix(in_srgb,var(--ink)_5%,transparent)]">
                {playlist.coverMedia ? (
                  <Image
                    alt={playlist.coverMedia.alt}
                    className="object-cover"
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    src={playlist.coverMedia.url}
                  />
                ) : (
                  <ListMusic aria-hidden="true" className="absolute inset-0 m-auto text-[var(--muted)]" size={38} strokeWidth={1.2} />
                )}
              </div>
              <div className="p-4">
                <Link
                  className="line-clamp-2 font-semibold hover:text-[var(--accent)]"
                  href={`/admin/playlists/${playlist.id}/edit`}
                >
                  {playlist.title}
                </Link>
                <p className="mt-2 font-mono text-[10px] uppercase text-[var(--muted)]">
                  /{playlist.slug} · ORDER {playlist.position}
                </p>
                <p className="mt-3 text-xs text-[var(--muted)]">
                  {playlist._count.tracks} 首曲目 · {statusLabel[playlist.status]}
                  {playlist.featured ? " · 精选" : ""}
                </p>
                {playlist.description ? (
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--muted)]">
                    {playlist.description}
                  </p>
                ) : null}
                <div className="mt-4 flex items-center justify-between border-t border-[var(--line)] pt-2">
                  <Link
                    className="inline-flex min-h-11 items-center gap-2 text-sm text-[var(--accent)]"
                    href={`/admin/playlists/${playlist.id}/edit`}
                  >
                    <Edit3 aria-hidden="true" size={15} />
                    编辑
                  </Link>
                  <GardenActionForm action={deletePlaylist} successMessage="歌单已删除。">
                    <input name="id" type="hidden" value={playlist.id} />
                    <ConfirmButton message={`确定删除歌单“${playlist.title}”？曲目本身会保留。`}>
                      <span className="grid size-11 place-items-center">
                        <span className="sr-only">删除歌单“{playlist.title}”</span>
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
            <ListMusic aria-hidden="true" className="mx-auto mb-4 text-[var(--muted)]" size={34} strokeWidth={1.2} />
            <p className="font-medium">没有匹配的歌单</p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              先创建曲目，再编排一份可发布的歌单。
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
