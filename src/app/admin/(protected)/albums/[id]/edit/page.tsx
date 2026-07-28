import { notFound } from "next/navigation";
import { AlbumEditorForm } from "@/components/admin/AlbumEditorForm";
import { AlbumPhotoManager } from "@/components/admin/AlbumPhotoManager";
import { GardenEditorHeader } from "@/components/admin/GardenEditorHeader";
import { db } from "@/lib/db";

export default async function EditAlbumPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [album, mediaOptions, photos] = await Promise.all([
    db.photoAlbum.findUnique({ where: { id } }),
    db.media.findMany({
      orderBy: { createdAt: "desc" },
      select: { alt: true, id: true, originalName: true },
    }),
    db.photo.findMany({
      where: { albumId: id },
      orderBy: [
        { position: "asc" },
        { createdAt: "asc" },
        { id: "asc" },
      ],
      select: {
        alt: true,
        id: true,
        media: {
          select: {
            originalName: true,
            url: true,
          },
        },
        position: true,
        status: true,
      },
    }),
  ]);
  if (!album) notFound();

  return (
    <>
      <GardenEditorHeader
        backHref="/admin/albums"
        backLabel="返回相册列表"
        created={query.created === "1"}
        description="可直接从电脑批量上传照片；下方继续维护封面、说明和发布状态。"
        eyebrow="ALBUM / EDIT"
        saved={query.saved === "1"}
        title={album.title}
      />
      <AlbumPhotoManager
        albumId={album.id}
        initialPhotos={photos}
        key={photos
          .map((photo) => `${photo.id}:${photo.position}`)
          .join("|")}
      />
      <div className="mt-12 border-t border-[var(--line)] pt-10">
        <AlbumEditorForm album={album} mediaOptions={mediaOptions} />
      </div>
    </>
  );
}
