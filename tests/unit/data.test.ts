import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  postFindMany: vi.fn(),
  postCount: vi.fn(),
  projectFindMany: vi.fn(),
  projectCount: vi.fn(),
  settingFindMany: vi.fn(),
  timelineFindMany: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    $transaction: dbMocks.transaction,
    post: {
      findMany: dbMocks.postFindMany,
      count: dbMocks.postCount,
    },
    project: {
      findMany: dbMocks.projectFindMany,
      count: dbMocks.projectCount,
    },
    siteSetting: {
      findMany: dbMocks.settingFindMany,
    },
    timelineEvent: {
      findMany: dbMocks.timelineFindMany,
    },
  },
}));

import {
  getArchive,
  getFeaturedPosts,
  getPublishedPosts,
  getPublishedProjects,
  getSiteSettings,
  getTimelineEvents,
  searchContent,
} from "@/lib/data";

describe("public data helpers", () => {
  beforeEach(() => {
    for (const mock of Object.values(dbMocks)) mock.mockReset();
  });

  it("normalizes invalid pagination and builds a published-post query", async () => {
    dbMocks.postFindMany.mockReturnValue("posts-query");
    dbMocks.postCount.mockReturnValue("count-query");
    dbMocks.transaction.mockResolvedValue([[{ id: "post-1" }], 61]);

    const result = await getPublishedPosts({
      category: "backend-engineering",
      tag: "mysql",
      query: `  ${"x".repeat(120)}  `,
      page: Number.NaN,
      pageSize: 1000,
    });

    expect(result).toEqual({
      items: [{ id: "post-1" }],
      total: 61,
      page: 1,
      pageSize: 50,
      totalPages: 2,
    });
    expect(dbMocks.postFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
        skip: 0,
        take: 50,
        where: expect.objectContaining({
          status: "PUBLISHED",
          category: { slug: "backend-engineering" },
          tags: { some: { tag: { slug: "mysql" } } },
          OR: [
            { title: { contains: "x".repeat(100) } },
            { excerpt: { contains: "x".repeat(100) } },
            { content: { contains: "x".repeat(100) } },
          ],
        }),
      }),
    );
  });

  it("clamps a negative project page and a zero page size", async () => {
    dbMocks.projectFindMany.mockReturnValue("projects-query");
    dbMocks.projectCount.mockReturnValue("count-query");
    dbMocks.transaction.mockResolvedValue([[], 0]);

    const result = await getPublishedProjects({
      page: -10,
      pageSize: 0,
      tag: "nextjs",
    });

    expect(result).toEqual({
      items: [],
      total: 0,
      page: 1,
      pageSize: 1,
      totalPages: 1,
    });
    expect(dbMocks.projectFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 1,
        where: expect.objectContaining({
          status: "PUBLISHED",
          tags: { some: { tag: { slug: "nextjs" } } },
        }),
      }),
    );
  });

  it("does not query the database for a one-character search", async () => {
    await expect(searchContent(" 数 ")).resolves.toEqual({
      query: "数",
      posts: [],
      projects: [],
      total: 0,
    });
    expect(dbMocks.postFindMany).not.toHaveBeenCalled();
    expect(dbMocks.projectFindMany).not.toHaveBeenCalled();
  });

  it("trims search text, caps result size and combines post/project totals", async () => {
    dbMocks.postFindMany.mockResolvedValue([{ id: "post-1" }]);
    dbMocks.projectFindMany.mockResolvedValue([
      { id: "project-1" },
      { id: "project-2" },
    ]);

    const query = ` ${"database".repeat(20)} `;
    const result = await searchContent(query, 500);

    expect(result.query).toHaveLength(100);
    expect(result.total).toBe(3);
    expect(dbMocks.postFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 50,
        where: expect.objectContaining({
          status: "PUBLISHED",
          OR: expect.arrayContaining([
            { title: { contains: result.query } },
            { content: { contains: result.query } },
          ]),
        }),
      }),
    );
    expect(dbMocks.projectFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 50 }),
    );
  });

  it("clamps featured post limits to the public maximum", async () => {
    dbMocks.postFindMany.mockResolvedValue([]);

    await getFeaturedPosts(99);

    expect(dbMocks.postFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 12,
        where: expect.objectContaining({
          status: "PUBLISHED",
          featured: true,
        }),
      }),
    );
  });

  it("groups archive posts by descending year", async () => {
    dbMocks.postFindMany.mockResolvedValue([
      {
        id: "new",
        publishedAt: new Date("2026-03-01T00:00:00.000Z"),
        createdAt: new Date("2026-02-01T00:00:00.000Z"),
      },
      {
        id: "old",
        publishedAt: new Date("2024-08-01T00:00:00.000Z"),
        createdAt: new Date("2024-07-01T00:00:00.000Z"),
      },
      {
        id: "draft-date-fallback",
        publishedAt: null,
        createdAt: new Date("2025-01-01T00:00:00.000Z"),
      },
    ]);

    const archive = await getArchive();

    expect(archive.map((group) => group.year)).toEqual([2026, 2025, 2024]);
    expect(archive[1].posts[0]).toEqual(
      expect.objectContaining({ id: "draft-date-fallback" }),
    );
  });

  it("maps persisted settings and preserves compatibility keys", async () => {
    dbMocks.settingFindMany.mockResolvedValue([
      { key: "site.title", value: "旧键标题" },
      { key: "siteDescription", value: "新键描述" },
      { key: "profile.name", value: "R7" },
    ]);

    const settings = await getSiteSettings();

    expect(settings.siteTitle).toBe("旧键标题");
    expect(settings.siteDescription).toBe("新键描述");
    expect(settings.authorName).toBe("R7");
    expect(settings.siteUrl).toBe(
      process.env.APP_URL ?? "http://localhost:3000",
    );
  });

  it("requests only visible timeline events in a stable order", async () => {
    dbMocks.timelineFindMany.mockResolvedValue([]);

    await getTimelineEvents();

    expect(dbMocks.timelineFindMany).toHaveBeenCalledWith({
      where: { visible: true },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    });
  });
});
