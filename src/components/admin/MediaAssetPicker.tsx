"use client";

import { Check, ImageIcon, Library, Upload } from "lucide-react";
import { useState } from "react";
import {
  MediaUploader,
  type UploadedMedia,
} from "@/components/admin/MediaUploader";

export type MediaAssetOption = UploadedMedia;

type MediaAssetPickerProps = {
  description?: string;
  initialValue?: string | null;
  label: string;
  mediaOptions: MediaAssetOption[];
  name: string;
  onSelectionChange?: (media: MediaAssetOption | null) => void;
};

export function MediaAssetPicker({
  description,
  initialValue,
  label,
  mediaOptions,
  name,
  onSelectionChange,
}: MediaAssetPickerProps) {
  const [source, setSource] = useState<"library" | "upload">("upload");
  const [availableMedia, setAvailableMedia] =
    useState<MediaAssetOption[]>(mediaOptions);
  const [selectedValue, setSelectedValue] = useState(initialValue ?? "");
  const selectedMedia = availableMedia.find(
    (media) => media.url === selectedValue,
  );

  function selectMedia(value: string) {
    setSelectedValue(value);
    onSelectionChange?.(
      availableMedia.find((media) => media.url === value) ?? null,
    );
  }

  function handleUploaded(media: UploadedMedia) {
    setAvailableMedia((current) => {
      if (current.some((item) => item.id === media.id)) return current;
      return [media, ...current];
    });
    setSelectedValue(media.url);
    onSelectionChange?.(media);
  }

  return (
    <fieldset className="grid min-w-0 gap-4">
      <legend className="text-sm font-medium">{label}</legend>
      {description ? (
        <p className="text-xs leading-5 text-[var(--muted)]">{description}</p>
      ) : null}
      <input name={name} type="hidden" value={selectedValue} />

      <div className="grid grid-cols-2 border border-[var(--line)] p-1">
        <button
          aria-pressed={source === "upload"}
          className={[
            "inline-flex min-h-11 items-center justify-center gap-2 px-3 text-sm transition-colors",
            source === "upload"
              ? "bg-[var(--ink)] text-[var(--canvas)]"
              : "text-[var(--muted)] hover:text-[var(--ink)]",
          ].join(" ")}
          onClick={() => setSource("upload")}
          type="button"
        >
          <Upload aria-hidden="true" size={16} />
          本地上传
        </button>
        <button
          aria-pressed={source === "library"}
          className={[
            "inline-flex min-h-11 items-center justify-center gap-2 px-3 text-sm transition-colors",
            source === "library"
              ? "bg-[var(--ink)] text-[var(--canvas)]"
              : "text-[var(--muted)] hover:text-[var(--ink)]",
          ].join(" ")}
          onClick={() => setSource("library")}
          type="button"
        >
          <Library aria-hidden="true" size={16} />
          媒体库
        </button>
      </div>

      {source === "upload" ? (
        <MediaUploader
          onUploaded={handleUploaded}
          refreshAfterUpload={false}
        />
      ) : (
        <label className="grid gap-2 text-sm">
          <span className="text-xs text-[var(--muted)]">
            选择博客媒体库中的图片
          </span>
          <select
            className="min-h-11 w-full border border-[var(--line)] bg-[var(--canvas)] px-3 outline-none focus:border-[var(--accent)]"
            onChange={(event) => selectMedia(event.target.value)}
            value={selectedValue}
          >
            <option value="">不设置图片</option>
            {selectedValue && !selectedMedia ? (
              <option value={selectedValue}>当前已保存图片</option>
            ) : null}
            {availableMedia.map((media) => (
              <option key={media.id} value={media.url}>
                {media.alt || media.originalName}
              </option>
            ))}
          </select>
        </label>
      )}

      {selectedValue ? (
        <div className="grid min-w-0 gap-3 border border-[var(--line)] p-3 sm:grid-cols-[7rem_minmax(0,1fr)_auto] sm:items-center">
          <div
            aria-label={selectedMedia?.alt || "当前选择的图片"}
            className="aspect-[4/3] w-full bg-[var(--paper)] bg-cover bg-center sm:w-28"
            role="img"
            style={{ backgroundImage: `url(${JSON.stringify(selectedValue)})` }}
          />
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-medium">
              <Check aria-hidden="true" className="text-[var(--success)]" size={16} />
              已选为当前图片
            </p>
            <p className="mt-1 truncate text-xs text-[var(--muted)]">
              {selectedMedia?.originalName ?? selectedValue}
            </p>
          </div>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 border border-[var(--line)] px-4 text-sm hover:border-[var(--muted)]"
            onClick={() => selectMedia("")}
            type="button"
          >
            <ImageIcon aria-hidden="true" size={16} />
            移除
          </button>
        </div>
      ) : (
        <p className="text-xs text-[var(--muted)]">尚未选择图片。</p>
      )}
    </fieldset>
  );
}
