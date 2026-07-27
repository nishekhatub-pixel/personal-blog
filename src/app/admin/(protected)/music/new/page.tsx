import { GardenEditorHeader } from "@/components/admin/GardenEditorHeader";
import { MusicTrackEditorForm } from "@/components/admin/MusicTrackEditorForm";
import { db } from "@/lib/db";

export default async function NewMusicTrackPage() {
  const mediaOptions = await db.media.findMany({
    orderBy: { createdAt: "desc" },
    select: { alt: true, id: true, originalName: true },
  });

  return (
    <>
      <GardenEditorHeader
        backHref="/admin/music"
        backLabel="返回音乐列表"
        description="上传音频或登记公开 HTTPS 地址；封面从媒体库中选择。"
        eyebrow="MUSIC / NEW"
        title="添加曲目"
      />
      <MusicTrackEditorForm mediaOptions={mediaOptions} />
    </>
  );
}
