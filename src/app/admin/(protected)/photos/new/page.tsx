import Link from "next/link";
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
        description="一条照片记录必须同时关联真实相册和媒体文件。"
        eyebrow="PHOTO / NEW"
        title="添加照片"
      />
      {!albums.length || !mediaOptions.length ? (
        <div className="border-y border-[var(--line)] py-10 text-sm leading-7 text-[var(--muted)]">
          <p>
            添加照片前，需要至少一个相册和一张媒体库图片。
          </p>
          <div className="mt-4 flex flex-wrap gap-5">
            {!albums.length ? (
              <Link className="min-h-11 py-2 text-[var(--accent)]" href="/admin/albums/new">
                去创建相册
              </Link>
            ) : null}
            {!mediaOptions.length ? (
              <Link className="min-h-11 py-2 text-[var(--accent)]" href="/admin/media">
                去上传图片
              </Link>
            ) : null}
          </div>
        </div>
      ) : (
        <PhotoEditorForm
          albums={albums.map((album) => ({ id: album.id, name: album.title }))}
          mediaOptions={mediaOptions}
        />
      )}
    </>
  );
}
