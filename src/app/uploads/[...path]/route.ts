import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { resolveUploadSegments } from "@/lib/media-storage";

export const runtime = "nodejs";

const imageNamePattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}-([1-9]\d{0,3})\.webp$/i;
const audioNamePattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(mp3|m4a|aac|ogg)$/i;
const imageFolders = new Set(["images", "photos", "avatars", "music"]);
const audioFolders = new Set(["music", "audio"]);

type StoredFile = {
  contentType: string;
  target: string;
};

function validDatePath(year: string, month: string) {
  return /^\d{4}$/.test(year) && /^(0[1-9]|1[0-2])$/.test(month);
}

function audioContentType(extension: string) {
  const types: Record<string, string> = {
    aac: "audio/aac",
    m4a: "audio/mp4",
    mp3: "audio/mpeg",
    ogg: "audio/ogg",
  };
  return types[extension.toLocaleLowerCase("en-US")] ?? "";
}

function resolveStoredFile(segments: string[]): StoredFile | null {
  const storageSegments = segments;
  let folder = "";
  let year = "";
  let month = "";
  let filename = "";

  if (segments.length === 3) {
    [year, month, filename] = segments;
  } else if (segments.length === 4) {
    [folder, year, month, filename] = segments;
  } else {
    return null;
  }

  if (!validDatePath(year, month)) return null;

  const imageMatch = imageNamePattern.exec(filename);
  if (imageMatch) {
    if (Number(imageMatch[1]) > 2000) return null;
    if (folder && !imageFolders.has(folder)) return null;
    return {
      contentType: "image/webp",
      target: resolveUploadSegments(storageSegments),
    };
  }

  const audioMatch = audioNamePattern.exec(filename);
  if (!folder || !audioFolders.has(folder) || !audioMatch) return null;
  return {
    contentType: audioContentType(audioMatch[1]),
    target: resolveUploadSegments(storageSegments),
  };
}

function parseRange(value: string | null, size: number) {
  if (!value) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(value.trim());
  if (!match) return false;

  const startText = match[1];
  const endText = match[2];
  if (!startText && !endText) return false;

  let start: number;
  let end: number;
  if (!startText) {
    const suffixLength = Number(endText);
    if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) return false;
    start = Math.max(0, size - suffixLength);
    end = size - 1;
  } else {
    start = Number(startText);
    end = endText ? Number(endText) : size - 1;
  }

  if (
    !Number.isSafeInteger(start) ||
    !Number.isSafeInteger(end) ||
    start < 0 ||
    end < start ||
    start >= size
  ) {
    return false;
  }
  return { end: Math.min(end, size - 1), start };
}

async function serveUpload(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
  headOnly = false,
) {
  let stored: StoredFile | null = null;
  try {
    stored = resolveStoredFile((await context.params).path);
  } catch {
    stored = null;
  }
  if (!stored) {
    return NextResponse.json({ error: "文件路径无效。" }, { status: 400 });
  }

  try {
    const fileStat = await stat(stored.target);
    if (!fileStat.isFile()) {
      return NextResponse.json({ error: "文件不存在。" }, { status: 404 });
    }

    const range = parseRange(request.headers.get("range"), fileStat.size);
    if (range === false) {
      return new Response(null, {
        status: 416,
        headers: {
          "Content-Range": `bytes */${fileStat.size}`,
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    const start = range?.start ?? 0;
    const end = range?.end ?? fileStat.size - 1;
    const contentLength = Math.max(0, end - start + 1);
    const headers = new Headers({
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Length": String(contentLength),
      "Content-Type": stored.contentType,
      "X-Content-Type-Options": "nosniff",
    });
    if (range) headers.set("Content-Range", `bytes ${start}-${end}/${fileStat.size}`);

    if (headOnly) {
      return new Response(null, { headers, status: range ? 206 : 200 });
    }
    const fileStream = createReadStream(stored.target, { end, start });
    return new Response(
      Readable.toWeb(fileStream) as ReadableStream<Uint8Array>,
      { headers, status: range ? 206 : 200 },
    );
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String(error.code)
        : "";
    if (code === "ENOENT") {
      return NextResponse.json({ error: "文件不存在。" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "文件暂时无法读取。" },
      { status: 500 },
    );
  }
}

export function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  return serveUpload(request, context);
}

export function HEAD(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  return serveUpload(request, context, true);
}
