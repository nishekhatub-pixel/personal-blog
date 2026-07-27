import { describe, expect, it } from "vitest";
import {
  categorySchema,
  checkbox,
  commentSchema,
  emailSchema,
  optionalUrlSchema,
  postSchema,
  projectSchema,
  siteSettingsSchema,
  slugSchema,
  stringList,
  stringValue,
} from "@/lib/validation";

const validPost = {
  title: "一次完整的工程复盘",
  slug: "complete-engineering-review",
  excerpt: "这是一段满足最小长度要求的中文文章摘要，用来说明文章要解决的真实问题。",
  content:
    "## 背景\n\n这是一段足够长的正文内容，用来验证文章输入可以通过完整校验，并保留真实的工程语义与上下文。",
  coverImage: "",
  coverAlt: "",
  status: "PUBLISHED" as const,
  featured: true,
  readingMinutes: 8,
  seoTitle: "",
  seoDescription: "",
  categoryId: "category-id",
  tagIds: ["tag-one", "tag-two"],
};

describe("validation schemas", () => {
  it("normalizes email addresses before persistence", () => {
    expect(emailSchema.parse("  Student@Example.COM ")).toBe(
      "student@example.com",
    );
  });

  it.each([
    "article",
    "article-2026",
    "r7-digital-garden",
  ])("accepts a canonical slug: %s", (slug) => {
    expect(slugSchema.parse(slug)).toBe(slug);
  });

  it.each([
    "Uppercase",
    "contains space",
    "../escape",
    "two--hyphens",
    "-leading",
    "trailing-",
  ])("rejects an unsafe slug: %s", (slug) => {
    expect(slugSchema.safeParse(slug).success).toBe(false);
  });

  it("coerces blank optional post fields to null", () => {
    const result = postSchema.parse(validPost);

    expect(result.coverImage).toBeNull();
    expect(result.coverAlt).toBeNull();
    expect(result.seoTitle).toBeNull();
    expect(result.seoDescription).toBeNull();
  });

  it("enforces content, reading-time and tag limits on posts", () => {
    expect(
      postSchema.safeParse({
        ...validPost,
        excerpt: "太短",
        content: "也太短",
        readingMinutes: 0,
        tagIds: Array.from({ length: 21 }, (_, index) => `tag-${index}`),
      }).success,
    ).toBe(false);
  });

  it("accepts only HTTPS external project links", () => {
    const valid = projectSchema.safeParse({
      title: "完整项目",
      slug: "complete-project",
      summary: "这是一个满足长度要求的项目摘要，说明目标、用户和最终交付结果。",
      body:
        "## 背景\n\n这是足够长的项目正文，包含目标、实现过程、技术取舍、测试结果与后续复盘，也记录上线后的观察、限制和下一步计划。",
      coverImage: "",
      coverAlt: "",
      gallery: ["/images/project.png"],
      technologies: ["TypeScript", "Next.js"],
      demoUrl: "https://example.com/demo",
      sourceUrl: "https://github.com/example/project",
      status: "PUBLISHED",
      featured: false,
      seoTitle: "",
      seoDescription: "",
      tagIds: [],
    });
    const unsafe = optionalUrlSchema.safeParse("javascript:alert(1)");

    expect(valid.success).toBe(true);
    expect(unsafe.success).toBe(false);
  });

  it("rejects comment honeypot content and normalizes its email", () => {
    const base = {
      postId: "post-id",
      parentId: "",
      authorName: "认真读者",
      email: " Reader@Example.com ",
      content: "这是一条认真评论。",
      website: "",
    };
    const result = commentSchema.parse(base);

    expect(result.email).toBe("reader@example.com");
    expect(result.parentId).toBeNull();
    expect(commentSchema.safeParse({ ...base, website: "spam" }).success).toBe(
      false,
    );
  });

  it("requires a safe site URL and a bounded description", () => {
    const base = {
      siteTitle: "R7 数字花园",
      siteDescription:
        "记录软件技术学习、项目实践与阶段复盘的中文个人数字花园。",
      siteUrl: "https://r7.example.com",
      authorName: "R7",
      authorBio: "软件技术学生。",
      contactEmail: "HELLO@EXAMPLE.COM",
      githubUrl: "https://github.com/example",
      nowText: "正在学习数据库与测试。",
      footerNote: "持续构建。",
      commentsEnabled: true,
      newsletterEnabled: true,
      siteName: "R7 Digital Garden",
      siteSubtitle: "一个软件技术专业学生的个人数字花园",
      profileName: "R7",
      profileBio: "记录学习、构建与生活。",
      profileAvatar: "",
      siteLaunchDate: "2026-01-01",
      noticeText: "数字花园持续更新中。",
      locationName: "广州",
      latitude: "23.1291",
      longitude: "113.2644",
      timezone: "Asia/Shanghai",
      weatherEnabled: true,
      petalsEnabled: true,
      petalsDensity: "medium" as const,
      email: "",
      musicEnabled: true,
      guestbookEnabled: true,
      friendsEnabled: true,
    };

    expect(siteSettingsSchema.parse(base).contactEmail).toBe(
      "hello@example.com",
    );
    expect(
      siteSettingsSchema.safeParse({
        ...base,
        siteUrl: "javascript:alert(1)",
      }).success,
    ).toBe(false);
  });

  it("validates category descriptions and identifiers", () => {
    expect(
      categorySchema.parse({
        name: "后端工程",
        slug: "backend-engineering",
        description: "",
      }).description,
    ).toBeNull();
    expect(
      categorySchema.safeParse({
        name: "",
        slug: "backend-engineering",
        description: "",
      }).success,
    ).toBe(false);
  });
});

describe("FormData helpers", () => {
  it("reads supported checkbox representations", () => {
    for (const value of ["on", "true", "1"]) {
      const formData = new FormData();
      formData.set("featured", value);
      expect(checkbox(formData, "featured")).toBe(true);
    }

    const missing = new FormData();
    expect(checkbox(missing, "featured")).toBe(false);
  });

  it("returns only string values", () => {
    const formData = new FormData();
    formData.set("title", "  保留原始空格  ");
    formData.set("upload", new File(["x"], "x.txt"));

    expect(stringValue(formData, "title")).toBe("  保留原始空格  ");
    expect(stringValue(formData, "upload")).toBe("");
    expect(stringValue(formData, "missing")).toBe("");
  });

  it("splits, trims and removes blank list values", () => {
    const formData = new FormData();
    formData.append("tagIds", "tag-a, tag-b");
    formData.append("tagIds", " tag-c ,,");

    expect(stringList(formData, "tagIds")).toEqual([
      "tag-a",
      "tag-b",
      "tag-c",
    ]);
  });
});
