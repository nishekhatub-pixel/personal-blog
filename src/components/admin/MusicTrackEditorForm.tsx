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
    audioUrl: track.audioUrl,
    durationSeconds: track.durationSeconds,
    mimeType: track.mimeType,
    originalName: track.originalName,
    size: track.size,
    storedName: track.storedName,
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
    track?.sourceType ?? "REMOTE",
  );
  const [upload, setUpload] = useState<AudioUploadMetadata | null>(
    uploadedMetadata(track),
  );
  const [durationSeconds, setDurationSeconds] = useState(
    track?.durationSeconds ? String(track.durationSeconds) : "",
  );

  function acceptUpload(metadata: AudioUploadMetadata) {
    setUpload(metadata);
    if (metadata.durationSeconds) {
      setDurationSeconds(String(metadata.durationSeconds));
    }
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
              defaultValue={track?.title}
              maxLength={220}
              name="title"
              required
            />
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span>艺术家</span>
              <input
                className="min-h-11 border border-[var(--line)] bg-transparent px-3 outline-none focus:border-[var(--accent)]"
                defaultValue={track?.artist ?? ""}
                maxLength={160}
                name="artist"
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span>专辑</span>
              <input
                className="min-h-11 border border-[var(--line)] bg-transparent px-3 outline-none focus:border-[var(--accent)]"
                defaultValue={track?.album ?? ""}
                maxLength={160}
                name="album"
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
              <option value="REMOTE">远程 HTTPS 音频</option>
              <option value="UPLOAD">上传到本站</option>
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
                defaultValue={track?.coverMediaId ?? ""}
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
          <label className="grid gap-2 text-sm">
            <span>歌词</span>
            <textarea
              className="min-h-48 resize-y border border-[var(--line)] bg-transparent p-3 font-mono text-sm leading-7 outline-none focus:border-[var(--accent)]"
              defaultValue={track?.lyrics ?? ""}
              maxLength={200000}
              name="lyrics"
            />
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
          远程音频不会被复制；上传音频由专用存储接口管理。
        </p>
        <SubmitButton pendingLabel="正在保存曲目…">
          {track ? "保存修改" : "创建曲目"}
        </SubmitButton>
      </div>
    </form>
  );
}
