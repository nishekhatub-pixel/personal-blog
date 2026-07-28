import { randomUUID } from "node:crypto";
import { mkdir, readdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileTypeFromBuffer, fileTypeFromFile } from "file-type";
import {
  parseBuffer,
  selectCover,
  TimestampFormat,
  type IAudioMetadata,
} from "music-metadata";
import { env } from "@/lib/env";
import { httpsUrlSchema } from "@/lib/garden-validation";

type SupportedAudioMime = "audio/mpeg" | "audio/mp4" | "audio/aac" | "audio/ogg";
type SupportedAudioExtension = "mp3" | "m4a" | "aac" | "ogg";

const AUDIO_UPLOAD_ROOT = path.resolve(process.cwd(), "public", "uploads", "audio");
const storedAudioNamePattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(mp3|m4a|aac|ogg)$/;

const audioFormats: Record<
  SupportedAudioMime,
  {
    extensions: ReadonlySet<SupportedAudioExtension>;
    declaredMimes: ReadonlySet<string>;
    storedExtension: SupportedAudioExtension;
  }
> = {
  "audio/mpeg": {
    extensions: new Set(["mp3"]),
    declaredMimes: new Set(["audio/mpeg", "audio/mp3", "audio/x-mpeg"]),
    storedExtension: "mp3",
  },
  "audio/mp4": {
    extensions: new Set(["m4a"]),
    declaredMimes: new Set(["audio/mp4", "audio/m4a", "audio/x-m4a"]),
    storedExtension: "m4a",
  },
  "audio/aac": {
    extensions: new Set(["aac"]),
    declaredMimes: new Set(["audio/aac", "audio/x-aac"]),
    storedExtension: "aac",
  },
  "audio/ogg": {
    extensions: new Set(["ogg"]),
    declaredMimes: new Set(["audio/ogg", "application/ogg"]),
    storedExtension: "ogg",
  },
};

function extensionOf(filename: string) {
  return path.extname(filename).slice(1).toLocaleLowerCase("en-US");
}

function hasExecutableSignature(buffer: Buffer) {
  if (buffer.length < 4) return true;
  const firstFour = buffer.subarray(0, 4);
  const magicHex = firstFour.toString("hex");
  return (
    buffer.subarray(0, 2).toString("ascii") === "MZ" ||
    buffer.subarray(0, 2).toString("ascii") === "#!" ||
    magicHex === "7f454c46" ||
    ["feedface", "feedfacf", "cefaedfe", "cffaedfe", "cafebabe"].includes(magicHex)
  );
}

function safeAudioPath(url: string) {
  if (!/^\/uploads\/audio\/\d{4}\/\d{2}\/[a-f0-9-]+\.(mp3|m4a|aac|ogg)$/.test(url)) {
    throw new Error("音频路径格式无效。");
  }
  const target = path.resolve(process.cwd(), "public", `.${url}`);
  const relative = path.relative(AUDIO_UPLOAD_ROOT, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("音频路径越界。");
  }
  return target;
}

export type StoredAudio = {
  sourceType: "UPLOAD";
  album: string | null;
  artist: string | null;
  audioUrl: string;
  coverMediaId: string | null;
  coverOriginalName: string | null;
  durationSeconds: number | null;
  lyrics: string | null;
  originalName: string;
  storedName: string;
  mimeType: SupportedAudioMime;
  size: number;
  title: string | null;
};

function lrcTimestamp(milliseconds: number) {
  const safe = Math.max(0, Math.round(milliseconds));
  const minutes = Math.floor(safe / 60_000);
  const seconds = Math.floor((safe % 60_000) / 1000);
  const centiseconds = Math.floor((safe % 1000) / 10);
  return `[${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0",
  )}.${String(centiseconds).padStart(2, "0")}]`;
}

