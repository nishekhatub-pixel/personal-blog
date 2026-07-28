import { mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

export const STORAGE_KINDS = [
  "images",
  "photos",
  "music",
  "avatars",
  "temp",
] as const;

export type StorageKind = (typeof STORAGE_KINDS)[number];

const defaultUploadRoot = path.join(
  /* turbopackIgnore: true */
  process.cwd(),
  "public",
  "uploads",
);

export const UPLOAD_ROOT = path.resolve(
  /* turbopackIgnore: true */
  env.UPLOAD_ROOT ?? defaultUploadRoot,
);

function assertLocalStorage() {
  if (env.STORAGE_DRIVER !== "local") {
    throw new Error(
      `存储驱动 ${env.STORAGE_DRIVER} 尚未配置。请先使用 STORAGE_DRIVER=local。`,
    );
  }
}

function assertSafeSegments(segments: readonly string[]) {
  if (
    segments.length === 0 ||
    segments.some(
      (segment) =>
        !segment ||
        segment === "." ||
        segment === ".." ||
        segment.includes("/") ||
        segment.includes("\\") ||
        segment.includes("\0"),
    )
  ) {
    throw new Error("媒体路径无效。");
  }
}

export function resolveUploadSegments(segments: readonly string[]) {
  assertLocalStorage();
  assertSafeSegments(segments);
  const target = path.resolve(UPLOAD_ROOT, ...segments);
  const relative = path.relative(UPLOAD_ROOT, target);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("媒体路径越界。");
  }
  return target;
}

export function storageDirectory(
  kind: StorageKind,
  ...segments: readonly string[]
) {
  return resolveUploadSegments([kind, ...segments]);
}

export function publicUploadUrl(...segments: readonly string[]) {
  assertSafeSegments(segments);
  return `/uploads/${segments.map(encodeURIComponent).join("/")}`;
}

export async function ensureStorageLayout() {
  assertLocalStorage();
  await Promise.all(
    STORAGE_KINDS.map((kind) =>
      mkdir(storageDirectory(kind), { recursive: true }),
    ),
  );
}

export function safeUploadPath(url: string) {
  if (
    !url.startsWith("/uploads/") ||
    url.includes("?") ||
    url.includes("#") ||
    url.includes("%")
  ) {
    throw new Error("媒体路径无效。");
  }
  return resolveUploadSegments(url.slice("/uploads/".length).split("/"));
}

export async function deleteMediaAndFiles(id: string) {
  const media = await db.media.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          albumCovers: true,
          photos: true,
          momentMedia: true,
          musicCovers: true,
          playlistCovers: true,
        },
      },
    },
  });
  if (!media) throw new Error("媒体不存在。");
  const referenceCount = Object.values(media._count).reduce(
    (total, count) => total + count,
    0,
  );
  if (referenceCount > 0) {
    throw new Error(
      `该媒体仍被 ${referenceCount} 处相册、照片、说说或音乐内容引用，请先解除引用。`,
    );
  }

  let variants: Record<string, string> = {};
  try {
    variants = JSON.parse(media.variantsJson) as Record<string, string>;
  } catch {
    variants = {};
  }
  const urls = new Set([media.url, ...Object.values(variants)]);
  await db.media.delete({ where: { id } });
  const cleanup = await Promise.allSettled(
    Array.from(urls).map(async (url) => {
      try {
        await unlink(safeUploadPath(url));
      } catch (error) {
        const code =
          error && typeof error === "object" && "code" in error
            ? error.code
            : "";
        if (code !== "ENOENT") throw error;
      }
    }),
  );
  const failures = cleanup.filter((result) => result.status === "rejected");
  if (failures.length > 0) {
    console.warn(
      JSON.stringify({
        event: "media.cleanup.partial",
        mediaId: id,
        failedFiles: failures.length,
      }),
    );
  }
  return media;
}
