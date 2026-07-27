import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test("site search returns real article and project records", async ({ page }) => {
  await page.goto("/search");

  const search = page.getByRole("searchbox", {
    name: "搜索文章和项目",
  });
  await search.fill("MySQL");
  await search.press("Enter");

  await expect(page).toHaveURL(/\/search\?q=MySQL$/);
  await expect(page.getByText(/“MySQL” 找到 \d+ 条结果/)).toBeVisible();
  await expect(
    page.getByRole("link", {
      name: /MySQL 索引不是越多越好：一次查询优化复盘/,
    }),
  ).toBeVisible();
});

test("a public comment is submitted into moderation", async ({ page }) => {
  const marker = `e2e-comment-${Date.now()}-${test.info().project.name}`;
  const author = `自动化读者-${marker}`;
  const content = `这是一条等待审核且会在测试后清理的评论：${marker}`;
  await page.setExtraHTTPHeaders({
    "x-forwarded-for": `198.51.100.${Math.floor(Math.random() * 200) + 1}`,
    "x-real-ip": `198.51.100.${Math.floor(Math.random() * 200) + 1}`,
  });
  try {
    await page.goto("/blog/array-to-linked-list-tradeoffs#comments");

    const commentForm = page.getByRole("form", { name: "提交评论" });
    await commentForm.getByLabel("名字").fill(author);
    await commentForm
      .getByLabel("邮箱，不会公开")
      .fill(`${marker}@example.com`);
    await commentForm.getByLabel("评论", { exact: true }).fill(content);
    await commentForm.getByRole("button", { name: "提交评论" }).click();

    await expect(
      page.locator('[aria-live="polite"]').filter({ hasText: "审核" }),
    ).toContainText("评论已提交");
    await expect(
      commentForm.getByText("首次评论会进入审核队列。"),
    ).toBeVisible();
  } finally {
    await loginAsAdmin(page);
    await page.goto(`/admin/comments?q=${encodeURIComponent(marker)}`);
    const item = page.locator("li").filter({ hasText: marker }).first();
    if (await item.count()) {
      page.once("dialog", (dialog) => dialog.accept());
      await item
        .getByRole("button", { name: "永久删除评论" })
        .click();
      await expect(item).toHaveCount(0);
    }
  }
});

test("theme toggle changes and persists the selected theme", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");

  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page
    .getByRole("button", { name: "切换到深色主题" })
    .click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(
    page.getByRole("button", { name: "切换到浅色主题" }),
  ).toBeVisible();
  const darkTheme = await page.evaluate(() => {
    const styles = getComputedStyle(document.body);
    const parseRgb = (value: string) =>
      (value.match(/\d+(?:\.\d+)?/g) ?? [])
        .slice(0, 3)
        .map(Number);
    const luminance = (rgb: number[]) => {
      const channels = rgb.map((channel) => {
        const value = channel / 255;
        return value <= 0.03928
          ? value / 12.92
          : ((value + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
    };
    const foreground = parseRgb(styles.color);
    const background = parseRgb(styles.backgroundColor);
    const lighter = Math.max(luminance(foreground), luminance(background));
    const darker = Math.min(luminance(foreground), luminance(background));
    return {
      background: styles.backgroundColor,
      contrast: (lighter + 0.05) / (darker + 0.05),
    };
  });
  expect(darkTheme.background).not.toBe("rgb(0, 0, 0)");
  expect(darkTheme.contrast).toBeGreaterThanOrEqual(4.5);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});
