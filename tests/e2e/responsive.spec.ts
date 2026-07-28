import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

const publicPaths = [
  "/",
  "/blog",
  "/blog/array-to-linked-list-tradeoffs",
  "/archive",
  "/categories",
  "/tags",
  "/projects",
  "/projects/r7-digital-garden",
  "/photos",
  "/music",
  "/moments",
  "/guestbook",
  "/friends",
  "/about",
  "/now",
  "/contact",
  "/search?q=MySQL",
];

async function expectNoHorizontalOverflow(page: import("@playwright/test").Page) {
  await page.waitForLoadState("networkidle");
  const dimensions = await page.evaluate(() => ({
    body: document.body.scrollWidth,
    document: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth,
    window: window.innerWidth,
  }));

  expect(
    Math.max(dimensions.body, dimensions.document),
    JSON.stringify(dimensions),
  ).toBeLessThanOrEqual(Math.max(dimensions.viewport, dimensions.window) + 1);
}

test.describe("375 × 812 responsive layout", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "mobile",
      "The exact mobile viewport only needs one browser project.",
    );
    await page.setViewportSize({ width: 375, height: 812 });
    await page.route("**/api/weather", (route) =>
      route.fulfill({
        contentType: "application/json",
        status: 503,
        body: JSON.stringify({
          status: "unavailable",
          message: "自动化测试中的天气服务降级。",
        }),
      }),
    );
  });

  for (const path of publicPaths) {
    test(`${path} has no page-level horizontal overflow`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBeLessThan(400);
      await expectNoHorizontalOverflow(page);
    });
  }

  test("mobile navigation opens inside the viewport and closes with Escape", async ({
    page,
  }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "打开导航" }).click();
    await expect(
      page.getByRole("navigation", { name: "移动端导航" }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("navigation", { name: "移动端导航" }),
    ).toBeHidden();
  });

  test("homepage becomes a strict single column and the Dock uses real routes", async ({
    page,
  }) => {
    await page.goto("/");
    const carousel = page.getByRole("region", { name: "R7 的生活照片" });
    await expect(carousel).toBeVisible();
    await expect(carousel.locator("a")).toHaveCount(0);
    const [profile, content, widgets] = await Promise.all([
      page.locator(".home-profile-column").boundingBox(),
      page.locator(".home-main-column").boundingBox(),
      page.locator(".home-widget-column").boundingBox(),
    ]);

    expect(profile).not.toBeNull();
    expect(content).not.toBeNull();
    expect(widgets).not.toBeNull();
    expect(content!.y).toBeGreaterThan(profile!.y);
    expect(widgets!.y).toBeGreaterThan(content!.y);
    for (const box of [profile!, content!, widgets!]) {
      expect(box.width).toBeLessThanOrEqual(375);
    }

    const dock = page.getByRole("navigation", { name: "移动端快捷导航" });
    await expect(dock).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "天气暂不可用" }),
    ).toBeVisible();
    const hrefs = await dock.locator("a").evaluateAll((links) =>
      links.map((link) => link.getAttribute("href")),
    );
    expect(hrefs).toEqual(["/", "/blog", "/photos", "/moments", "/music"]);
    expect(hrefs).not.toContain("#");
    await expectNoHorizontalOverflow(page);
  });

  test("reduced motion prevents decorative petals from mounting", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator(".petal-field")).toHaveCount(0);
  });

  test("admin login, dashboard and editor fit the mobile viewport", async ({
    page,
  }) => {
    await page.goto("/admin/login");
    await expectNoHorizontalOverflow(page);

    await loginAsAdmin(page);
    await expectNoHorizontalOverflow(page);

    await page.goto("/admin/posts/create");
    await expect(
      page.getByRole("heading", { name: "新建文章" }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});

test.describe("1440px garden homepage", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium",
      "The desktop grid is verified once in Chromium.",
    );
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.route("**/api/weather", (route) =>
      route.fulfill({
        contentType: "application/json",
        status: 200,
        body: JSON.stringify({
          status: "unavailable",
          message: "自动化测试中的天气服务降级。",
        }),
      }),
    );
  });

  test("renders distinct profile, content and life-widget columns", async ({
    page,
  }) => {
    await page.goto("/");
    const [profile, content, widgets] = await Promise.all([
      page.locator(".home-profile-column").boundingBox(),
      page.locator(".home-main-column").boundingBox(),
      page.locator(".home-widget-column").boundingBox(),
    ]);

    expect(profile).not.toBeNull();
    expect(content).not.toBeNull();
    expect(widgets).not.toBeNull();
    expect(profile!.x + profile!.width).toBeLessThanOrEqual(content!.x);
    expect(content!.x + content!.width).toBeLessThanOrEqual(widgets!.x);
    await expect(page.getByRole("navigation", { name: "移动端快捷导航" })).toBeHidden();
    await expectNoHorizontalOverflow(page);
  });
});

test.describe("required acceptance viewport matrix", () => {
  test("home layout adapts across required desktop, tablet and phone sizes", async ({
    page,
  }, testInfo) => {
    test.setTimeout(120_000);
    test.skip(
      testInfo.project.name !== "chromium",
      "The viewport matrix is verified once in Chromium.",
    );
    await page.route("**/api/weather", (route) =>
      route.fulfill({
        contentType: "application/json",
        status: 503,
        body: JSON.stringify({
          status: "unavailable",
          message: "自动化测试中的天气服务降级。",
        }),
      }),
    );

    const viewports = [
      { width: 1280, height: 900 },
      { width: 1024, height: 900 },
      { width: 768, height: 1024 },
      { width: 430, height: 932 },
      { width: 393, height: 852 },
      { width: 390, height: 844 },
      { width: 375, height: 812 },
      { width: 360, height: 800 },
    ];

    for (const { width, height } of viewports) {
      await page.setViewportSize({ width, height });
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await expect(page.locator(".home-layout")).toBeVisible({
        timeout: 15_000,
      });
      const [profile, content, widgets] = await Promise.all([
        page.locator(".home-profile-column").boundingBox(),
        page.locator(".home-main-column").boundingBox(),
        page.locator(".home-widget-column").boundingBox(),
      ]);

      expect(profile, `${width}px profile column`).not.toBeNull();
      expect(content, `${width}px content column`).not.toBeNull();
      expect(widgets, `${width}px widget column`).not.toBeNull();
      await expectNoHorizontalOverflow(page);

      if (width >= 1280) {
        expect(profile!.x + profile!.width).toBeLessThanOrEqual(content!.x + 1);
        expect(content!.x + content!.width).toBeLessThanOrEqual(widgets!.x + 1);
      } else if (width >= 1024) {
        expect(content!.y).toBeGreaterThan(profile!.y);
        expect(Math.abs(content!.y - widgets!.y)).toBeLessThanOrEqual(1);
        expect(content!.x + content!.width).toBeLessThanOrEqual(widgets!.x + 1);
      } else {
        expect(content!.y).toBeGreaterThan(profile!.y);
        expect(widgets!.y).toBeGreaterThan(content!.y);
      }

      const dock = page.getByRole("navigation", {
        name: "移动端快捷导航",
      });
      if (width < 768) await expect(dock).toBeVisible();
      else await expect(dock).toBeHidden();
    }
  });
});
