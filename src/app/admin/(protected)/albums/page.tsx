import type { ContentStatus, Prisma } from "@prisma/client";
import { Edit3, Images, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { deletePhotoAlbum } from "@/actions/garden-admin";
import {
  ConfirmButton,
  SearchField,
} from "@/components/admin/AdminControls";
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

export default async function AdminAlbumsPage({
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
  const where: Prisma.PhotoAlbumWhereInput = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q } },
            { slug: { contains: q } },
            { city: { contains: q } },
            { description: { contains: q } },
          ],
        }
      : {}),
  };
  const [albums, count] = await Promise.all([
    db.photoAlbum.findMany({
      include: {
        _count: { select: { photos: true } },
        coverMedia: { select: { alt: true, url: true } },
      },
      orderBy: [
        { featured: "desc" },
        { position: "asc" },
        { updatedAt: "desc" },
      ],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      where,
    }),
    db.photoAlbum.count({ where }),
  ]);
  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <>
      <AdminHeader
        action={{ href: "/admin/albums/new", label: "新建相册" }}
        description="相册负责叙事与分组；照片保持独立记录，并引用媒体库中的真实图片。"
        eyebrow="GARDEN / ALBUMS"
        title="相册"
      />

      <form className="mb-7 flex flex-col gap-3 border-b border-[var(--line)] pb-6 sm:flex-row" method="get">
        <SearchField defaultValue={q} placeholder="搜索名称、城市、说明或 slug" />
        <label className="sm:w-44">
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

      {albums.length ? (
        <ul className="grid border-l border-t border-[var(--line)] md:grid-cols-2 xl:grid-cols-3">
          {albums.map((album) => (
            <li className="min-w-0 border-b border-r border-[var(--line)]" key={album.id}>
              <div className="relative aspect-[16/10] overflow-hidden bg-[color-mix(in_srgb,var(--ink)_5%,transparent)]">
                {album.coverMedia ? (
                  <Image
                    alt={album.coverMedia.alt}
                    className="object-cover"
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    src={album.coverMedia.url}
                  />
                ) : (
                  <div className="grid h-full place-items-center">
                    <Images aria-hidden="true" className="text-[var(--muted)]" size={32} strokeWidth={1.2} />
                  </div>
                )}
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Link
                      className="line-clamp-1 text-lg font-semibold hover:text-[var(--accent)]"
                      href={`/admin/albums/${album.id}/edit`}
                    >
                      {album.title}
                    </Link>
                    <p className="mt-1 font-mono text-[11px] text-[var(--muted)]">
                      /{album.slug}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-[var(--muted)]">
                    {statusLabel[album.status]}
                  </span>
                </div>
                <p className="mt-3 line-clamp-2 min-h-12 text-sm leading-6 text-[var(--muted)]">
                  {album.description || "尚未填写相册说明。"}
                </p>
                <p className="mt-4 font-mono text-[11px] text-[var(--muted)]">
                  {album._count.photos} PHOTOS · ORDER {album.position}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-[var(--line)] pt-2">
                  <Link
                    className="inline-flex min-h-11 items-center gap-2 text-sm text-[var(--accent)]"
                    href={`/admin/albums/${album.id}/edit`}
                  >
                    <Edit3 aria-hidden="true" size={15} />
                    编辑
                  </Link>
                  <GardenActionForm
                    action={deletePhotoAlbum}
                    successMessage="相册已删除。"
                  >
                    <input name="id" type="hidden" value={album.id} />
                    <ConfirmButton message={`确定删除相册“${album.title}”？其中的照片会保留并变为未归档，媒体库原文件不受影响。`}>
                      <span className="grid size-11 place-items-center">
                        <span className="sr-only">删除相册“{album.title}”</span>
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
            <Images aria-hidden="true" className="mx-auto mb-4 text-[var(--muted)]" size={32} strokeWidth={1.3} />
            <p className="font-medium">还没有匹配的相册</p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              相册允许为空；创建后再从媒体库添加第一张照片。
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
