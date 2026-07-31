"use client";

import { useState } from "react";
import {
  createMusicTrack,
  updateMusicTrack,
} from "@/actions/garden-admin";
import { SubmitButton } from "@/components/admin/AdminControls";
import {
  AudioUploader,
  type AudioUploadMetadata,
} from "@/components/admin/AudioUploader";
import { GardenPublishingFields } from "@/components/admin/GardenPublishingFields";
import {
  MediaUploader,
  type UploadedMedia,
} from "@/components/admin/MediaUploader";

type MediaOption = {
  alt: string;
  id: string;
  originalName: string;
};

type TrackRecord = {
  album: string | null;
  artist: string | null;
  audioUrl: string;
  coverMediaId: string | null;
  durationSeconds: number | null;
  favorite: boolean;
  featured: boolean;
  id: string;
  lyrics: string | null;
  mimeType: string | null;
  note: string | null;
  originalName: string | null;
  publishedAt: string | null;
  size: number | null;
  sourceType: "REMOTE" | "UPLOAD";
  status: string;
  storedName: string | null;
  title: string;
};

function uploadedMetadata(track?: TrackRecord): AudioUploadMetadata | null {
  if (
    !track ||
    track.sourceType !== "UPLOAD" ||
    !track.originalName ||
    !track.storedName ||
    !track.mimeType ||
    !track.size
  ) {
    return null;
  }
  return {
    album: track.album,
    artist: track.artist,
    audioUrl: track.audioUrl,
    coverMediaId: track.coverMediaId,
    coverOriginalName: null,
    durationSeconds: track.durationSeconds,
    lyrics: track.lyrics,
    mimeType: track.mimeType,
    originalName: track.originalName,
    size: track.size,
    storedName: track.storedName,
    title: track.title,
  };
}

