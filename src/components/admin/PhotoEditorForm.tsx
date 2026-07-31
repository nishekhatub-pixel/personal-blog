"use client";

import { useState } from "react";
import { createPhoto, updatePhoto } from "@/actions/garden-admin";
import { SubmitButton } from "@/components/admin/AdminControls";
import { GardenPublishingFields } from "@/components/admin/GardenPublishingFields";
import {
  MediaUploader,
  type UploadedMedia,
} from "@/components/admin/MediaUploader";

type PhotoRecord = {
  albumId: string | null;
  alt: string;
  caption: string | null;
  id: string;
  location: string | null;
  mediaId: string;
  position: number;
  publishedAt: Date | string | null;
  status: string;
  takenAt: Date | string | null;
};

type NamedOption = {
  id: string;
  name: string;
};

type MediaOption = {
  alt: string;
  id: string;
  originalName: string;
};

type AlbumMode = "NONE" | "EXISTING" | "NEW";
type ImageSource = "UPLOAD" | "LIBRARY";

function dateTimeValue(value?: Date | string | null) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function ChoiceButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={[
        "min-h-11 border px-4 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
        active
          ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--ink)]"
          : "border-[var(--line)] text-[var(--muted)] hover:border-[var(--muted)] hover:text-[var(--ink)]",
      ].join(" ")}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

