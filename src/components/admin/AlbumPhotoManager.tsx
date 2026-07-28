"use client";

import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ImagePlus,
  LoaderCircle,
  UploadCloud,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import {
  createAlbumPhotoDraft,
  moveAlbumPhoto,
} from "@/actions/garden-admin";
import { useRouter } from "next/navigation";

export type AlbumPhotoManagerItem = {
  alt: string;
  id: string;
  media: {
    originalName: string;
    url: string;
  };
  position: number;
  status: string;
};

type UploadItem = {
  id: string;
  message: string;
  name: string;
  progress: number;
  state:
    | "queued"
    | "invalid"
    | "uploading"
    | "linking"
    | "done"
    | "error";
};

type Notice = {
  kind: "error" | "success";
  message: string;
} | null;

const MAX_IMAGE_BYTES = 100 * 1024 * 1024;
const imageFormats = new Map<string, ReadonlySet<string>>([
  ["image/jpeg", new Set(["jpg", "jpeg"])],
  ["image/png", new Set(["png"])],
  ["image/webp", new Set(["webp"])],
  ["image/avif", new Set(["avif"])],
  ["image/gif", new Set(["gif"])],
  ["image/tiff", new Set(["tif", "tiff"])],
  ["image/heic", new Set(["heic"])],
  ["image/heif", new Set(["heif"])],
]);
const allImageExtensions = new Set(
  [...imageFormats.values()].flatMap((extensions) => [...extensions]),
);

function extensionOf(filename: string) {
  return filename.split(".").pop()?.toLocaleLowerCase("en-US") ?? "";
}

function validateFile(file: File) {
  const extension = extensionOf(file.name);
  const declaredType = file.type.toLocaleLowerCase("en-US");
  const extensions = imageFormats.get(declaredType);
  const genericDeclaredType =
    declaredType === "" || declaredType === "application/octet-stream";
  if ((!extensions && !genericDeclaredType) || !allImageExtensions.has(extension)) {
    return "支持 JPEG、PNG、WebP、AVIF、GIF、TIFF、HEIC 和 HEIF 图片。";
  }
  if (extensions && !extensions.has(extension)) {
    return "文件扩展名与声明的图片类型不一致。";
  }
  if (file.size <= 0) return "图片文件不能为空。";
  if (file.size > MAX_IMAGE_BYTES) return "单张图片不能超过 100 MB。";
  return "";
}

function altForFile(file: File, index: number) {
  const stem = file.name.replace(/\.[^.]+$/, "").trim();
  return (stem.length >= 2 ? stem : `相册照片 ${index + 1}`).slice(0, 255);
}

function responseError(text: string, fallback: string) {
  try {
    const payload = JSON.parse(text) as { error?: unknown };
    return typeof payload.error === "string" && payload.error
      ? payload.error
      : fallback;
  } catch {
    return fallback;
  }
}

function uploadMedia(
  file: File,
  alt: string,
  onProgress: (progress: number) => void,
) {
  return new Promise<{ id: string }>((resolve, reject) => {
    const body = new FormData();
    body.append("file", file);
    body.append("alt", alt);
    body.append("kind", "photos");

    const request = new XMLHttpRequest();
    request.open("POST", "/api/admin/media");
    request.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable) return;
      onProgress(Math.round((event.loaded / event.total) * 100));
    });
    request.addEventListener("load", () => {
      if (request.status < 200 || request.status >= 300) {
        reject(
          new Error(
            responseError(
              request.responseText,
              "上传失败，请检查图片后重试。",
            ),
          ),
        );
        return;
      }
      try {
        const payload = JSON.parse(request.responseText) as {
          media?: { id?: unknown };
        };
        if (typeof payload.media?.id !== "string" || !payload.media.id) {
          reject(new Error("媒体接口返回的数据不完整。"));
          return;
        }
        resolve({ id: payload.media.id });
      } catch {
        reject(new Error("媒体接口没有返回可识别的数据。"));
      }
    });
    request.addEventListener("error", () => {
      reject(new Error("网络连接中断，图片未上传。"));
    });
    request.send(body);
  });
}

function statusLabel(status: string) {
  if (status === "PUBLISHED") return "已发布";
  if (status === "ARCHIVED") return "已归档";
  return "草稿";
}

