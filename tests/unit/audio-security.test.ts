import { beforeEach, describe, expect, it, vi } from "vitest";

const fsMocks = vi.hoisted(() => ({
  mkdir: vi.fn(),
  readdir: vi.fn(),
  stat: vi.fn(),
  unlink: vi.fn(),
  writeFile: vi.fn(),
}));
const fileTypeMocks = vi.hoisted(() => ({
  fromBuffer: vi.fn(),
  fromFile: vi.fn(),
}));

vi.mock("node:fs/promises", () => {
  const mocked = {
    mkdir: fsMocks.mkdir,
    readdir: fsMocks.readdir,
    stat: fsMocks.stat,
    unlink: fsMocks.unlink,
    writeFile: fsMocks.writeFile,
  };
  return { ...mocked, default: mocked };
});

vi.mock("file-type", () => ({
  fileTypeFromBuffer: fileTypeMocks.fromBuffer,
  fileTypeFromFile: fileTypeMocks.fromFile,
}));

import {
  storeAudioUpload,
  validateRemoteAudioUrl,
  verifyStoredAudio,
} from "@/lib/audio-uploads";
import { env } from "@/lib/env";

function audioFile(
  bytes: Uint8Array,
  name = "recording.mp3",
  type = "audio/mpeg",
) {
  const payload = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(payload).set(bytes);
  const file = new File([payload], name, { type });
  Object.defineProperty(file, "arrayBuffer", {
    configurable: true,
    value: vi.fn().mockResolvedValue(payload),
  });
  return file;
}

describe("audio upload validation", () => {
  beforeEach(() => {
    for (const mock of Object.values(fsMocks)) mock.mockReset();
    for (const mock of Object.values(fileTypeMocks)) mock.mockReset();
    fsMocks.mkdir.mockResolvedValue(undefined);
    fsMocks.writeFile.mockResolvedValue(undefined);
  });

  it("rejects empty and oversized files before reading their bytes", async () => {
    await expect(
      storeAudioUpload(audioFile(new Uint8Array(), "empty.mp3")),
    ).rejects.toThrow("选择音频");

    const oversized = audioFile(
      new Uint8Array([0x49, 0x44, 0x33, 0x04]),
      "oversized.mp3",
    );
    Object.defineProperty(oversized, "size", {
      configurable: true,
      value: env.AUDIO_UPLOAD_MAX_BYTES + 1,
    });
    await expect(storeAudioUpload(oversized)).rejects.toThrow("不能超过");
    expect(oversized.arrayBuffer).not.toHaveBeenCalled();
    expect(fileTypeMocks.fromBuffer).not.toHaveBeenCalled();
  });

  it("blocks executable and unrecognized signatures even when MIME and extension look valid", async () => {
    const executable = audioFile(
      new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00]),
    );
    await expect(storeAudioUpload(executable)).rejects.toThrow(
      "可执行文件签名",
    );
    expect(fileTypeMocks.fromBuffer).not.toHaveBeenCalled();

    fileTypeMocks.fromBuffer.mockResolvedValue(undefined);
    const spoofed = audioFile(
      new TextEncoder().encode("this is not an mp3 stream"),
    );
    await expect(storeAudioUpload(spoofed)).rejects.toThrow(
      "仅支持 MP3",
    );
    expect(fsMocks.writeFile).not.toHaveBeenCalled();
  });

  it("requires detected signature, declared MIME and extension to agree", async () => {
    fileTypeMocks.fromBuffer.mockResolvedValue({
      ext: "mp3",
      mime: "audio/mpeg",
    });

    await expect(
      storeAudioUpload(
        audioFile(
          new Uint8Array([0x49, 0x44, 0x33, 0x04, 0x00, 0x00]),
          "renamed.m4a",
          "audio/mp4",
        ),
      ),
    ).rejects.toThrow("扩展名");

    await expect(
      storeAudioUpload(
        audioFile(
          new Uint8Array([0x49, 0x44, 0x33, 0x04, 0x00, 0x00]),
          "renamed.mp3",
          "audio/ogg",
        ),
      ),
    ).rejects.toThrow("MIME");
  });
});

describe("stored audio re-verification", () => {
  const storedName = "4d6f8365-77d8-4b6d-911d-0e83d0e7c2b1.mp3";
  const audioUrl = `/uploads/audio/2026/07/${storedName}`;

  beforeEach(() => {
    for (const mock of Object.values(fsMocks)) mock.mockReset();
    for (const mock of Object.values(fileTypeMocks)) mock.mockReset();
  });

  it("rejects invalid storage names and paths before touching the filesystem", async () => {
    await expect(
      verifyStoredAudio({
        audioUrl: "/uploads/audio/2026/07/../../outside.mp3",
        storedName: "../../outside.mp3",
        mimeType: "audio/mpeg",
        size: 128,
      }),
    ).rejects.toThrow("存储名称无效");
    expect(fsMocks.stat).not.toHaveBeenCalled();
  });

  it("rejects missing files and persisted size mismatches", async () => {
    fsMocks.stat.mockRejectedValueOnce(new Error("ENOENT"));
    await expect(
      verifyStoredAudio({
        audioUrl,
        storedName,
        mimeType: "audio/mpeg",
        size: 128,
      }),
    ).rejects.toThrow("文件不存在");

    fsMocks.stat.mockResolvedValueOnce({
      isFile: () => true,
      size: 129,
    });
    await expect(
      verifyStoredAudio({
        audioUrl,
        storedName,
        mimeType: "audio/mpeg",
        size: 128,
      }),
    ).rejects.toThrow("大小");
    expect(fileTypeMocks.fromFile).not.toHaveBeenCalled();
  });

  it("rejects a stored signature that no longer matches database metadata", async () => {
    fsMocks.stat.mockResolvedValue({
      isFile: () => true,
      size: 128,
    });
    fileTypeMocks.fromFile.mockResolvedValue({
      ext: "ogg",
      mime: "audio/ogg",
    });

    await expect(
      verifyStoredAudio({
        audioUrl,
        storedName,
        mimeType: "audio/mpeg",
        size: 128,
      }),
    ).rejects.toThrow("签名");
  });

  it("accepts only HTTPS remote audio URLs", () => {
    expect(validateRemoteAudioUrl("https://media.example.com/r7.mp3")).toBe(
      "https://media.example.com/r7.mp3",
    );
    expect(() => validateRemoteAudioUrl("javascript:alert(1)")).toThrow();
    expect(() => validateRemoteAudioUrl("http://media.example.com/r7.mp3")).toThrow();
  });
});
