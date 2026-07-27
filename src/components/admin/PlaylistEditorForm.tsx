"use client";

import { useMemo, useState } from "react";
import {
  createPlaylist,
  updatePlaylist,
} from "@/actions/garden-admin";
import { SubmitButton } from "@/components/admin/AdminControls";
import { GardenPublishingFields } from "@/components/admin/GardenPublishingFields";

type MediaOption = {
  alt: string;
  id: string;
  originalName: string;
};

type TrackOption = {
  artist: string | null;
  id: string;
  sourceType: string;
  title: string;
};

type PlaylistTrackDraft = {
  note: string;
  position: number;
  trackId: string;
};

type PlaylistRecord = {
  coverMediaId: string | null;
  description: string | null;
  featured: boolean;
  id: string;
  position: number;
  publishedAt: string | null;
  slug: string;
  status: string;
  title: string;
  tracks: PlaylistTrackDraft[];
};

export function PlaylistEditorForm({
  mediaOptions,
  playlist,
  trackOptions,
}: {
  mediaOptions: MediaOption[];
  playlist?: PlaylistRecord;
  trackOptions: TrackOption[];
}) {
  const [tracks, setTracks] = useState<PlaylistTrackDraft[]>(
    [...(playlist?.tracks ?? [])].sort((left, right) => left.position - right.position),
  );
  const selectedIds = useMemo(
    () => new Set(tracks.map((track) => track.trackId)),
    [tracks],
  );

  function toggleTrack(trackId: string, checked: boolean) {
    setTracks((current) => {
      if (!checked) return current.filter((item) => item.trackId !== trackId);
      if (current.some((item) => item.trackId === trackId)) return current;
      const nextPosition = current.reduce(
        (highest, item) => Math.max(highest, item.position),
        -1,
      ) + 1;
      return [...current, { note: "", position: nextPosition, trackId }];
    });
  }

  function updateTrack(
    trackId: string,
    field: "note" | "position",
    value: string,
  ) {
    setTracks((current) =>
      current.map((item) =>
        item.trackId === trackId
          ? {
              ...item,
              [field]: field === "position" ? Number(value) || 0 : value,
            }
          : item,
      ),
    );
  }

  const sortedTracks = [...tracks].sort(
    (left, right) => left.position - right.position,
  );

  return (
    <form action={playlist ? updatePlaylist : createPlaylist} className="grid gap-8">
      {playlist ? <input name="id" type="hidden" value={playlist.id} /> : null}
      <input name="tracksJson" type="hidden" value={JSON.stringify(sortedTracks)} />

      <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="grid gap-5">
          <label className="grid gap-2 text-sm">
            <span>歌单名称</span>
            <input
              className="min-h-13 border-b border-[var(--line)] bg-transparent text-2xl font-semibold tracking-[-0.03em] outline-none focus:border-[var(--accent)]"
              defaultValue={playlist?.title}
              maxLength={180}
              name="title"
              required
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span>Slug</span>
            <input
              className="min-h-11 border border-[var(--line)] bg-transparent px-3 font-mono outline-none focus:border-[var(--accent)]"
              defaultValue={playlist?.slug}
              name="slug"
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              required
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span>歌单说明</span>
            <textarea
              className="min-h-36 resize-y border border-[var(--line)] bg-transparent p-3 leading-7 outline-none focus:border-[var(--accent)]"
              defaultValue={playlist?.description ?? ""}
              maxLength={5000}
              name="description"
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span>封面媒体</span>
            <select
              className="min-h-11 border border-[var(--line)] bg-[var(--canvas)] px-3 outline-none focus:border-[var(--accent)]"
              defaultValue={playlist?.coverMediaId ?? ""}
              name="coverMediaId"
            >
              <option value="">不设置封面</option>
              {mediaOptions.map((media) => (
                <option key={media.id} value={media.id}>
                  {media.originalName} · {media.alt}
                </option>
              ))}
            </select>
          </label>
        </div>
        <aside>
          <GardenPublishingFields
            featured={playlist?.featured}
            position={playlist?.position}
            publishedAt={playlist?.publishedAt}
            showFeatured
            status={playlist?.status}
          />
        </aside>
      </div>

      <section className="border-t border-[var(--line)] pt-7" aria-labelledby="playlist-tracks">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold" id="playlist-tracks">
              选择曲目与排序
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              排序值必须唯一；公开歌单只会展示已发布曲目。
            </p>
          </div>
          <p className="font-mono text-xs text-[var(--muted)]">
            {tracks.length} TRACKS
          </p>
        </div>

        {trackOptions.length ? (
          <ul className="mt-5 grid border-l border-t border-[var(--line)] md:grid-cols-2">
            {trackOptions.map((track) => (
              <li className="border-b border-r border-[var(--line)] p-4" key={track.id}>
                <label className="flex min-h-11 items-center gap-3">
                  <input
                    checked={selectedIds.has(track.id)}
                    className="size-4 accent-[var(--accent)]"
                    onChange={(event) => toggleTrack(track.id, event.target.checked)}
                    type="checkbox"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{track.title}</span>
                    <span className="mt-1 block truncate text-xs text-[var(--muted)]">
                      {track.artist || "未知艺术家"} · {track.sourceType}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-5 border-y border-[var(--line)] py-10 text-sm text-[var(--muted)]">
            还没有曲目。请先在音乐页创建曲目。
          </p>
        )}
      </section>

      {sortedTracks.length ? (
        <section className="grid gap-3 border-t border-[var(--line)] pt-7" aria-labelledby="playlist-order">
          <h2 className="text-lg font-semibold" id="playlist-order">
            已选曲目
          </h2>
          {sortedTracks.map((item) => {
            const track = trackOptions.find((option) => option.id === item.trackId);
            return (
              <fieldset
                className="grid gap-4 border border-[var(--line)] p-4 sm:grid-cols-[7rem_minmax(0,1fr)]"
                key={item.trackId}
              >
                <legend className="px-2 text-sm font-medium">
                  {track?.title ?? item.trackId}
                </legend>
                <label className="grid gap-2 text-sm">
                  <span>排序</span>
                  <input
                    className="min-h-11 border border-[var(--line)] bg-transparent px-3 font-mono"
                    min={0}
                    onChange={(event) =>
                      updateTrack(item.trackId, "position", event.target.value)
                    }
                    type="number"
                    value={item.position}
                  />
                </label>
                <label className="grid gap-2 text-sm">
                  <span>歌单内注记</span>
                  <input
                    className="min-h-11 border border-[var(--line)] bg-transparent px-3"
                    maxLength={500}
                    onChange={(event) =>
                      updateTrack(item.trackId, "note", event.target.value)
                    }
                    value={item.note}
                  />
                </label>
              </fieldset>
            );
          })}
        </section>
      ) : null}

      <div className="sticky bottom-20 z-20 flex flex-wrap items-center justify-between gap-4 border border-[var(--line)] bg-[color-mix(in_srgb,var(--canvas)_94%,transparent)] p-4 backdrop-blur-md lg:bottom-4">
        <p className="text-xs text-[var(--muted)]">
          保存会以当前选择完整替换歌单曲目关系。
        </p>
        <SubmitButton pendingLabel="正在保存歌单…">
          {playlist ? "保存修改" : "创建歌单"}
        </SubmitButton>
      </div>
    </form>
  );
}