export function AlbumPhotoManager({
  albumId,
  initialPhotos,
}: {
  albumId: string;
  initialPhotos: AlbumPhotoManagerItem[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [dragging, setDragging] = useState(false);
  const [running, setRunning] = useState(false);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [photos, setPhotos] = useState(initialPhotos);
  const [moveBusyId, setMoveBusyId] = useState("");
  const [notice, setNotice] = useState<Notice>(null);

  function updateUpload(id: string, patch: Partial<UploadItem>) {
    setUploads((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  async function processFiles(fileList: FileList | File[]) {
    if (running) return;
    const files = Array.from(fileList);
    if (!files.length) return;

    const batch = files.map((file, index) => {
      const message = validateFile(file);
      return {
        file,
        alt: altForFile(file, index),
        item: {
          id: `${Date.now()}-${index}-${file.name}-${file.lastModified}`,
          message,
          name: file.name,
          progress: 0,
          state: message ? ("invalid" as const) : ("queued" as const),
        },
      };
    });
    setUploads(batch.map(({ item }) => item));
    setNotice(null);

    if (batch.every(({ item }) => item.state === "invalid")) {
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setRunning(true);
    let addedCount = 0;

    for (const { alt, file, item } of batch) {
      if (item.state === "invalid") continue;
      let uploadedMediaId = "";
      try {
        updateUpload(item.id, {
          message: "正在上传并生成响应式图片…",
          progress: 0,
          state: "uploading",
        });
        const media = await uploadMedia(file, alt, (progress) => {
          updateUpload(item.id, { progress });
        });
        uploadedMediaId = media.id;
        updateUpload(item.id, {
          message: "上传完成，正在创建照片草稿…",
          progress: 100,
          state: "linking",
        });

        const result = await createAlbumPhotoDraft({
          albumId,
          mediaId: media.id,
        });
        if (!result.ok) {
          updateUpload(item.id, {
            message: result.message,
            state: "error",
          });
          continue;
        }

        addedCount += 1;
        updateUpload(item.id, {
          message: result.message,
          progress: 100,
          state: "done",
        });
      } catch (error) {
        updateUpload(item.id, {
          message: uploadedMediaId
            ? "图片已保留在媒体库，但创建照片草稿失败，请稍后重试。"
            : error instanceof Error
              ? error.message
              : "图片上传失败，请稍后重试。",
          state: "error",
        });
      }
    }

    setRunning(false);
    if (inputRef.current) inputRef.current.value = "";
    if (addedCount > 0) {
      setNotice({
        kind: "success",
        message: `已将 ${addedCount} 张图片作为草稿加入相册。`,
      });
      router.refresh();
    }
  }

  async function movePhoto(
    photoId: string,
    direction: "up" | "down",
  ) {
    if (moveBusyId) return;
    setMoveBusyId(photoId);
    setNotice(null);
    try {
      const result = await moveAlbumPhoto({ albumId, direction, photoId });
      if (!result.ok) {
        setNotice({ kind: "error", message: result.message });
        return;
      }

      setPhotos((current) => {
        const byId = new Map(current.map((photo) => [photo.id, photo]));
        return result.order
          .map((id, position) => {
            const photo = byId.get(id);
            return photo ? { ...photo, position } : null;
          })
          .filter((photo): photo is AlbumPhotoManagerItem => photo !== null);
      });
      setNotice({ kind: "success", message: result.message });
      router.refresh();
    } catch {
      setNotice({ kind: "error", message: "照片排序失败，请稍后重试。" });
    } finally {
      setMoveBusyId("");
    }
  }

  return (
    <div className="mt-12 grid gap-10">
      <section
        aria-labelledby="album-batch-upload-heading"
        className="border-t border-[var(--line)] pt-8"
      >
        <div className="grid gap-2">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
            Album media
          </p>
          <h2
            className="text-xl font-semibold tracking-[-0.02em]"
            id="album-batch-upload-heading"
          >
            批量添加照片
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-[var(--muted)]">
            图片会逐张完成安全校验和上传；成功后立即建立当前相册的照片草稿，可再进入单张编辑页补充说明。
          </p>
        </div>

        <label
          className={[
            "mt-5 grid min-h-44 cursor-pointer place-items-center border border-dashed p-6 text-center transition-colors",
            dragging
              ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_8%,transparent)]"
              : "border-[var(--line)] hover:border-[var(--muted)]",
            running ? "cursor-wait opacity-70" : "",
          ].join(" ")}
          onDragEnter={() => setDragging(true)}
          onDragLeave={() => setDragging(false)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            void processFiles(event.dataTransfer.files);
          }}
        >
          <input
            accept=".jpg,.jpeg,.png,.webp,.avif,.gif,.tif,.tiff,.heic,.heif,image/jpeg,image/png,image/webp,image/avif,image/gif,image/tiff,image/heic,image/heif"
            className="sr-only"
            disabled={running}
            multiple
            onChange={(event) => {
              if (event.target.files) void processFiles(event.target.files);
            }}
            ref={inputRef}
            type="file"
          />
          <span className="grid justify-items-center">
            {running ? (
              <LoaderCircle
                aria-hidden="true"
                className="mb-3 animate-spin text-[var(--accent)]"
                size={30}
              />
            ) : (
              <UploadCloud
                aria-hidden="true"
                className="mb-3 text-[var(--accent)]"
                size={32}
                strokeWidth={1.4}
              />
            )}
            <span className="font-medium">
              {running
                ? "正在逐张处理，请保持页面打开"
                : "拖入多张图片，或点击批量选择"}
            </span>
            <span className="mt-2 text-xs text-[var(--muted)]">
              JPEG、PNG、WebP、AVIF、GIF、TIFF、HEIC/HEIF · 每张最大 100 MB
            </span>
          </span>
        </label>

        {uploads.length ? (
          <ul className="mt-4 grid gap-2" aria-label="批量上传进度">
            {uploads.map((item) => (
              <li
                className="grid gap-2 border border-[var(--line)] px-3 py-3 text-sm sm:grid-cols-[minmax(0,1fr)_8rem] sm:items-center"
                key={item.id}
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{item.name}</span>
                  <span
                    className={
                      item.state === "error" || item.state === "invalid"
                        ? "text-xs text-[var(--danger)]"
                        : item.state === "done"
                          ? "text-xs text-[var(--success)]"
                          : "text-xs text-[var(--muted)]"
                    }
                  >
                    {item.message || "等待处理"}
                  </span>
                </span>
                <span className="flex items-center justify-end gap-2 font-mono text-xs text-[var(--muted)]">
                  {item.state === "done" ? (
                    <CheckCircle2
                      aria-hidden="true"
                      className="text-[var(--success)]"
                      size={16}
                    />
                  ) : null}
                  {item.state === "uploading"
                    ? `${item.progress}%`
                    : item.state === "linking"
                      ? "建档中"
                      : item.state === "queued"
                        ? "排队中"
                        : ""}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section
        aria-labelledby="album-photo-order-heading"
        className="border-t border-[var(--line)] pt-8"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="grid gap-2">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
              Photo order
            </p>
            <h2
              className="text-xl font-semibold tracking-[-0.02em]"
              id="album-photo-order-heading"
            >
              相册照片 · {photos.length}
            </h2>
          </div>
          <p className="text-xs text-[var(--muted)]">
            上移或下移会立即保存真实 position。
          </p>
        </div>

        <div aria-live="polite" className="mt-3 min-h-6 text-sm">
          {notice ? (
            <p
              className={
                notice.kind === "error"
                  ? "text-[var(--danger)]"
                  : "text-[var(--success)]"
              }
            >
              {notice.message}
            </p>
          ) : null}
        </div>

        {photos.length ? (
          <ol className="mt-3 grid gap-3">
            {photos.map((photo, index) => (
              <li
                className="grid gap-4 border border-[var(--line)] p-3 sm:grid-cols-[7rem_minmax(0,1fr)_auto] sm:items-center"
                key={photo.id}
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-[var(--surface)]">
                  <Image
                    alt={photo.alt}
                    className="object-cover"
                    fill
                    sizes="112px"
                    src={photo.media.url}
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-[var(--muted)]">
                      #{index + 1}
                    </span>
                    <span className="border border-[var(--line)] px-2 py-0.5 text-[11px] text-[var(--muted)]">
                      {statusLabel(photo.status)}
                    </span>
                  </div>
                  <p className="mt-2 truncate font-medium">{photo.alt}</p>
                  <p className="mt-1 truncate text-xs text-[var(--muted)]">
                    {photo.media.originalName} · position {photo.position}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1 sm:justify-end">
                  <Link
                    className="inline-flex min-h-11 items-center px-3 text-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                    href={`/admin/photos/${photo.id}/edit`}
                  >
                    编辑
                  </Link>
                  <button
                    aria-label={`上移 ${photo.alt}`}
                    className="inline-flex size-11 items-center justify-center border border-[var(--line)] hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={index === 0 || Boolean(moveBusyId)}
                    onClick={() => void movePhoto(photo.id, "up")}
                    title="上移"
                    type="button"
                  >
                    <ArrowUp aria-hidden="true" size={16} />
                  </button>
                  <button
                    aria-label={`下移 ${photo.alt}`}
                    className="inline-flex size-11 items-center justify-center border border-[var(--line)] hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={
                      index === photos.length - 1 || Boolean(moveBusyId)
                    }
                    onClick={() => void movePhoto(photo.id, "down")}
                    title="下移"
                    type="button"
                  >
                    <ArrowDown aria-hidden="true" size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <div className="mt-3 grid min-h-36 place-items-center border border-dashed border-[var(--line)] p-6 text-center">
            <span className="grid justify-items-center gap-2 text-sm text-[var(--muted)]">
              <ImagePlus aria-hidden="true" size={24} strokeWidth={1.4} />
              当前相册还没有照片，可从上方批量添加。
            </span>
          </div>
        )}
      </section>
    </div>
  );
}
