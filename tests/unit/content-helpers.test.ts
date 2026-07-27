import { describe, expect, it } from "vitest";
import {
  formatDate,
  parseStringArray,
  unwrapTags,
} from "@/components/content/content-types";

describe("content display helpers", () => {
  it("unwraps direct and join-table tags into one taxonomy list", () => {
    expect(
      unwrapTags([
        { name: "TypeScript", slug: "typescript" },
        { tag: { name: "测试", slug: "testing" } },
      ]),
    ).toEqual([
      { name: "TypeScript", slug: "typescript" },
      { name: "测试", slug: "testing" },
    ]);
    expect(unwrapTags(undefined)).toEqual([]);
  });

  it("parses only string entries from stored JSON arrays", () => {
    expect(parseStringArray('["Next.js", 7, "Prisma", null]')).toEqual([
      "Next.js",
      "Prisma",
    ]);
    expect(parseStringArray('{"not":"an array"}')).toEqual([]);
    expect(parseStringArray("malformed-json")).toEqual([]);
    expect(parseStringArray(null)).toEqual([]);
  });

  it("formats dates for Chinese readers and handles unpublished content", () => {
    const full = formatDate("2026-07-27T12:00:00.000Z");
    const short = formatDate("2026-07-27T12:00:00.000Z", false);

    expect(full).toMatch(/2026/);
    expect(full).toMatch(/07/);
    expect(short).not.toMatch(/2026/);
    expect(formatDate(null)).toBe("尚未发布");
  });
});
