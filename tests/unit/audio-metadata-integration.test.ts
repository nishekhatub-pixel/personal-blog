// @vitest-environment node

import { describe, expect, it } from "vitest";
import {
  deleteStoredAudio,
  storeAudioUpload,
  verifyStoredAudio,
} from "@/lib/audio-uploads";

function syncSafeInteger(value: number) {
  return Buffer.from([
    (value >> 21) & 0x7f,
    (value >> 14) & 0x7f,
    (value >> 7) & 0x7f,
    value & 0x7f,
  ]);
}

function textFrame(id: string, value: string) {
  const payload = Buffer.concat([
    Buffer.from([0x03]),
    Buffer.from(value, "utf8"),
  ]);
  const header = Buffer.alloc(10);
  header.write(id, 0, 4, "ascii");
  header.writeUInt32BE(payload.length, 4);
  return Buffer.concat([header, payload]);
}

function lyricsFrame(value: string) {
  const payload = Buffer.concat([
    Buffer.from([0x03]),
    Buffer.from("eng", "ascii"),
    Buffer.from([0x00]),
    Buffer.from(value, "utf8"),
  ]);
  const header = Buffer.alloc(10);
  header.write("USLT", 0, 4, "ascii");
  header.writeUInt32BE(payload.length, 4);
  return Buffer.concat([header, payload]);
}

function taggedMp3Buffer() {
  const frames = Buffer.concat([
    textFrame("TIT2", "R7 上传测试"),
    textFrame("TPE1", "R7"),
    textFrame("TALB", "本地音乐"),
    lyricsFrame("第一行歌词\n第二行歌词"),
  ]);
  const tagHeader = Buffer.concat([
    Buffer.from("ID3", "ascii"),
    Buffer.from([0x03, 0x00, 0x00]),
    syncSafeInteger(frames.length),
  ]);

  const audioFrames = Array.from({ length: 8 }, () => {
    const frame = Buffer.alloc(417);
    frame.set([0xff, 0xfb, 0x90, 0x64], 0);
    return frame;
  });
  return Buffer.concat([tagHeader, frames, ...audioFrames]);
}

describe("local audio metadata integration", () => {
  it("accepts a real MP3 signature and reads embedded title, artist, album and lyrics", async () => {
    const bytes = taggedMp3Buffer();
    const payload = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(payload).set(bytes);
    const file = new File([payload], "r7-local-upload.mp3", {
      type: "audio/mpeg",
    });
    Object.defineProperty(file, "arrayBuffer", {
      configurable: true,
      value: async () => payload,
    });

    const stored = await storeAudioUpload(file);
    try {
      expect(stored.title).toBe("R7 上传测试");
      expect(stored.artist).toBe("R7");
      expect(stored.album).toBe("本地音乐");
      expect(stored.lyrics).toContain("第一行歌词");
      expect(stored.audioUrl).toMatch(/^\/uploads\/audio\/\d{4}\/\d{2}\//);
      await expect(verifyStoredAudio(stored)).resolves.toBeUndefined();
    } finally {
      await deleteStoredAudio(stored.audioUrl);
    }
  });
});
