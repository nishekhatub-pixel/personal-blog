import Link from "next/link";
import { GardenEditorHeader } from "@/components/admin/GardenEditorHeader";
import { PlaylistEditorForm } from "@/components/admin/PlaylistEditorForm";
import { db } from "@/lib/db";

export default async function NewPlaylistPage() {
  const [trackOptions, mediaOptions] = await Promise.all([
    db.musicTrack.findMany({
      orderBy: [{ title: "asc" }, { createdAt: "desc" }],
      select: { artist: true, id: true, sourceType: true, title: true },
    }),
    db.media.findMany({
      orderBy: { createdAt: "desc" },
      select: { alt: true, id: true, originalName: true },
    }),
  ]);

  return (
    <>
      <GardenEditorHeader
        backHref="/admin/playlists"
        backLabel="返回歌单列表"
        description="选择真实曲目并为每首曲目设置不重复的排序值。"
        eyebrow="PLAYLIST / NEW"
        title="创建歌单"
      />
      {!trackOptions.length ? (
        <div className="mb-6 border-y border-[var(--line)] py-6 text-sm text-[var(--muted)]">
          当前还没有曲目。你可以先
          <Link className="mx-1 inline-flex min-h-11 items-center text-[var(--accent)]" href="/admin/music/new">
            添加第一首曲目
          </Link>
          ，也可以先建立空歌单。
        </div>
      ) : null}
      <PlaylistEditorForm
        mediaOptions={mediaOptions}
        trackOptions={trackOptions}
      />
    </>
  );
}
