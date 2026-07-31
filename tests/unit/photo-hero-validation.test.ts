import { describe, expect, it } from "vitest";
import {
  heroSlideInputSchema,
  photoInputSchema,
} from "@/lib/garden-validation";

const basePhoto = {
  albumId: "",
  alt: "雨后校园路面映着暖色灯光",
  caption: "晚课结束后经过教学楼。",
  location: "广州",
  mediaId: "media-01",
  position: "0",
  publishedAt: "",
  status: "DRAFT",
  takenAt: "",
};

describe("photo and hero validation", () => {
  it("allows a photo to remain outside every album", () => {
    expect(photoInputSchema.parse(basePhoto).albumId).toBeNull();
  });

  it("keeps an existing album id when one is selected", () => {
    expect(
      photoInputSchema.parse({ ...basePhoto, albumId: "album-01" }).albumId,
    ).toBe("album-01");
  });

  it("validates media-backed hero slide metadata", () => {
    expect(
      heroSlideInputSchema.parse({
        alt: "午后书桌与窗边绿植",
        mediaId: "media-hero",
        position: "2",
        visible: "true",
      }),
    ).toMatchObject({
      mediaId: "media-hero",
      position: 2,
      visible: true,
    });
  });
});
