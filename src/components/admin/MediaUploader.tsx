"use client";

import { ImagePlus, LoaderCircle, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

type UploadState =
  | { kind: "idle" }
  | { kind: "uploading"; progress: number }
  | { kind: "error"; message: string }
  | { kind: "success"; message: string };

export type UploadedMedia = {
  alt: string;
  id: string;
  originalName: string;
  url: string;
};

const MAX_IMAGE_BYTES = 100 * 1024 * 1024;
const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/tiff",
  "image/heic",
  "image/heif",
]);
const allowedExtensions = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "avif",
  "gif",
  "tif",
  "tiff",
  "heic",
  "heif",
]);

function extensionOf(filename: string) {
  return filename.split(".").pop()?.toLocaleLowerCase("en-US") ?? "";
}

function readUploadedMedia(payload: unknown): UploadedMedia {
  if (!payload || typeof payload !== "object") {
    throw new Error("图片上传成功，但接口返回的数据无效。");
  }
  const media = (payload as { media?: unknown }).media;
  if (!media || typeof media !== "object") {
    throw new Error("图片上传成功，但媒体记录不完整。");
  }
  const value = media as Record<string, unknown>;
  if (
    typeof value.id !== "string" ||
    typeof value.alt !== "string" ||
    typeof value.originalName !== "string" ||
    typeof value.url !== "string"
  ) {
    throw new Error("图片上传成功，但媒体字段不完整。");
  }
  return {
    alt: value.alt,
    id: value.id,
    originalName: value.originalName,
    url: value.url,
  };
}

export function MediaUploader({
  onUploaded,
}: {
  onUploaded?: (media: UploadedMedia) => void;
} = {}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [dragging, setDragging] = useState(false);
  const [state, setState] = useState<UploadState>({ kind: "idle" });

  const upload = (file?: File) => {
    if (!file) return;
    const extension = extensionOf(file.name);
    const hasSupportedMime =
      file.type === "" ||
      file.type === "application/octet-stream" ||
      allowedMimeTypes.has(file.type.toLocaleLowerCase("en-US"));
    if (!hasSupportedMime || !allowedExtensions.has(extension)) {
      setState({
        kind: "error",
        message:
          "支持 JPEG、PNG、WebP、AVIF、GIF、TIFF、HEIC 和 HEIF 图片。",
      });
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setState({ kind: "error", message: "图片不能超过 100 MB。" });
      return;
    }

    const body = new FormData();
    body.append("file", file);
    body.append("alt", file.name.replace(/\.[^.]+$/, ""));
    const request = new XMLHttpRequest();
    request.open("POST", "/api/admin/media");
    request.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable) return;
      setState({
        kind: "uploading",
        progress: Math.round((event.loaded / event.total) * 100),
      });
    });
    request.addEventListener("load", () => {
      if (request.status >= 200 && request.status < 300) {
        try {
          const media = readUploadedMedia(
            JSON.parse(request.responseText) as unknown,
          );
          onUploaded?.(media);
          setState({
            kind: "success",
            message: "上传完成，响应式版本已经生成。",
          });
          if (inputRef.current) inputRef.current.value = "";
          router.refresh();
        } catch (error) {
          setState({
            kind: "error",
            message:
              error instanceof Error
                ? error.message
                : "无法读取上传后的媒体记录。",
          });
        }
      } else {
        let message = "上传失败，请检查图片后重试。";
        try {
          const payload = JSON.parse(request.responseText) as { error?: string };
          if (payload.error) message = payload.error;
        } catch {
          // Non-JSON server responses use the safe fallback message.
        }
        setState({ kind: "error", message });
      }
    });
    request.addEventListener("error", () =>
      setState({ kind: "error", message: "网络连接中断，图片未上传。" }),
    );
    setState({ kind: "uploading", progress: 0 });
    request.send(body);
  };

  return (
    <section>
      <label
        className={[
          "grid min-h-56 cursor-pointer place-items-center border border-dashed p-6 text-center transition-colors",
          dragging
            ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_8%,transparent)]"
            : "border-[var(--line)] hover:border-[var(--muted)]",
        ].join(" ")}
        onDragEnter={() => setDragging(true)}
        onDragLeave={() => setDragging(false)}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          upload(event.dataTransfer.files[0]);
        }}
      >
        <input
          accept=".jpg,.jpeg,.png,.webp,.avif,.gif,.tif,.tiff,.heic,.heif,image/jpeg,image/png,image/webp,image/avif,image/gif,image/tiff,image/heic,image/heif"
          className="sr-only"
          disabled={state.kind === "uploading"}
          onChange={(event) => upload(event.target.files?.[0])}
          ref={inputRef}
          type="file"
        />
        <span className="grid justify-items-center">
          {state.kind === "uploading" ? (
            <LoaderCircle
              aria-hidden="true"
              className="mb-4 animate-spin text-[var(--accent)]"
              size={30}
            />
          ) : (
            <UploadCloud
              aria-hidden="true"
              className="mb-4 text-[var(--accent)]"
              size={34}
              strokeWidth={1.4}
            />
          )}
          <span className="text-base font-medium">
            {state.kind === "uploading"
              ? `正在上传 ${state.progress}%`
              : "拖入图片，或点击选择文件"}
          </span>
          <span className="mt-2 text-xs leading-5 text-[var(--muted)]">
            JPEG、PNG、WebP、AVIF、GIF、TIFF、HEIC/HEIF · 最大 100 MB
          </span>
        </span>
      </label>
      <div aria-live="polite" className="mt-3 min-h-6 text-sm">
        {state.kind === "error" ? (
          <p className="text-[var(--danger)]">{state.message}</p>
        ) : null}
        {state.kind === "success" ? (
          <p className="flex items-center gap-2 text-[var(--success)]">
            <ImagePlus aria-hidden="true" size={16} />
            {state.message}
          </p>
        ) : null}
      </div>
    </section>
  );
}
