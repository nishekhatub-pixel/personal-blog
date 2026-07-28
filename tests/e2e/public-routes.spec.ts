import { expect, test } from "@playwright/test";
import { expectHealthyPage } from "./helpers";

const publicRoutes: Array<{ path: string; heading: string | RegExp }> = [
  { path: "/", heading: "R7 Digital Garden" },
  { path: "/blog", heading: "文章" },
  {
    path: "/blog/array-to-linked-list-tradeoffs",
    heading: "从数组到链表：真正理解数据结构的取舍",
  },
  { path: "/archive", heading: "归档" },
  { path: "/categories", heading: "分类" },
  { path: "/tags", heading: "标签" },
  { path: "/projects", heading: "把学习做成作品" },
  { path: "/projects/r7-digital-garden", heading: "R7 数字花园" },
  { path: "/photos", heading: "照片墙" },
  { path: "/music", heading: "云端乐律" },
  { path: "/moments", heading: "说说" },
  { path: "/guestbook", heading: "留下你的足迹" },
  { path: "/friends", heading: "友链" },
  { path: "/calendar", heading: /\d{4}年\d{1,2}月\d{1,2}日/ },
  { path: "/about", heading: /一边学习.*一边把东西做出来/ },
  { path: "/now", heading: "此刻" },
  { path: "/contact", heading: /从一个具体问题.*开始交流/ },
  { path: "/search", heading: "搜索" },
];

test.describe("public routes", () => {
  for (const route of publicRoutes) {
    test(`${route.path} renders its primary content`, async ({ page }) => {
      await expectHealthyPage(page, route.path, route.heading);
      await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
      await expect(page.locator('a[href="#main-content"]')).toContainText(
        "跳到主要内容",
      );
      expect(
        await page.locator('a[href="#"]').count(),
        `${route.path} must not contain placeholder links`,
      ).toBe(0);
    });
  }

  test("unknown content returns the branded 404 state", async ({ page }) => {
    const response = await page.goto("/blog/not-a-real-r7-post");

    expect(response?.status()).toBe(404);
    await expect(page.getByText(/没有找到|不存在/).first()).toBeVisible();
  });
});

test.describe("SEO and syndication endpoints", () => {
  test("robots.txt advertises the sitemap", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toMatch(/User-Agent:/i);
    expect(body).toMatch(/Sitemap:/i);
  });

  test("sitemap.xml includes public articles and projects", async ({
    request,
  }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("xml");
    const body = await response.text();
    expect(body).toContain("/blog/array-to-linked-list-tradeoffs");
    expect(body).toContain("/projects/r7-digital-garden");
    for (const route of [
      "/photos",
      "/music",
      "/moments",
      "/guestbook",
      "/friends",
      "/about",
    ]) {
      expect(body).toContain(route);
    }
  });

  test("RSS exposes published Chinese articles", async ({ request }) => {
    const response = await request.get("/rss.xml");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toMatch(/xml|rss/);
    const body = await response.text();
    expect(body).toContain("从数组到链表");
    expect(body).not.toContain("<script");
  });

  test("article pages expose canonical and structured metadata", async ({
    page,
  }) => {
    await page.goto("/blog/mysql-index-query-optimization");

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /\/blog\/mysql-index-query-optimization$/,
    );
    const jsonLd = await page
      .locator('script[type="application/ld+json"]')
      .textContent();
    expect(JSON.parse(jsonLd ?? "{}")).toMatchObject({
      "@type": "BlogPosting",
      inLanguage: "zh-CN",
    });
  });
});
