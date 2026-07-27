"use client";

import { ImagePlus, LoaderCircle, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

type UploadState =
  | { kind: "idle" }
  | { kind: "uploading"; progress: number }
  | { kind: "error"; message: string }
  | { kind: "success"; message: string };

export function MediaUploader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [dragging, setDragging] = useState(false);
  const [state, setState] = useState<UploadState>({ kind: "idle" });

  const upload = (file?: File) => {
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    if (!allowed.includes(file.type)) {
      setState({ kind: "error", message: "仅支持 JPEG、PNG、WebP 或 AVIF 图片。" });
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setState({ kind: "error", message: "图片不能超过 8 MB。" });
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
        setState({ kind: "success", message: "上传完成，响应式版本已经生成。" });
        if (inputRef.current) inputRef.current.value = "";
        router.refresh();
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
          accept="image/jpeg,image/png,image/webp,image/avif"
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
            JPEG、PNG、WebP、AVIF · 最大 8 MB
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
