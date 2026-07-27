import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileTypeFromBuffer } from "file-type";
import sharp from "sharp";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

const ACCEPTED_TYPES = {
  "image/jpeg": new Set(["jpg", "jpeg"]),
  "image/png": new Set(["png"]),
  "image/webp": new Set(["webp"]),
  "image/avif": new Set(["avif"]),
} as const;

const UPLOAD_ROOT = path.resolve(process.cwd(), "public", "uploads");

function extensionOf(filename: string) {
  return path.extname(filename).slice(1).toLocaleLowerCase("en-US");
}

function safeUploadPath(url: string) {
  if (!url.startsWith("/uploads/")) throw new Error("媒体路径无效。");
  const target = path.resolve(process.cwd(), "public", `.${url}`);
  const relative = path.relative(UPLOAD_ROOT, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) throw new Error("媒体路径越界。");
  return target;
}

export async function processMediaUpload(file: File, alt: string) {
  if (!file || file.size === 0) throw new Error("请选择图片文件。");
  if (file.size > env.UPLOAD_MAX_BYTES) throw new Error("图片不能超过 8 MB。");
  if (alt.trim().length < 2 || alt.trim().length > 255) throw new Error("请填写 2 至 255 字的替代文本。");

  const declaredType = file.type.toLocaleLowerCase("en-US");
  const declaredExtensions = ACCEPTED_TYPES[declaredType as keyof typeof ACCEPTED_TYPES];
  if (!declaredExtensions) throw new Error("仅支持 JPEG、PNG、WebP 和 AVIF 图片。");

  const extension = extensionOf(file.name);
  if (!declaredExtensions.has(extension as never)) throw new Error("文件扩展名与声明的图片类型不一致。");

  const input = Buffer.from(await file.arrayBuffer());
  const detected = await fileTypeFromBuffer(input);
  if (!detected || !(detected.mime in ACCEPTED_TYPES)) throw new Error("无法识别图片的真实格式。");
  if (detected.mime !== declaredType) throw new Error("图片 MIME 与文件内容不一致。");
  const detectedExtensions = ACCEPTED_TYPES[detected.mime as keyof typeof ACCEPTED_TYPES];
  if (!detectedExtensions.has(extension as never)) throw new Error("图片扩展名与文件内容不一致。");

  const decoder = sharp(input, { failOn: "error", limitInputPixels: 40_000_000 }).rotate();
  const metadata = await decoder.metadata();
  if (!metadata.width || !metadata.height) throw new Error("图片尺寸无效。");

  const now = new Date();
  const directorySegment = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const outputDirectory = path.join(UPLOAD_ROOT, directorySegment);
  await mkdir(outputDirectory, { recursive: true });

  const baseName = randomUUID();
  const widths = [320, 640, 1200, 2000].filter((width) => width <= metadata.width!);
  if (!widths.length || widths.at(-1) !== Math.min(metadata.width, 2000)) {
    widths.push(Math.min(metadata.width, 2000));
  }
  const uniqueWidths = [...new Set(widths)].sort((a, b) => a - b);
  const variants: Record<string, string> = {};

  for (const width of uniqueWidths) {
    const filename = `${baseName}-${width}.webp`;
    const outputPath = path.join(outputDirectory, filename);
    const encoded = await sharp(input, { failOn: "error", limitInputPixels: 40_000_000 })
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: width <= 320 ? 78 : 84, effort: 5 })
      .toBuffer();
    await writeFile(outputPath, encoded, { flag: "wx" });
    variants[String(width)] = `/uploads/${directorySegment}/${filename}`;
  }

  const largestWidth = uniqueWidths.at(-1)!;
  const url = variants[String(largestWidth)];
  const storedName = path.basename(url);
  return db.media.create({
    data: {
      originalName: path.basename(file.name).slice(0, 255),
      storedName,
      mimeType: "image/webp",
      size: (await readFile(safeUploadPath(url))).byteLength,
      width: Math.min(metadata.width, largestWidth),
      height: Math.round(metadata.height * (Math.min(metadata.width, largestWidth) / metadata.width)),
      alt: alt.trim(),
      url,
      variantsJson: JSON.stringify(variants),
    },
  });
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
        const code = error && typeof error === "object" && "code" in error ? error.code : "";
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
