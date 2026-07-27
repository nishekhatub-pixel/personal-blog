import { unlink } from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/db";

export const UPLOAD_ROOT = path.resolve(process.cwd(), "public", "uploads");

export function safeUploadPath(url: string) {
  if (!url.startsWith("/uploads/")) throw new Error("媒体路径无效。");
  const target = path.resolve(process.cwd(), "public", `.${url}`);
  const relative = path.relative(UPLOAD_ROOT, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("媒体路径越界。");
  }
  return target;
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