function lyricsFromMetadata(metadata: IAudioMetadata) {
  const tags = metadata.common.lyrics ?? [];
  const synchronized = tags.find(
    (tag) =>
      tag.timeStampFormat === TimestampFormat.milliseconds &&
      tag.syncText.some(
        (line) =>
          Number.isFinite(line.timestamp) && Boolean(line.text.trim()),
      ),
  );
  if (synchronized) {
    const lines = synchronized.syncText
      .filter(
        (line) =>
          Number.isFinite(line.timestamp) && Boolean(line.text.trim()),
      )
      .sort((left, right) => (left.timestamp ?? 0) - (right.timestamp ?? 0))
      .map(
        (line) =>
          `${lrcTimestamp(line.timestamp ?? 0)}${line.text.trim()}`,
      );
    if (lines.length) return lines.join("\n").slice(0, 200_000);
  }
  const plain = tags.find((tag) => tag.text?.trim())?.text?.trim();
  return plain ? plain.slice(0, 200_000) : null;
}

function pictureExtension(mimeType: string) {
  const extensions: Record<string, string> = {
    "image/avif": "avif",
    "image/gif": "gif",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/tiff": "tiff",
    "image/webp": "webp",
  };
  return extensions[mimeType.toLocaleLowerCase("en-US")] ?? null;
}

export async function storeAudioUpload(file: File): Promise<StoredAudio> {
  if (!(file instanceof File) || file.size <= 0) throw new Error("请选择音频文件。");
  if (file.size > env.AUDIO_UPLOAD_MAX_BYTES) {
    throw new Error(`音频不能超过 ${Math.floor(env.AUDIO_UPLOAD_MAX_BYTES / 1024 / 1024)} MB。`);
  }

  const originalName = path.basename(file.name).slice(0, 255);
  const suppliedExtension = extensionOf(originalName);
  const suppliedMime = file.type.trim().toLocaleLowerCase("en-US");
  const input = Buffer.from(await file.arrayBuffer());

  if (hasExecutableSignature(input)) throw new Error("检测到可执行文件签名，已拒绝上传。");

  const detected = await fileTypeFromBuffer(input);
  if (!detected || !(detected.mime in audioFormats)) {
    throw new Error("仅支持 MP3、M4A/AAC 与 OGG 音频。");
  }

  const detectedMime = detected.mime as SupportedAudioMime;
  const format = audioFormats[detectedMime];
  if (!format.extensions.has(suppliedExtension as SupportedAudioExtension)) {
    throw new Error("文件扩展名与音频签名不一致。");
  }
  if (!format.declaredMimes.has(suppliedMime)) {
    throw new Error("声明的 MIME 与音频签名不一致。");
  }

  const now = new Date();
  const directorySegment = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const outputDirectory = path.join(AUDIO_UPLOAD_ROOT, directorySegment);
  await mkdir(outputDirectory, { recursive: true });

  let metadata: IAudioMetadata | null = null;
  try {
    metadata = await parseBuffer(
      input,
      {
        mimeType: detectedMime,
        path: originalName,
        size: input.byteLength,
      },
      { duration: true },
    );
  } catch (error) {
    console.warn("audio_metadata_parse_failed", {
      error: error instanceof Error ? error.message : "unknown",
      originalName,
    });
  }

  const storedName = `${randomUUID()}.${format.storedExtension}`;
  const audioUrl = `/uploads/audio/${directorySegment}/${storedName}`;
  await writeFile(safeAudioPath(audioUrl), input, { flag: "wx" });

  const metadataTitle = metadata?.common.title?.trim() || null;
  let coverMediaId: string | null = null;
  let coverOriginalName: string | null = null;
  const embeddedCover = selectCover(metadata?.common.picture);
  const coverExtension = embeddedCover
    ? pictureExtension(embeddedCover.format)
    : null;
  if (embeddedCover && coverExtension) {
    coverOriginalName = `${path
      .basename(originalName, path.extname(originalName))
      .slice(0, 180)}-cover.${coverExtension}`;
    try {
      const { processMediaUpload } = await import("@/lib/uploads");
      const coverFile = new File(
        [Buffer.from(embeddedCover.data)],
        coverOriginalName,
        { type: embeddedCover.format },
      );
      const cover = await processMediaUpload(
        coverFile,
        `${metadataTitle || path.basename(originalName, path.extname(originalName)) || "音乐"} 封面`,
      );
      coverMediaId = cover.id;
    } catch (error) {
      console.warn("audio_cover_extract_failed", {
        error: error instanceof Error ? error.message : "unknown",
        originalName,
      });
      coverOriginalName = null;
    }
  }

  return {
    sourceType: "UPLOAD",
    album: metadata?.common.album?.trim() || null,
    artist:
      metadata?.common.artist?.trim() ||
      metadata?.common.albumartist?.trim() ||
      null,
    audioUrl,
    coverMediaId,
    coverOriginalName,
    durationSeconds:
      metadata?.format.duration &&
      Number.isFinite(metadata.format.duration) &&
      metadata.format.duration > 0
        ? Math.round(metadata.format.duration)
        : null,
    lyrics: metadata ? lyricsFromMetadata(metadata) : null,
    originalName,
    storedName,
    mimeType: detectedMime,
    size: input.byteLength,
    title: metadataTitle,
  };
}

