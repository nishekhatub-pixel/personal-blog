import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileTypeFromBuffer } from "file-type";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { safeUploadPath, UPLOAD_ROOT } from "@/lib/media-storage";

const ACCEPTED_TYPES = {
  "image/jpeg": new Set(["jpg", "jpeg"]),
  "image/png": new Set(["png"]),
  "image/webp": new Set(["webp"]),
  "image/avif": new Set(["avif"]),
  "image/gif": new Set(["gif"]),
  "image/tiff": new Set(["tif", "tiff"]),
  "image/heic": new Set(["heic"]),
  "image/heif": new Set(["heif"]),
} as const;

const MAX_INPUT_PIXELS = 100_000_000;

function extensionOf(filename: string) {
  return path.extname(filename).slice(1).toLocaleLowerCase("en-US");
}

let sharpPromise: Promise<typeof import("sharp")["default"]> | undefined;

function loadSharp() {
  sharpPromise ??= import("sharp").then((module) => module.default);
  return sharpPromise;
}

export async function processMediaUpload(file: File, alt: string) {
  if (!file || file.size === 0) throw new Error("请选择图片文件。");
  if (file.size > env.UPLOAD_MAX_BYTES) {
    throw new Error(
      `图片不能超过 ${Math.floor(env.UPLOAD_MAX_BYTES / 1024 / 1024)} MB。`,
    );
  }
  if (alt.trim().length < 2 || alt.trim().length > 255) throw new Error("请填写 2 至 255 字的替代文本。");

  const declaredType = file.type.toLocaleLowerCase("en-US");
  const extension = extensionOf(file.name);
  const declaredExtensions =
    ACCEPTED_TYPES[declaredType as keyof typeof ACCEPTED_TYPES];
  const genericDeclaredType =
    declaredType === "" || declaredType === "application/octet-stream";
  if (!declaredExtensions && !genericDeclaredType) {
    throw new Error(
      "仅支持 JPEG、PNG、WebP、AVIF、GIF、TIFF、HEIC 和 HEIF 图片。",
    );
  }
  if (declaredExtensions && !declaredExtensions.has(extension as never)) {
    throw new Error("文件扩展名与声明的图片类型不一致。");
  }

  const input = Buffer.from(await file.arrayBuffer());
  const detected = await fileTypeFromBuffer(input);
  if (!detected || !(detected.mime in ACCEPTED_TYPES)) throw new Error("无法识别图片的真实格式。");
  if (!genericDeclaredType && detected.mime !== declaredType) {
    throw new Error("图片 MIME 与文件内容不一致。");
  }
  const detectedExtensions = ACCEPTED_TYPES[detected.mime as keyof typeof ACCEPTED_TYPES];
  if (!detectedExtensions.has(extension as never)) throw new Error("图片扩展名与文件内容不一致。");

  const sharp = await loadSharp();
  let metadata;
  try {
    const decoder = sharp(input, {
      failOn: "error",
      limitInputPixels: MAX_INPUT_PIXELS,
    }).rotate();
    metadata = await decoder.metadata();
  } catch {
    throw new Error(
      "图片解码失败、像素尺寸超过 1 亿，或当前运行环境不支持该格式。",
    );
  }
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
    const encoded = await sharp(input, {
      failOn: "error",
      limitInputPixels: MAX_INPUT_PIXELS,
    })
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