export function MusicTrackEditorForm({
  mediaOptions,
  track,
}: {
  mediaOptions: MediaOption[];
  track?: TrackRecord;
}) {
  const [sourceType, setSourceType] = useState<"REMOTE" | "UPLOAD">(
    track?.sourceType ?? "UPLOAD",
  );
  const [upload, setUpload] = useState<AudioUploadMetadata | null>(
    uploadedMetadata(track),
  );
  const [title, setTitle] = useState(track?.title ?? "");
  const [artist, setArtist] = useState(track?.artist ?? "");
  const [album, setAlbum] = useState(track?.album ?? "");
  const [lyrics, setLyrics] = useState(track?.lyrics ?? "");
  const [durationSeconds, setDurationSeconds] = useState(
    track?.durationSeconds ? String(track.durationSeconds) : "",
  );
  const [coverOptions, setCoverOptions] = useState(mediaOptions);
  const [coverMediaId, setCoverMediaId] = useState(
    track?.coverMediaId ?? "",
  );

  function acceptUpload(metadata: AudioUploadMetadata) {
    setUpload(metadata);
    if (metadata.title) setTitle(metadata.title);
    if (metadata.artist) setArtist(metadata.artist);
    if (metadata.album) setAlbum(metadata.album);
    if (metadata.lyrics) setLyrics(metadata.lyrics);
    if (metadata.durationSeconds) {
      setDurationSeconds(String(metadata.durationSeconds));
    }
    if (metadata.coverMediaId) {
      setCoverMediaId(metadata.coverMediaId);
      setCoverOptions((current) => {
        if (current.some((media) => media.id === metadata.coverMediaId)) {
          return current;
        }
        return [
          {
            alt: `${metadata.title || "音乐"} 封面`,
            id: metadata.coverMediaId!,
            originalName: metadata.coverOriginalName || "内嵌音乐封面",
          },
          ...current,
        ];
      });
    }
  }

  function acceptCover(media: UploadedMedia) {
    setCoverOptions((current) => [
      {
        alt: media.alt,
        id: media.id,
        originalName: media.originalName,
      },
      ...current.filter((item) => item.id !== media.id),
    ]);
    setCoverMediaId(media.id);
  }

  return (
    <form action={track ? updateMusicTrack : createMusicTrack} className="grid gap-8">
      {track ? <input name="id" type="hidden" value={track.id} /> : null}
      <input name="originalName" type="hidden" value={sourceType === "UPLOAD" ? upload?.originalName ?? "" : ""} />
      <input name="storedName" type="hidden" value={sourceType === "UPLOAD" ? upload?.storedName ?? "" : ""} />
      <input name="mimeType" type="hidden" value={sourceType === "UPLOAD" ? upload?.mimeType ?? "" : ""} />
      <input name="size" type="hidden" value={sourceType === "UPLOAD" ? upload?.size ?? "" : ""} />

      <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="grid gap-5">
          <label className="grid gap-2 text-sm">
            <span>曲目名称</span>
            <input
              className="min-h-13 border-b border-[var(--line)] bg-transparent text-2xl font-semibold tracking-[-0.03em] outline-none focus:border-[var(--accent)]"
              maxLength={220}
              name="title"
              onChange={(event) => setTitle(event.target.value)}
              required
              value={title}
            />
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span>艺术家</span>
              <input
                className="min-h-11 border border-[var(--line)] bg-transparent px-3 outline-none focus:border-[var(--accent)]"
                maxLength={160}
                name="artist"
                onChange={(event) => setArtist(event.target.value)}
                value={artist}
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span>专辑</span>
              <input
                className="min-h-11 border border-[var(--line)] bg-transparent px-3 outline-none focus:border-[var(--accent)]"
                maxLength={160}
                name="album"
                onChange={(event) => setAlbum(event.target.value)}
                value={album}
              />
            </label>
          </div>
          <label className="grid gap-2 text-sm">
              <span>音频来源</span>
            <select
              className="min-h-11 border border-[var(--line)] bg-[var(--canvas)] px-3 outline-none focus:border-[var(--accent)]"
              name="sourceType"
              onChange={(event) =>
                setSourceType(event.target.value as "REMOTE" | "UPLOAD")
              }
              value={sourceType}
            >
              <option value="UPLOAD">从本地电脑上传</option>
              <option value="REMOTE">远程 HTTPS 音频</option>
            </select>
          </label>

          {sourceType === "REMOTE" ? (
            <label className="grid gap-2 text-sm">
              <span>远程音频 URL</span>
              <input
                className="min-h-11 border border-[var(--line)] bg-transparent px-3 font-mono text-sm outline-none focus:border-[var(--accent)]"
                defaultValue={track?.sourceType === "REMOTE" ? track.audioUrl : ""}
                name="audioUrl"
                placeholder="https://"
                required
                type="url"
              />
              <span className="text-xs leading-5 text-[var(--muted)]">
                只接受公开 HTTPS 地址；请确认你拥有使用该音频的权利。
              </span>
            </label>
          ) : (
            <>
              <AudioUploader onUploaded={acceptUpload} value={upload} />
              <label className="grid gap-2 text-sm">
                <span>已上传文件地址</span>
                <input
                  className="min-h-11 border border-[var(--line)] bg-transparent px-3 font-mono text-sm"
                  name="audioUrl"
                  readOnly
                  required
                  value={upload?.audioUrl ?? ""}
                />
              </label>
            </>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span>时长（秒）</span>
              <input
                className="min-h-11 border border-[var(--line)] bg-transparent px-3 font-mono outline-none focus:border-[var(--accent)]"
                min={1}
                name="durationSeconds"
                onChange={(event) => setDurationSeconds(event.target.value)}
                type="number"
                value={durationSeconds}
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span>封面媒体</span>
              <select
                className="min-h-11 border border-[var(--line)] bg-[var(--canvas)] px-3 outline-none focus:border-[var(--accent)]"
                name="coverMediaId"
                onChange={(event) => setCoverMediaId(event.target.value)}
                value={coverMediaId}
              >
                <option value="">不设置封面</option>
                {coverOptions.map((media) => (
                  <option key={media.id} value={media.id}>
                    {media.originalName} · {media.alt}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <section className="border border-[var(--line)] p-4">
            <div className="mb-3">
              <h2 className="text-sm font-semibold">从电脑上传音乐封面</h2>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                上传后会自动选为当前曲目的封面；若音频带有内嵌封面，也会在上传音频时自动提取。
              </p>
            </div>
            <MediaUploader
              onUploaded={acceptCover}
              refreshAfterUpload={false}
            />
          </section>
          <label className="grid gap-2 text-sm">
            <span>歌词</span>
            <textarea
              className="min-h-48 resize-y border border-[var(--line)] bg-transparent p-3 font-mono text-sm leading-7 outline-none focus:border-[var(--accent)]"
              maxLength={200000}
              name="lyrics"
              onChange={(event) => setLyrics(event.target.value)}
              placeholder="[00:12.30] 支持 LRC 时间轴；上传音频时会自动读取内嵌歌词"
              value={lyrics}
            />
            <span className="text-xs leading-5 text-[var(--muted)]">
              带时间戳的 LRC 会随播放进度自动高亮；只有纯文本时将按普通歌词展示。
            </span>
          </label>
          <label className="grid gap-2 text-sm">
            <span>个人注记</span>
            <textarea
              className="min-h-32 resize-y border border-[var(--line)] bg-transparent p-3 leading-7 outline-none focus:border-[var(--accent)]"
              defaultValue={track?.note ?? ""}
              maxLength={20000}
              name="note"
            />
          </label>
        </div>

        <aside className="grid content-start gap-5">
          <GardenPublishingFields
            featured={track?.featured}
            publishedAt={track?.publishedAt}
            showFeatured
            showPosition={false}
            status={track?.status}
          />
          <label className="flex min-h-11 items-center gap-3 border-y border-[var(--line)] py-3 text-sm">
            <input
              className="size-4 accent-[var(--accent)]"
              defaultChecked={track?.favorite}
              name="favorite"
              type="checkbox"
              value="true"
            />
            标记为喜欢
          </label>
        </aside>
      </div>

      <div className="sticky bottom-20 z-20 flex flex-wrap items-center justify-between gap-4 border border-[var(--line)] bg-[color-mix(in_srgb,var(--canvas)_94%,transparent)] p-4 backdrop-blur-md lg:bottom-4">
        <p className="text-xs text-[var(--muted)]">
          本地音频会读取可用的时长、歌曲信息、封面和歌词；远程音频不会被复制。
        </p>
        <SubmitButton pendingLabel="正在保存曲目…">
          {track ? "保存修改" : "创建曲目"}
        </SubmitButton>
      </div>
    </form>
  );
}
