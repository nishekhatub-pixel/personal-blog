import { GardenEditorHeader } from "@/components/admin/GardenEditorHeader";
import { PhotoEditorForm } from "@/components/admin/PhotoEditorForm";
import { db } from "@/lib/db";

export default async function NewPhotoPage() {
  const [albums, mediaOptions] = await Promise.all([
    db.photoAlbum.findMany({
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
    db.media.findMany({
      orderBy: { createdAt: "desc" },
      select: { alt: true, id: true, originalName: true },
    }),
  ]);

  return (
    <>
      <GardenEditorHeader
        backHref="/admin/photos"
        backLabel="返回照片列表"
        description="上传新图片或选择媒体库文件，并决定是否立即归档到相册。"
        eyebrow="PHOTO / NEW"
        title="添加照片"
      />
      <PhotoEditorForm
        albums={albums.map((album) => ({ id: album.id, name: album.title }))}
        mediaOptions={mediaOptions}
      />
    </>
  );
}
