import path from "node:path";
import { expect, test } from "@playwright/test";
import { adminEmail, loginAsAdmin } from "./helpers";

test.describe("admin authentication", () => {
  test("anonymous visitors are redirected to the secure login", async ({
    page,
  }) => {
    await page.goto("/admin/posts");

    await expect(page).toHaveURL(/\/admin\/login$/);
    await expect(
      page.getByRole("heading", { name: "进入编辑室" }),
    ).toBeVisible();
  });

  test("invalid credentials show a generic error without navigating", async ({
    page,
  }) => {
    await page.setExtraHTTPHeaders({
      "x-forwarded-for": `playwright-login-${Date.now()}`,
    });
    await page.goto("/admin/login");
    await page.getByLabel("邮箱").fill(adminEmail);
    await page.getByLabel("密码").fill("incorrect-password");
    await page.getByRole("button", { name: "进入编辑室" }).click();

    await expect(page).toHaveURL(/\/admin\/login$/);
    await expect(page.getByText("邮箱或密码不正确。")).toBeVisible();
  });

  test("valid credentials open the real dashboard", async ({ page }) => {
    await loginAsAdmin(page);
    await expect(
      page.getByRole("heading", { name: /早上好|下午好|晚上好/ }),
    ).toBeVisible();
    await expect(
      page.locator('a[href="/admin/posts"]:visible').first(),
    ).toBeVisible();
    await expect(
      page.locator('a[href="/admin/media"]:visible').first(),
    ).toBeVisible();
  });
});

test.describe.serial("article CRUD", () => {
  test("creates, publishes, updates and deletes an article", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    const runId = `${Date.now()}-${test.info().project.name}`;
    const slug = `playwright-crud-${runId}`.toLowerCase();
    const initialTitle = `Playwright 自动化文章 ${runId}`;
    const updatedTitle = `Playwright 自动化文章已更新 ${runId}`;

    await loginAsAdmin(page);
    await page.goto("/admin/posts/create");
    await expect(
      page.getByRole("heading", { name: "新建文章" }),
    ).toBeVisible();

    await page.getByLabel("标题", { exact: true }).fill(initialTitle);
    await page.getByLabel("Slug").fill(slug);
    await page
      .getByLabel("摘要")
      .fill("这是一篇由 Playwright 创建的完整测试文章，用来验证真实数据库中的文章生命周期。");
    await page
      .getByLabel("正文")
      .fill(
        "## 自动化创建\n\n这段正文超过五十个字符，覆盖文章创建、公开读取、更新和删除的完整数据流。\n\n- 创建草稿\n- 发布内容\n- 更新标题\n- 清理测试记录",
      );
    await page.getByLabel("状态").selectOption("PUBLISHED");
    await page.getByLabel("分类").selectOption({ index: 1 });
    await page.getByLabel("预计阅读时长（分钟）").fill("6");
    await page.getByRole("button", { name: "创建文章" }).click();

    await expect(page).toHaveURL(
      /\/admin\/posts\/[^/]+\/edit\?created=1$/,
      { timeout: 15_000 },
    );
    const editUrl = page.url();
    await expect(page.getByText("文章已创建并安全保存。")).toBeVisible();
    await expect(page.getByLabel("标题", { exact: true })).toHaveValue(
      initialTitle,
    );

    await page.goto(`/blog/${slug}`);
    await expect(
      page.getByRole("heading", { level: 1, name: initialTitle }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "自动化创建" }),
    ).toBeVisible();

    await page.goto(editUrl);
    await page.getByLabel("标题", { exact: true }).fill(updatedTitle);
    await page.getByRole("button", { name: "保存修改" }).click();
    await expect(page).toHaveURL(/\/edit\?saved=1$/);
    await expect(page.getByText("文章修改已保存。")).toBeVisible();

    await page.goto(`/blog/${slug}`);
    await expect(
      page.getByRole("heading", { level: 1, name: updatedTitle }),
    ).toBeVisible();

    await page.goto(`/admin/posts?q=${encodeURIComponent(slug)}`);
    await expect(
      page.getByRole("link", { name: updatedTitle }).first(),
    ).toBeVisible();

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: /删除/ }).first().click();
    await expect(page.getByText("没有匹配的文章")).toBeVisible();

    const deletedResponse = await page.goto(`/blog/${slug}`);
    expect(deletedResponse?.status()).toBe(404);
  });
});

test.describe("media validation", () => {
  test("client and server both reject invalid image payloads", async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/media");
    await expect(
      page.getByRole("heading", { name: "媒体库" }),
    ).toBeVisible();

    await page.locator('input[type="file"]').setInputFiles({
      name: "payload.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("not an image"),
    });
    await expect(
      page.getByText(
        "支持 JPEG、PNG、WebP、AVIF、GIF、TIFF、HEIC 和 HEIF 图片。",
      ),
    ).toBeVisible();

    const response = await page.request.post("/api/admin/media", {
      headers: { origin: "http://127.0.0.1:3000" },
      multipart: {
        alt: "伪造图片",
        file: {
          name: "spoofed.jpg",
          mimeType: "image/jpeg",
          buffer: Buffer.from("this content is not a jpeg image"),
        },
      },
    });

    expect(response.status()).toBe(400);
    expect((await response.json()).error).toMatch(/真实格式|识别图片/);

    const pngFixture = path.join(
      process.cwd(),
      "public",
      "images",
      "r7-about-study.png",
    );
    await page.locator('input[type="file"]').setInputFiles(pngFixture);
    await expect(
      page.getByText("r7-about-study.png", { exact: true }),
    ).toBeVisible({
      timeout: 20_000,
    });

    page.once("dialog", (dialog) => dialog.accept());
    await page
      .getByRole("button", { name: "删除 r7-about-study.png" })
      .click();
    await expect(
      page.getByText("r7-about-study.png", { exact: true }),
    ).toHaveCount(0, { timeout: 15_000 });
  });
});

test.describe.serial("site settings", () => {
  test("saves validated settings and reloads the persisted value", async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/settings");
    const footerNote = page.getByLabel("页脚短句");
    const originalValue = await footerNote.inputValue();
    const temporaryValue = `设置保存验证 ${Date.now()}`;

    try {
      await footerNote.fill(temporaryValue);
      await page.getByRole("button", { name: "保存设置" }).click();
      await expect(
        page.getByText("站点设置已保存并开始生效。"),
      ).toBeVisible({ timeout: 15_000 });

      await page.reload();
      await expect(page.getByLabel("页脚短句")).toHaveValue(temporaryValue);
    } finally {
      await page.getByLabel("页脚短句").fill(originalValue);
      await page.getByRole("button", { name: "保存设置" }).click();
      await expect(
        page.getByText("站点设置已保存并开始生效。"),
      ).toBeVisible({ timeout: 15_000 });
    }
  });
});
