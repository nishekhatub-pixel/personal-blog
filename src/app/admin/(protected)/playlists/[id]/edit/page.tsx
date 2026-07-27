import { notFound } from "next/navigation";
import { GardenEditorHeader } from "@/components/admin/GardenEditorHeader";
import { PlaylistEditorForm } from "@/components/admin/PlaylistEditorForm";
import { db } from "@/lib/db";

export default async function EditPlaylistPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [playlist, trackOptions, mediaOptions] = await Promise.all([
    db.playlist.findUnique({
      include: {
        tracks: {
          orderBy: { position: "asc" },
          select: { note: true, position: true, trackId: true },
        },
      },
      where: { id },
    }),
    db.musicTrack.findMany({
      orderBy: [{ title: "asc" }, { createdAt: "desc" }],
      select: { artist: true, id: true, sourceType: true, title: true },
    }),
    db.media.findMany({
      orderBy: { createdAt: "desc" },
      select: { alt: true, id: true, originalName: true },
    }),
  ]);
  if (!playlist) notFound();

  return (
    <>
      <GardenEditorHeader
        backHref="/admin/playlists"
        backLabel="返回歌单列表"
        created={query.created === "1"}
        description="当前选择会在保存后完整替换歌单中的曲目关系与排序。"
        eyebrow="PLAYLIST / EDIT"
        saved={query.saved === "1"}
        title={playlist.title}
      />
      <PlaylistEditorForm
        mediaOptions={mediaOptions}
        playlist={{
          ...playlist,
          publishedAt: playlist.publishedAt?.toISOString() ?? null,
          tracks: playlist.tracks.map((track) => ({
            note: track.note ?? "",
            position: track.position,
            trackId: track.trackId,
          })),
        }}
        trackOptions={trackOptions}
      />
    </>
  );
}