export async function deleteStoredAudio(audioUrl: string) {
  try {
    await unlink(safeAudioPath(audioUrl));
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? error.code : "";
    if (code !== "ENOENT") throw error;
  }
}

export async function verifyStoredAudio(input: {
  audioUrl: string;
  storedName: string;
  mimeType: string;
  size: number;
}) {
  if (
    !storedAudioNamePattern.test(input.storedName) ||
    path.basename(input.audioUrl) !== input.storedName
  ) {
    throw new Error("音频存储名称无效。");
  }

  const target = safeAudioPath(input.audioUrl);
  let fileStat;
  try {
    fileStat = await stat(target);
  } catch {
    throw new Error("音频文件不存在，请重新上传。");
  }
  if (!fileStat.isFile()) throw new Error("音频存储目标不是文件。");
  if (fileStat.size !== input.size) {
    throw new Error("音频文件大小与上传记录不一致，请重新上传。");
  }

  const detected = await fileTypeFromFile(target);
  if (!detected || !(detected.mime in audioFormats)) {
    throw new Error("无法再次确认音频真实格式，请重新上传。");
  }
  const detectedMime = detected.mime as SupportedAudioMime;
  const format = audioFormats[detectedMime];
  const extension = extensionOf(input.storedName);
  if (
    detectedMime !== input.mimeType ||
    !format.extensions.has(extension as SupportedAudioExtension)
  ) {
    throw new Error("音频文件签名与保存记录不一致，请重新上传。");
  }
}

export async function cleanupOrphanedAudio(
  referencedUrls: ReadonlySet<string>,
  olderThanMs = 24 * 60 * 60 * 1000,
) {
  const cutoff = Date.now() - Math.max(24 * 60 * 60 * 1000, olderThanMs);
  let removed = 0;
  let years;
  try {
    years = await readdir(AUDIO_UPLOAD_ROOT, { withFileTypes: true });
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error ? error.code : "";
    if (code === "ENOENT") return 0;
    throw error;
  }

  for (const year of years) {
    if (!year.isDirectory() || !/^\d{4}$/.test(year.name)) continue;
    const yearPath = path.join(AUDIO_UPLOAD_ROOT, year.name);
    const months = await readdir(yearPath, { withFileTypes: true });
    for (const month of months) {
      if (!month.isDirectory() || !/^(0[1-9]|1[0-2])$/.test(month.name)) {
        continue;
      }
      const monthPath = path.join(yearPath, month.name);
      const files = await readdir(monthPath, { withFileTypes: true });
      for (const file of files) {
        if (!file.isFile() || !storedAudioNamePattern.test(file.name)) continue;
        const audioUrl = `/uploads/audio/${year.name}/${month.name}/${file.name}`;
        if (referencedUrls.has(audioUrl)) continue;
        const target = safeAudioPath(audioUrl);
        const fileStat = await stat(target);
        if (fileStat.mtimeMs >= cutoff) continue;
        await unlink(target);
        removed += 1;
      }
    }
  }
  return removed;
}

export function validateRemoteAudioUrl(value: string) {
  return httpsUrlSchema.parse(value);
}
