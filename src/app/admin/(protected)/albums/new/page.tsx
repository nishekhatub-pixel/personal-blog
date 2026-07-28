import { AlbumEditorForm } from "@/components/admin/AlbumEditorForm";
import { GardenEditorHeader } from "@/components/admin/GardenEditorHeader";
import { db } from "@/lib/db";

export default async function NewAlbumPage() {
  const mediaOptions = await db.media.findMany({
    orderBy: { createdAt: "desc" },
    select: { alt: true, id: true, originalName: true },
  });

  return (
    <>
      <GardenEditorHeader
        backHref="/admin/albums"
        backLabel="返回相册列表"
        description="先创建相册；保存后会立即进入电脑批量上传区域，无需先去媒体库。"
        eyebrow="ALBUM / NEW"
        title="新建相册"
      />
      <AlbumEditorForm mediaOptions={mediaOptions} />
    </>
  );
}
