import { describe, expect, it } from "vitest";
import {
  DEFAULT_AUDIO_VOLUME,
  parseStoredAudioVolume,
} from "@/components/site/music/audio-player-provider";

describe("audio player volume persistence", () => {
  it("keeps the audible default when no preference exists", () => {
    expect(parseStoredAudioVolume(null)).toBeNull();
    expect(parseStoredAudioVolume("")).toBeNull();
    expect(DEFAULT_AUDIO_VOLUME).toBeGreaterThan(0);
  });

  it("restores valid user volume and clamps invalid ranges", () => {
    expect(parseStoredAudioVolume("0")).toBe(0);
    expect(parseStoredAudioVolume("0.45")).toBe(0.45);
    expect(parseStoredAudioVolume("2")).toBe(1);
    expect(parseStoredAudioVolume("-1")).toBe(0);
    expect(parseStoredAudioVolume("not-a-number")).toBeNull();
  });
});
