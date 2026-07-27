import { notFound } from "next/navigation";
import { GardenEditorHeader } from "@/components/admin/GardenEditorHeader";
import { MusicTrackEditorForm } from "@/components/admin/MusicTrackEditorForm";
import { db } from "@/lib/db";

export default async function EditMusicTrackPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [track, mediaOptions] = await Promise.all([
    db.musicTrack.findUnique({ where: { id } }),
    db.media.findMany({
      orderBy: { createdAt: "desc" },
      select: { alt: true, id: true, originalName: true },
    }),
  ]);
  if (!track) notFound();

  return (
    <>
      <GardenEditorHeader
        backHref="/admin/music"
        backLabel="返回音乐列表"
        created={query.created === "1"}
        description="修改来源时，旧的本站上传文件会在保存成功后安全清理。"
        eyebrow="MUSIC / EDIT"
        saved={query.saved === "1"}
        title={track.title}
      />
      <MusicTrackEditorForm
        mediaOptions={mediaOptions}
        track={{
          ...track,
          publishedAt: track.publishedAt?.toISOString() ?? null,
        }}
      />
    </>
  );
}
