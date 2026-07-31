import { notFound } from "next/navigation";
import { GardenEditorHeader } from "@/components/admin/GardenEditorHeader";
import { PhotoEditorForm } from "@/components/admin/PhotoEditorForm";
import { db } from "@/lib/db";

export default async function EditPhotoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [photo, albums, mediaOptions] = await Promise.all([
    db.photo.findUnique({ where: { id } }),
    db.photoAlbum.findMany({
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
    db.media.findMany({
      orderBy: { createdAt: "desc" },
      select: { alt: true, id: true, originalName: true },
    }),
  ]);
  if (!photo) notFound();

  return (
    <>
      <GardenEditorHeader
        backHref="/admin/photos"
        backLabel="返回照片列表"
        created={query.created === "1"}
        description="调整照片说明、可选相册归属、拍摄信息和公开顺序。"
        eyebrow="PHOTO / EDIT"
        saved={query.saved === "1"}
        title={photo.alt}
      />
      <PhotoEditorForm
        albums={albums.map((album) => ({ id: album.id, name: album.title }))}
        mediaOptions={mediaOptions}
        photo={photo}
      />
    </>
  );
}
