import type { ContentStatus, Prisma } from "@prisma/client";
import { Edit3, ImageIcon, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { deletePhoto } from "@/actions/garden-admin";
import { ConfirmButton, SearchField } from "@/components/admin/AdminControls";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { GardenActionForm } from "@/components/admin/GardenActionForm";
import { Pagination } from "@/components/admin/Pagination";
import { db } from "@/lib/db";

const PAGE_SIZE = 15;
const statuses = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
const statusLabel = {
  ARCHIVED: "已归档",
  DRAFT: "草稿",
  PUBLISHED: "已发布",
} as const;

export default async function AdminPhotosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const albumId = typeof params.album === "string" ? params.album : "";
  const rawStatus = typeof params.status === "string" ? params.status : "";
  const status = statuses.includes(rawStatus as (typeof statuses)[number])
    ? (rawStatus as ContentStatus)
    : undefined;
  const rawPage = Number(typeof params.page === "string" ? params.page : "1");
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
  const where: Prisma.PhotoWhereInput = {
    ...(albumId === "unassigned"
      ? { albumId: null }
      : albumId
        ? { albumId }
        : {}),
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { alt: { contains: q } },
            { caption: { contains: q } },
            { location: { contains: q } },
            { album: { title: { contains: q } } },
            { media: { originalName: { contains: q } } },
          ],
        }
      : {}),
  };
  const [photos, count, albums] = await Promise.all([
    db.photo.findMany({
      include: {
        album: { select: { title: true } },
        media: {
          select: {
            height: true,
            originalName: true,
            url: true,
            width: true,
          },
        },
      },
      orderBy: [{ albumId: "asc" }, { position: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      where,
    }),
    db.photo.count({ where }),
    db.photoAlbum.findMany({
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
  ]);
  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <>
      <AdminHeader
        action={{ href: "/admin/photos/new", label: "添加照片" }}
        description="照片引用媒体库文件，并独立维护相册、替代文本、拍摄信息、排序和发布状态。"
        eyebrow="GARDEN / PHOTOS"
        title="照片"
      />

      <form className="mb-7 grid gap-3 border-b border-[var(--line)] pb-6 md:grid-cols-[minmax(14rem,1fr)_12rem_12rem_auto]" method="get">
        <SearchField defaultValue={q} placeholder="搜索替代文本、说明、地点或文件名" />
        <label>
          <span className="sr-only">按相册筛选</span>
          <select
            className="min-h-11 w-full border border-[var(--line)] bg-[var(--canvas)] px-3 text-sm"
            defaultValue={albumId}
            name="album"
          >
            <option value="">全部相册</option>
            <option value="unassigned">未归档</option>
            {albums.map((album) => (
              <option key={album.id} value={album.id}>
                {album.title}
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

      {photos.length ? (
        <ul className="grid border-l border-t border-[var(--line)] sm:grid-cols-2 xl:grid-cols-3">
          {photos.map((photo) => (
            <li className="min-w-0 border-b border-r border-[var(--line)]" key={photo.id}>
              <div className="relative aspect-[4/3] overflow-hidden bg-[color-mix(in_srgb,var(--ink)_5%,transparent)]">
                <Image
                  alt={photo.alt}
                  className="object-cover"
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  src={photo.media.url}
                />
              </div>
              <div className="p-4">
                <Link
                  className="line-clamp-2 text-sm font-semibold hover:text-[var(--accent)]"
                  href={`/admin/photos/${photo.id}/edit`}
                >
                  {photo.alt}
                </Link>
                <p className="mt-2 text-xs text-[var(--muted)]">
                  {photo.album?.title ?? "未归档"} · {statusLabel[photo.status]} · ORDER {photo.position}
                </p>
                <p className="mt-2 truncate font-mono text-[10px] text-[var(--muted)]">
                  {photo.media.originalName}
                  {photo.media.width && photo.media.height
                    ? ` · ${photo.media.width}×${photo.media.height}`
                    : ""}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-[var(--line)] pt-2">
                  <Link
                    className="inline-flex min-h-11 items-center gap-2 text-sm text-[var(--accent)]"
                    href={`/admin/photos/${photo.id}/edit`}
                  >
                    <Edit3 aria-hidden="true" size={15} />
                    编辑
                  </Link>
                  <GardenActionForm action={deletePhoto} successMessage="照片记录已删除。">
                    <input name="id" type="hidden" value={photo.id} />
                    <ConfirmButton message="确定删除这条照片记录？媒体库原文件不会被删除。">
                      <span className="grid size-11 place-items-center">
                        <span className="sr-only">删除照片记录</span>
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
            <ImageIcon aria-hidden="true" className="mx-auto mb-4 text-[var(--muted)]" size={32} strokeWidth={1.3} />
            <p className="font-medium">没有匹配的照片</p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              可以直接上传新图片，也可以从媒体库选择，并按需归档到相册。
            </p>
          </div>
        </div>
      )}
      <Pagination
        page={Math.min(page, pageCount)}
        pageCount={pageCount}
        searchParams={{ album: albumId, q, status }}
      />
    </>
  );
}
