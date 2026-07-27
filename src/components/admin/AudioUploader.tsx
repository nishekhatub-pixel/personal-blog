"use client";

import { CheckCircle2, LoaderCircle, Music2, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";

export type AudioUploadMetadata = {
  audioUrl: string;
  durationSeconds: number | null;
  mimeType: string;
  originalName: string;
  size: number;
  storedName: string;
};

type AudioUploaderProps = {
  onUploaded: (metadata: AudioUploadMetadata) => void;
  value?: AudioUploadMetadata | null;
};

function readMetadata(payload: unknown): AudioUploadMetadata {
  if (!payload || typeof payload !== "object") {
    throw new Error("音频接口返回了无效数据。");
  }
  const root = payload as Record<string, unknown>;
  const nested =
    root.audio && typeof root.audio === "object"
      ? root.audio
      : root.data && typeof root.data === "object"
        ? root.data
        : root.metadata && typeof root.metadata === "object"
          ? root.metadata
          : root;
  const value = nested as Record<string, unknown>;
  const audioUrl = typeof value.audioUrl === "string" ? value.audioUrl : "";
  const originalName = typeof value.originalName === "string" ? value.originalName : "";
  const storedName = typeof value.storedName === "string" ? value.storedName : "";
  const mimeType = typeof value.mimeType === "string" ? value.mimeType : "";
  const size = Number(value.size);
  const duration = value.durationSeconds == null ? null : Number(value.durationSeconds);

  if (!audioUrl || !originalName || !storedName || !mimeType || !Number.isFinite(size) || size <= 0) {
    throw new Error("音频上传成功，但返回的文件元数据不完整。");
  }

  return {
    audioUrl,
    durationSeconds: duration && Number.isFinite(duration) ? Math.round(duration) : null,
    mimeType,
    originalName,
    size: Math.round(size),
    storedName,
  };
}

function humanSize(size: number) {
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

export function AudioUploader({ onUploaded, value }: AudioUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [state, setState] = useState<
    | { kind: "idle" }
    | { kind: "uploading"; progress: number }
    | { kind: "error"; message: string }
    | { kind: "success"; message: string }
  >({ kind: "idle" });

  function upload(file?: File) {
    if (!file) return;
    const allowedMimeTypes = [
      "audio/mpeg",
      "audio/mp4",
      "audio/aac",
      "audio/ogg",
      "audio/m4a",
      "audio/x-m4a",
      "audio/x-aac",
      "application/ogg",
    ];
    const allowedExtensions = [".mp3", ".m4a", ".aac", ".ogg"];
    const hasAllowedExtension = allowedExtensions.some((extension) =>
      file.name.toLocaleLowerCase("en-US").endsWith(extension),
    );
    if (!allowedMimeTypes.includes(file.type) && !hasAllowedExtension) {
      setState({
        kind: "error",
        message: "仅支持 MP3、M4A、AAC 或 OGG 音频。",
      });
      return;
    }

    const body = new FormData();
    body.append("file", file);
    const request = new XMLHttpRequest();
    request.open("POST", "/api/admin/audio");
    request.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable) return;
      setState({
        kind: "uploading",
        progress: Math.round((event.loaded / event.total) * 100),
      });
    });
    request.addEventListener("load", () => {
      if (request.status < 200 || request.status >= 300) {
        let message = "上传失败，请检查音频后重试。";
        try {
          const response = JSON.parse(request.responseText) as { error?: string };
          if (response.error) message = response.error;
        } catch {
          message = "音频接口未返回可识别的错误信息。";
        }
        setState({ kind: "error", message });
        return;
      }
      try {
        const metadata = readMetadata(JSON.parse(request.responseText) as unknown);
        onUploaded(metadata);
        if (inputRef.current) inputRef.current.value = "";
        setState({
          kind: "success",
          message: `已上传 ${metadata.originalName}，表单元数据已更新。`,
        });
      } catch (error) {
        setState({
          kind: "error",
          message: error instanceof Error ? error.message : "无法读取音频元数据。",
        });
      }
    });
    request.addEventListener("error", () => {
      setState({ kind: "error", message: "网络连接中断，音频未上传。" });
    });
    setState({ kind: "uploading", progress: 0 });
    request.send(body);
  }

  return (
    <section aria-labelledby="audio-upload-heading">
      <h2 className="text-sm font-semibold" id="audio-upload-heading">
        上传音频文件
      </h2>
      <label
        className={[
          "mt-3 grid min-h-48 cursor-pointer place-items-center border border-dashed p-6 text-center transition-colors",
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
          accept=".mp3,.m4a,.aac,.ogg,audio/mpeg,audio/mp4,audio/aac,audio/ogg"
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
              size={32}
              strokeWidth={1.4}
            />
          )}
          <span className="font-medium">
            {state.kind === "uploading"
              ? `正在上传 ${state.progress}%`
              : "拖入音频，或点击选择文件"}
          </span>
          <span className="mt-2 text-xs text-[var(--muted)]">
            MP3、M4A、AAC、OGG；体积上限由服务端配置决定
          </span>
        </span>
      </label>
      {value ? (
        <div className="mt-3 flex min-h-12 items-center gap-3 border border-[var(--line)] px-3 text-sm">
          <Music2 aria-hidden="true" className="shrink-0 text-[var(--accent)]" size={17} />
          <span className="min-w-0 flex-1 truncate">{value.originalName}</span>
          <span className="font-mono text-xs text-[var(--muted)]">
            {humanSize(value.size)}
          </span>
        </div>
      ) : null}
      <div aria-live="polite" className="mt-3 min-h-6 text-sm">
        {state.kind === "error" ? (
          <p className="text-[var(--danger)]">{state.message}</p>
        ) : null}
        {state.kind === "success" ? (
          <p className="flex items-center gap-2 text-[var(--success)]">
            <CheckCircle2 aria-hidden="true" size={16} />
            {state.message}
          </p>
        ) : null}
      </div>
    </section>
  );
}
