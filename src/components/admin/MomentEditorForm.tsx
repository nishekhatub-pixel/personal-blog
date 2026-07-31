"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  createMoment,
  updateMoment,
} from "@/actions/garden-admin";
import { SubmitButton } from "@/components/admin/AdminControls";
import { GardenPublishingFields } from "@/components/admin/GardenPublishingFields";
import {
  MediaUploader,
  type UploadedMedia,
} from "@/components/admin/MediaUploader";

type MediaOption = {
  alt: string;
  id: string;
  originalName: string;
  url: string;
};

type MomentMediaDraft = {
  alt: string;
  caption: string;
  mediaId: string;
  position: number;
};

type EditableMoment = {
  content: string;
  id: string;
  media: MomentMediaDraft[];
  mood: string | null;
  pinned: boolean;
  publishedAt: string | null;
  status: string;
  weather: string | null;
};

type MomentEditorFormProps = {
  mediaOptions: MediaOption[];
  moment?: EditableMoment;
};

export function MomentEditorForm({
  mediaOptions,
  moment,
}: MomentEditorFormProps) {
  const [availableMedia, setAvailableMedia] = useState<MediaOption[]>(mediaOptions);
  const [selectedMedia, setSelectedMedia] = useState<MomentMediaDraft[]>(() =>
    [...(moment?.media ?? [])].sort((left, right) => left.position - right.position),
  );
  const selectedIds = useMemo(
    () => new Set(selectedMedia.map((item) => item.mediaId)),
    [selectedMedia],
  );

  function toggleMedia(option: MediaOption, checked: boolean) {
    setSelectedMedia((current) => {
      if (!checked) {
        return current.filter((item) => item.mediaId !== option.id);
      }
      if (current.some((item) => item.mediaId === option.id) || current.length >= 9) {
        return current;
      }
      return [
        ...current,
        {
          alt: option.alt || option.originalName,
          caption: "",
          mediaId: option.id,
          position: current.length,
        },
      ];
    });
  }

  function handleUploaded(media: UploadedMedia) {
    setAvailableMedia((current) => {
      if (current.some((item) => item.id === media.id)) return current;
      return [media, ...current];
    });
    toggleMedia(media, true);
  }

  function updateMedia(
    mediaId: string,
    field: "alt" | "caption" | "position",
    value: string,
  ) {
    setSelectedMedia((current) =>
      current.map((item) =>
        item.mediaId === mediaId
          ? {
              ...item,
              [field]: field === "position" ? Number(value) || 0 : value,
            }
          : item,
      ),
    );
  }

  return (
    <form action={moment ? updateMoment : createMoment} className="grid gap-8">
      {moment ? <input name="id" type="hidden" value={moment.id} /> : null}
      <input
        name="mediaJson"
        type="hidden"
        value={JSON.stringify(
          [...selectedMedia].sort((left, right) => left.position - right.position),
        )}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="grid gap-5">
          <label className="grid gap-2 text-sm">
            <span>说说内容</span>
            <textarea
              className="min-h-56 resize-y border border-[var(--line)] bg-transparent p-4 text-base leading-8 outline-none focus:border-[var(--accent)]"
              defaultValue={moment?.content}
              maxLength={5000}
              name="content"
              placeholder="记录此刻真实发生的学习、生活或想法。"
              required
            />
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span>心情</span>
              <input
                className="min-h-11 border border-[var(--line)] bg-transparent px-3 outline-none focus:border-[var(--accent)]"
                defaultValue={moment?.mood ?? ""}
                maxLength={80}
                name="mood"
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span>天气</span>
              <input
                className="min-h-11 border border-[var(--line)] bg-transparent px-3 outline-none focus:border-[var(--accent)]"
                defaultValue={moment?.weather ?? ""}
                maxLength={120}
                name="weather"
              />
            </label>
          </div>
        </div>
        <aside className="grid content-start gap-5">
          <GardenPublishingFields
            pinned={moment?.pinned}
            publishedAt={moment?.publishedAt}
            showPinned
            showPosition={false}
            status={moment?.status}
          />
        </aside>
      </div>

      <section className="border-t border-[var(--line)] pt-7" aria-labelledby="moment-media">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold" id="moment-media">
              说说图片
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              可以直接上传，也可以从博客媒体库选择，最多 9 张。
            </p>
          </div>
          <p className="font-mono text-xs text-[var(--muted)]">
            {selectedMedia.length} / 9
          </p>
        </div>

        <details className="mt-5 border border-[var(--line)] p-4">
          <summary className="min-h-11 cursor-pointer text-sm font-medium leading-[2.75rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]">
            上传本地图片并自动加入说说
          </summary>
          <div className="mt-4">
            <MediaUploader
              onUploaded={handleUploaded}
              refreshAfterUpload={false}
            />
          </div>
        </details>

        {availableMedia.length ? (
          <ul className="mt-5 grid border-l border-t border-[var(--line)] sm:grid-cols-2 xl:grid-cols-3">
            {availableMedia.map((option) => {
              const checked = selectedIds.has(option.id);
              return (
                <li className="border-b border-r border-[var(--line)] p-3" key={option.id}>
                  <label className="grid cursor-pointer gap-3">
                    <span className="relative aspect-[4/3] overflow-hidden bg-[color-mix(in_srgb,var(--ink)_5%,transparent)]">
                      <Image
                        alt=""
                        className="object-cover"
                        fill
                        sizes="(max-width: 640px) 100vw, 33vw"
                        src={option.url}
                      />
                    </span>
                    <span className="flex min-h-11 items-center gap-3 text-sm">
                      <input
                        checked={checked}
                        className="size-4 accent-[var(--accent)]"
                        disabled={!checked && selectedMedia.length >= 9}
                        onChange={(event) => toggleMedia(option, event.target.checked)}
                        type="checkbox"
                      />
                      <span className="min-w-0 truncate">{option.originalName}</span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-5 border-y border-[var(--line)] py-10 text-sm text-[var(--muted)]">
            媒体库还没有图片，可使用上方入口直接上传。
          </p>
        )}
      </section>

      {selectedMedia.length ? (
        <section className="grid gap-4 border-t border-[var(--line)] pt-7" aria-labelledby="moment-media-details">
          <h2 className="text-lg font-semibold" id="moment-media-details">
            图片说明与顺序
          </h2>
          {selectedMedia.map((item) => {
            const option = availableMedia.find((media) => media.id === item.mediaId);
            return (
              <fieldset
                className="grid gap-4 border border-[var(--line)] p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_7rem]"
                key={item.mediaId}
              >
                <legend className="px-2 text-xs text-[var(--muted)]">
                  {option?.originalName ?? item.mediaId}
                </legend>
                <label className="grid gap-2 text-sm">
                  <span>替代文本</span>
                  <input
                    className="min-h-11 border border-[var(--line)] bg-transparent px-3"
                    maxLength={255}
                    onChange={(event) => updateMedia(item.mediaId, "alt", event.target.value)}
                    required
                    value={item.alt}
                  />
                </label>
                <label className="grid gap-2 text-sm">
                  <span>说明</span>
                  <input
                    className="min-h-11 border border-[var(--line)] bg-transparent px-3"
                    maxLength={500}
                    onChange={(event) =>
                      updateMedia(item.mediaId, "caption", event.target.value)
                    }
                    value={item.caption}
                  />
                </label>
                <label className="grid gap-2 text-sm">
                  <span>排序</span>
                  <input
                    className="min-h-11 border border-[var(--line)] bg-transparent px-3 font-mono"
                    min={0}
                    onChange={(event) =>
                      updateMedia(item.mediaId, "position", event.target.value)
                    }
                    type="number"
                    value={item.position}
                  />
                </label>
              </fieldset>
            );
          })}
        </section>
      ) : null}

      <div className="sticky bottom-20 z-20 flex flex-wrap items-center justify-between gap-4 border border-[var(--line)] bg-[color-mix(in_srgb,var(--canvas)_94%,transparent)] p-4 backdrop-blur-md lg:bottom-4">
        <p className="text-xs leading-5 text-[var(--muted)]">
          发布前检查内容、媒体替代文本和发布时间。
        </p>
        <SubmitButton pendingLabel="正在保存说说…">
          {moment ? "保存修改" : "创建说说"}
        </SubmitButton>
      </div>
    </form>
  );
}
