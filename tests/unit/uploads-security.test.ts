import { beforeEach, describe, expect, it, vi } from "vitest";

const mediaMocks = vi.hoisted(() => ({
  create: vi.fn(),
  findUnique: vi.fn(),
  delete: vi.fn(),
}));
const fileTypeMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  db: {
    media: {
      create: mediaMocks.create,
      findUnique: mediaMocks.findUnique,
      delete: mediaMocks.delete,
    },
  },
}));
vi.mock("file-type", () => ({
  fileTypeFromBuffer: fileTypeMock,
}));

import {
  processMediaUpload,
} from "@/lib/uploads";
import { env } from "@/lib/env";
import {
  deleteMediaAndFiles,
  publicUploadUrl,
  safeUploadPath,
  STORAGE_KINDS,
  UPLOAD_ROOT,
} from "@/lib/media-storage";
import path from "node:path";

describe("media upload validation", () => {
  beforeEach(() => {
    for (const mock of Object.values(mediaMocks)) mock.mockReset();
    fileTypeMock.mockReset();
    fileTypeMock.mockResolvedValue(undefined);
  });

  it("rejects an empty file", async () => {
    const file = new File([], "empty.png", { type: "image/png" });

    await expect(processMediaUpload(file, "空图片")).rejects.toThrow(
      "选择图片",
    );
    expect(mediaMocks.create).not.toHaveBeenCalled();
  });

  it("rejects a file larger than the configured cap before reading it", async () => {
    const oversized = {
      name: "large.png",
      type: "image/png",
      size: env.UPLOAD_MAX_BYTES + 1,
      arrayBuffer: vi.fn(),
    } as unknown as File;

    await expect(processMediaUpload(oversized, "大尺寸图片")).rejects.toThrow(
      "100 MB",
    );
    expect(oversized.arrayBuffer).not.toHaveBeenCalled();
  });

  it("requires useful alternative text", async () => {
    const file = new File(["not-empty"], "image.png", {
      type: "image/png",
    });

    await expect(processMediaUpload(file, "")).rejects.toThrow("替代文本");
    await expect(
      processMediaUpload(file, "x".repeat(256)),
    ).rejects.toThrow("替代文本");
  });

  it("rejects unsupported declarations and extension mismatches", async () => {
    const text = new File(["payload"], "payload.txt", {
      type: "text/plain",
    });
    const mismatch = new File(["payload"], "photo.jpg", {
      type: "image/png",
    });

    await expect(processMediaUpload(text, "文本载荷")).rejects.toThrow(
      "仅支持",
    );
    await expect(processMediaUpload(mismatch, "扩展名伪装")).rejects.toThrow(
      "扩展名",
    );
  });

  it("sniffs file bytes instead of trusting MIME and extension", async () => {
    const bytes = new TextEncoder().encode("this is not a jpeg");
    const spoofed = {
      name: "photo.jpg",
      type: "image/jpeg",
      size: bytes.byteLength,
      arrayBuffer: vi.fn().mockResolvedValue(bytes.buffer),
    } as unknown as File;

    await expect(processMediaUpload(spoofed, "伪造图片")).rejects.toThrow(
      "真实格式",
    );
    expect(fileTypeMock).toHaveBeenCalledOnce();
    expect(mediaMocks.create).not.toHaveBeenCalled();
  });

  it("never unlinks stored media paths that escape the upload root", async () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    mediaMocks.findUnique.mockResolvedValue({
      id: "malicious-media",
      url: "/uploads/../../outside.txt",
      variantsJson: "{}",
      _count: {
        albumCovers: 0,
        photos: 0,
        momentMedia: 0,
        musicCovers: 0,
        playlistCovers: 0,
      },
    });

    await expect(deleteMediaAndFiles("malicious-media")).resolves.toMatchObject({
      id: "malicious-media",
    });
    expect(mediaMocks.delete).toHaveBeenCalledWith({
      where: { id: "malicious-media" },
    });
    expect(warning).toHaveBeenCalledWith(
      expect.stringContaining('"event":"media.cleanup.partial"'),
    );
    warning.mockRestore();
  });

  it("resolves portable storage URLs inside the configured upload root", () => {
    expect(STORAGE_KINDS).toEqual([
      "images",
      "photos",
      "music",
      "avatars",
      "temp",
    ]);
    const url = publicUploadUrl(
      "photos",
      "2026",
      "07",
      "4d6f8365-77d8-4b6d-911d-0e83d0e7c2b1-1200.webp",
    );
    expect(url).toBe(
      "/uploads/photos/2026/07/4d6f8365-77d8-4b6d-911d-0e83d0e7c2b1-1200.webp",
    );
    const target = safeUploadPath(url);
    expect(path.relative(UPLOAD_ROOT, target)).toBe(
      path.join(
        "photos",
        "2026",
        "07",
        "4d6f8365-77d8-4b6d-911d-0e83d0e7c2b1-1200.webp",
      ),
    );
    expect(() => safeUploadPath("/uploads/photos/../../outside.txt")).toThrow(
      "媒体路径",
    );
    expect(() =>
      safeUploadPath("/uploads/photos/%2e%2e/outside.txt"),
    ).toThrow("媒体路径");
  });
});