export function PhotoEditorForm({
  albums,
  mediaOptions: initialMediaOptions,
  photo,
}: {
  albums: NamedOption[];
  mediaOptions: MediaOption[];
  photo?: PhotoRecord;
}) {
  const [source, setSource] = useState<ImageSource>(
    photo ? "LIBRARY" : "UPLOAD",
  );
  const [mediaOptions, setMediaOptions] = useState(initialMediaOptions);
  const [mediaId, setMediaId] = useState(photo?.mediaId ?? "");
  const [alt, setAlt] = useState(photo?.alt ?? "");
  const [albumMode, setAlbumMode] = useState<AlbumMode>(
    photo?.albumId ? "EXISTING" : "NONE",
  );

  const handleUploaded = (media: UploadedMedia) => {
    setMediaOptions((current) => [
      media,
      ...current.filter((item) => item.id !== media.id),
    ]);
    setMediaId(media.id);
    if (!alt.trim()) setAlt(media.alt);
  };

  return (
    <form action={photo ? updatePhoto : createPhoto} className="grid gap-8">
      {photo ? <input name="id" type="hidden" value={photo.id} /> : null}
      <input name="albumMode" type="hidden" value={albumMode} />

      <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="grid min-w-0 gap-7">
          <section aria-labelledby="photo-source-heading">
            <div className="mb-4">
              <p className="font-mono text-[11px] text-[var(--accent)]">01 / IMAGE</p>
              <h2 className="mt-1 text-lg font-semibold" id="photo-source-heading">
                图片来源
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <ChoiceButton
                active={source === "UPLOAD"}
                onClick={() => setSource("UPLOAD")}
              >
                上传新图片
              </ChoiceButton>
              <ChoiceButton
                active={source === "LIBRARY"}
                onClick={() => setSource("LIBRARY")}
              >
                从已有媒体库选择
              </ChoiceButton>
            </div>

            {source === "UPLOAD" ? (
              <div className="mt-5">
                <MediaUploader
                  onUploaded={handleUploaded}
                  refreshAfterUpload={false}
                />
              </div>
            ) : null}

            <label className="mt-5 grid gap-2 text-sm">
              <span>
                {source === "UPLOAD" ? "已上传或已选择的图片" : "媒体文件"}
              </span>
              <select
                className="min-h-11 w-full border border-[var(--line)] bg-[var(--canvas)] px-3 outline-none focus:border-[var(--accent)]"
                name="mediaId"
                onChange={(event) => {
                  const nextId = event.target.value;
                  setMediaId(nextId);
                  const selected = mediaOptions.find((item) => item.id === nextId);
                  if (selected && !alt.trim()) setAlt(selected.alt);
                }}
                required
                value={mediaId}
              >
                <option disabled value="">
                  {source === "UPLOAD"
                    ? "请先上传图片，或切换到媒体库"
                    : "从媒体库选择"}
                </option>
                {mediaOptions.map((media) => (
                  <option key={media.id} value={media.id}>
                    {media.originalName} · {media.alt}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <section
            aria-labelledby="photo-album-heading"
            className="border-t border-[var(--line)] pt-7"
          >
            <div className="mb-4">
              <p className="font-mono text-[11px] text-[var(--accent)]">02 / ALBUM</p>
              <h2 className="mt-1 text-lg font-semibold" id="photo-album-heading">
                添加到相册
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                照片可以不归档；之后仍可在编辑页调整所属相册。
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <ChoiceButton
                active={albumMode === "NONE"}
                onClick={() => setAlbumMode("NONE")}
              >
                不加入相册
              </ChoiceButton>
              <ChoiceButton
                active={albumMode === "EXISTING"}
                onClick={() => setAlbumMode("EXISTING")}
              >
                选择已有相册
              </ChoiceButton>
              <ChoiceButton
                active={albumMode === "NEW"}
                onClick={() => setAlbumMode("NEW")}
              >
                新建相册
              </ChoiceButton>
            </div>

            {albumMode === "EXISTING" ? (
              <label className="mt-5 grid gap-2 text-sm">
                <span>所属相册</span>
                <select
                  className="min-h-11 w-full border border-[var(--line)] bg-[var(--canvas)] px-3 outline-none focus:border-[var(--accent)]"
                  defaultValue={photo?.albumId ?? ""}
                  name="albumId"
                  required
                >
                  <option disabled value="">
                    选择相册
                  </option>
                  {albums.map((album) => (
                    <option key={album.id} value={album.id}>
                      {album.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            {albumMode === "NEW" ? (
              <div className="mt-5 grid gap-5 rounded-[var(--radius-control)] bg-[var(--surface)] p-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm">
                  <span>新相册名称</span>
                  <input
                    className="min-h-11 border border-[var(--line)] bg-transparent px-3 outline-none focus:border-[var(--accent)]"
                    maxLength={160}
                    name="newAlbumTitle"
                    required
                  />
                </label>
                <label className="grid gap-2 text-sm">
                  <span>新相册 Slug</span>
                  <input
                    className="min-h-11 border border-[var(--line)] bg-transparent px-3 font-mono outline-none focus:border-[var(--accent)]"
                    name="newAlbumSlug"
                    pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                    placeholder="travel-notes"
                    required
                  />
                </label>
                <label className="grid gap-2 text-sm sm:col-span-2">
                  <span>相册说明（可选）</span>
                  <textarea
                    className="min-h-24 resize-y border border-[var(--line)] bg-transparent p-3 outline-none focus:border-[var(--accent)]"
                    maxLength={5000}
                    name="newAlbumDescription"
                  />
                </label>
                <p className="text-xs leading-5 text-[var(--muted)] sm:col-span-2">
                  新相册会以草稿创建，并自动使用这张图片作为封面。
                </p>
              </div>
            ) : null}
          </section>

          <section
            aria-labelledby="photo-details-heading"
            className="grid gap-5 border-t border-[var(--line)] pt-7"
          >
            <div>
              <p className="font-mono text-[11px] text-[var(--accent)]">03 / DETAILS</p>
              <h2 className="mt-1 text-lg font-semibold" id="photo-details-heading">
                照片信息
              </h2>
            </div>
            <label className="grid gap-2 text-sm">
              <span>替代文本</span>
              <input
                className="min-h-11 border border-[var(--line)] bg-transparent px-3 outline-none focus:border-[var(--accent)]"
                maxLength={255}
                name="alt"
                onChange={(event) => setAlt(event.target.value)}
                placeholder="描述照片里真正可见的内容"
                required
                value={alt}
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span>照片说明</span>
              <textarea
                className="min-h-36 resize-y border border-[var(--line)] bg-transparent p-3 leading-7 outline-none focus:border-[var(--accent)]"
                defaultValue={photo?.caption ?? ""}
                maxLength={5000}
                name="caption"
              />
            </label>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="grid gap-2 text-sm">
                <span>拍摄时间</span>
                <input
                  className="min-h-11 border border-[var(--line)] bg-transparent px-3 outline-none focus:border-[var(--accent)]"
                  defaultValue={dateTimeValue(photo?.takenAt)}
                  name="takenAt"
                  type="datetime-local"
                />
              </label>
              <label className="grid gap-2 text-sm">
                <span>地点</span>
                <input
                  className="min-h-11 border border-[var(--line)] bg-transparent px-3 outline-none focus:border-[var(--accent)]"
                  defaultValue={photo?.location ?? ""}
                  maxLength={255}
                  name="location"
                />
              </label>
            </div>
          </section>
        </div>

        <aside>
          <GardenPublishingFields
            position={photo?.position}
            publishedAt={photo?.publishedAt}
            status={photo?.status}
          />
        </aside>
      </div>

      <div className="sticky bottom-20 z-20 flex flex-wrap items-center justify-between gap-4 border border-[var(--line)] bg-[color-mix(in_srgb,var(--canvas)_94%,transparent)] p-4 backdrop-blur-md lg:bottom-4">
        <p className="max-w-xl text-xs leading-5 text-[var(--muted)]">
          保存只建立照片记录和归档关系，不会复制或删除媒体库原文件。
        </p>
        <SubmitButton pendingLabel="正在保存照片…">
          {photo ? "保存修改" : "添加照片"}
        </SubmitButton>
      </div>
    </form>
  );
}
