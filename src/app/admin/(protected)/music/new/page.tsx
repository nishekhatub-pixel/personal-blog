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
        description="默认从本地电脑上传；可自动读取歌曲信息、时长、内嵌封面与歌词，也可另行上传封面。"
        eyebrow="MUSIC / NEW"
        title="添加曲目"
      />
      <MusicTrackEditorForm mediaOptions={mediaOptions} />
    </>
  );
}
