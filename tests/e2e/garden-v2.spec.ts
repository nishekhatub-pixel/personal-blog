import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test.setTimeout(120_000);

function runId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function ensureAdmin(page: Page) {
  await page.goto("/admin");
  if (page.url().includes("/admin/login")) await loginAsAdmin(page);
}

async function deleteMomentIfPresent(page: Page, query: string) {
  await ensureAdmin(page);
  await page.goto(`/admin/moments?q=${encodeURIComponent(query)}`);
  const item = page.locator("li").filter({ hasText: query }).first();
  if (!(await item.count())) return;
  page.once("dialog", (dialog) => dialog.accept());
  await item.getByRole("button", { name: "删除说说" }).click();
  await expect(item).toHaveCount(0);
}

async function deleteGuestbookIfPresent(page: Page, query: string) {
  await ensureAdmin(page);
  await page.goto(`/admin/guestbook?q=${encodeURIComponent(query)}`);
  const item = page.locator("li").filter({ hasText: query }).first();
  if (!(await item.count())) return;
  page.once("dialog", (dialog) => dialog.accept());
  await item.getByRole("button", { name: "删除留言" }).click();
  await expect(item).toHaveCount(0);
}

async function deleteFriendIfPresent(page: Page, query: string) {
  await ensureAdmin(page);
  await page.goto(`/admin/friends?q=${encodeURIComponent(query)}`);
  const item = page.locator("li").filter({ hasText: query }).first();
  if (!(await item.count())) return;
  page.once("dialog", (dialog) => dialog.accept());
  await item.getByRole("button", { name: /删除友链/ }).click();
  await expect(item).toHaveCount(0);
}

async function deleteAlbumIfPresent(page: Page, query: string) {
  await ensureAdmin(page);
  await page.goto(`/admin/albums?q=${encodeURIComponent(query)}`);
  const item = page.locator("li").filter({ hasText: query }).first();
  if (!(await item.count())) return;
  page.once("dialog", (dialog) => dialog.accept());
  await item.getByRole("button", { name: /删除相册/ }).click();
  await expect(item).toHaveCount(0);
}

async function deleteMediaIfPresent(page: Page, query: string) {
  await ensureAdmin(page);
  await page.goto(`/admin/media?q=${encodeURIComponent(query)}`);
  const item = page.locator("li").filter({ hasText: query }).first();
  if (!(await item.count())) return;
  page.once("dialog", (dialog) => dialog.accept());
  await item.getByRole("button", { name: new RegExp(`删除 ${query}`) }).click();
  await expect(item).toHaveCount(0);
}

async function momentCountOnHomepage(page: Page) {
  await page.goto("/");
  const valueLocator = page.locator(
    '.home-profile__stats a[href="/moments"] strong',
  );
  await expect(valueLocator).toBeVisible();
  const value = (await valueLocator.textContent())?.replace(/[^\d]/g, "");
  expect(value).toMatch(/^\d+$/);
  return Number(value);
}

test.describe.serial("R7 V2 persisted public workflows", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium",
      "Database-mutating workflows run once and clean up their records.",
    );
  });

  test("admin completes a real Moment CRUD cycle and homepage stats follow the database", async ({
    page,
  }) => {
    const id = runId("e2e-moment");
    const initial = `自动化说说 ${id}：今天整理了一次真实的数据流。`;
    const updated = `自动化说说 ${id}：内容已更新并完成回看。`;
    const countBefore = await momentCountOnHomepage(page);

    try {
      await loginAsAdmin(page);
      await page.goto("/admin/moments/new");
      await page.getByLabel("说说内容").fill(initial);
      await page.getByLabel("心情").fill("专注");
      await page.getByLabel("状态").selectOption("PUBLISHED");
      await page.getByRole("button", { name: "创建说说" }).click();
      await expect(page).toHaveURL(/\/admin\/moments\/[^/]+\/edit\?created=1$/);

      await page.goto("/moments");
      await expect(page.getByText(initial, { exact: true })).toBeVisible();
      expect(await momentCountOnHomepage(page)).toBe(countBefore + 1);

      await page.goto("/admin/moments");
      await page
        .locator("li")
        .filter({ hasText: initial })
        .getByRole("link", { name: "编辑说说" })
        .click();
      await page.getByLabel("说说内容").fill(updated);
      await page.getByRole("button", { name: "保存修改" }).click();
      await expect(page).toHaveURL(/\/edit\?saved=1$/);

      await page.goto("/moments");
      await expect(page.getByText(updated, { exact: true })).toBeVisible();
      await expect(page.getByText(initial, { exact: true })).toHaveCount(0);
      const momentCard = page.locator("article").filter({ hasText: updated });
      await momentCard
        .getByRole("button", { name: "喜欢这条说说" })
        .click();
      await expect(momentCard.getByText("已记下这份喜欢。")).toBeVisible();
      const visitorCookie = (await page.context().cookies()).find(
        (cookie) => cookie.name === "r7_visitor",
      );
      expect(visitorCookie).toMatchObject({
        httpOnly: true,
        sameSite: "Lax",
      });
      await momentCard
        .getByRole("button", { name: "取消喜欢这条说说" })
        .click();
      await expect(momentCard.getByText("已取消喜欢。")).toBeVisible();

      await deleteMomentIfPresent(page, id);
      expect(await momentCountOnHomepage(page)).toBe(countBefore);
    } finally {
      await deleteMomentIfPresent(page, id).catch(() => undefined);
    }
  });

  test("guestbook submissions stay pending and private until an admin approves them", async ({
    page,
  }) => {
    const id = runId("e2e-guestbook");
    const nickname = `测试访客-${id}`;
    const content = `这是一条只为审核流程存在并会自动清理的留言：${id}`;
    await page.setExtraHTTPHeaders({
      "x-forwarded-for": `198.51.100.${Math.floor(Math.random() * 200) + 1}`,
      "x-real-ip": `198.51.100.${Math.floor(Math.random() * 200) + 1}`,
    });

    try {
      await page.goto("/guestbook");
      const form = page.getByRole("form", { name: "提交留言" });
      await form.getByLabel("昵称").fill(nickname);
      await form.getByLabel("留言内容").fill(content);
      await form.getByRole("button", { name: "提交留言" }).click();
      await expect(form.getByText(/留言已提交/)).toBeVisible();

      await page.reload();
      await expect(page.getByText(content, { exact: true })).toHaveCount(0);

      await loginAsAdmin(page);
      await page.goto(`/admin/guestbook?q=${encodeURIComponent(id)}`);
      const item = page.locator("li").filter({ hasText: id }).first();
      const moderationForm = item.locator("form").first();
      await expect(item).toContainText("待审核");
      await moderationForm.getByLabel("审核状态").selectOption("APPROVED");
      await moderationForm
        .getByRole("button", { name: "保存审核与回复" })
        .click();
      await expect(
        moderationForm.locator('p[aria-live="polite"]'),
      ).toHaveText("留言审核信息已保存。", { timeout: 15_000 });

      await page.goto("/guestbook");
      await expect(page.getByText(content, { exact: true })).toBeVisible();
    } finally {
      await deleteGuestbookIfPresent(page, id).catch(() => undefined);
    }
  });

  test("friend applications require review before becoming public", async ({
    page,
  }) => {
    const id = runId("e2e-friend");
    const name = `测试友链 ${id}`;
    const url = `https://${id}.example.com/`;
    await page.setExtraHTTPHeaders({
      "x-forwarded-for": `203.0.113.${Math.floor(Math.random() * 200) + 1}`,
      "x-real-ip": `203.0.113.${Math.floor(Math.random() * 200) + 1}`,
    });

    try {
      await page.goto("/friends");
      const form = page.getByRole("form", { name: "申请友链" });
      await form.getByLabel("站点名称").fill(name);
      await form.getByLabel("站点地址").fill(url);
      await form
        .getByLabel("简介")
        .fill("用于验证友链申请、审核、发布和清理流程的临时站点。");
      await form.getByRole("button", { name: "提交申请" }).click();
      await expect(form.getByText(/申请已提交/)).toBeVisible();

      await page.reload();
      await expect(page.getByText(name, { exact: true })).toHaveCount(0);

      await loginAsAdmin(page);
      await page.goto(`/admin/friends?q=${encodeURIComponent(id)}`);
      await page.getByRole("link", { name }).click();
      await expect(page.getByLabel("状态")).toHaveValue("DRAFT");
      await page.getByLabel("状态").selectOption("PUBLISHED");
      await page.getByRole("button", { name: "保存修改" }).click();
      await expect(page).toHaveURL(/\/edit\?saved=1$/);

      await page.goto("/friends");
      await expect(page.getByRole("heading", { name })).toBeVisible();
      await expect(
        page.getByRole("link", { name: new RegExp(`访问 ${name}`) }),
      ).toHaveAttribute("href", url);
    } finally {
      await deleteFriendIfPresent(page, id).catch(() => undefined);
    }
  });

  test("a temporary album opens and its lightbox closes with Escape", async ({
    page,
  }) => {
    const id = runId("e2e-album");
    const slug = id.toLowerCase();
    const albumTitle = `测试相册 ${id}`;
    const photoAlt = `测试相册中的数据结构封面 ${id}`;
    const originalName = `${id}.png`;

    try {
      await loginAsAdmin(page);
      const image = await readFile(
        resolve("public", "images", "cover-data-structures.png"),
      );
      const upload = await page.request.post("/api/admin/media", {
        headers: { origin: "http://127.0.0.1:3000" },
        multipart: {
          alt: photoAlt,
          file: {
            name: originalName,
            mimeType: "image/png",
            buffer: image,
          },
        },
      });
      expect(upload.status()).toBe(201);
      const uploaded = (await upload.json()) as {
        media: { id: string };
      };

      await page.goto("/admin/albums/new");
      await page.getByLabel("相册名称").fill(albumTitle);
      await page.getByLabel("Slug").fill(slug);
      await page
        .getByLabel("相册说明")
        .fill("用于验证相册、照片和键盘灯箱流程的临时记录。");
      await page.getByLabel("封面媒体").selectOption(uploaded.media.id);
      await page.getByLabel("状态").selectOption("PUBLISHED");
      await page.getByRole("button", { name: "创建相册" }).click();
      await expect(page).toHaveURL(/\/admin\/albums\/[^/]+\/edit\?created=1$/);
      const albumId = page.url().match(/\/admin\/albums\/([^/]+)\/edit/)?.[1];
      expect(albumId).toBeTruthy();

      await page.goto("/admin/photos/new");
      await page.getByLabel("所属相册").selectOption(albumId!);
      await page.getByLabel("媒体文件").selectOption(uploaded.media.id);
      await page.getByLabel("替代文本").fill(photoAlt);
      await page
        .getByLabel("照片说明")
        .fill("此数据仅在自动化测试期间存在。");
      await page.getByLabel("状态").selectOption("PUBLISHED");
      await page.getByRole("button", { name: "添加照片" }).click();
      await expect(page).toHaveURL(/\/admin\/photos\/[^/]+\/edit\?created=1$/);

      await page.goto("/photos");
      await page
        .getByRole("link", { name: `查看相册：${albumTitle}` })
        .click();
        await expect(
          page.getByRole("heading", { level: 1, name: albumTitle }),
        ).toBeVisible();
        const galleryImage = page.getByAltText(photoAlt).first();
        await expect(galleryImage).toBeVisible();
        await expect
          .poll(() =>
            galleryImage.evaluate(
              (image) =>
                (image as HTMLImageElement).complete &&
                (image as HTMLImageElement).naturalWidth > 0,
            ),
          )
          .toBe(true);
        await page.getByRole("button", { name: `查看大图：${photoAlt}` }).click();
        await expect(page.getByRole("dialog")).toBeVisible();
        const lightboxImage = page
          .getByRole("dialog")
          .getByAltText(photoAlt)
          .first();
        await expect
          .poll(() =>
            lightboxImage.evaluate(
              (image) =>
                (image as HTMLImageElement).complete &&
                (image as HTMLImageElement).naturalWidth > 0,
            ),
          )
          .toBe(true);
        await expect(
          page.getByRole("button", { name: "关闭照片灯箱" }),
        ).toBeFocused();
        await page.keyboard.press("Escape");
        await expect(page.getByRole("dialog")).toHaveCount(0);
        await page.waitForLoadState("networkidle");
      } finally {
      await deleteAlbumIfPresent(page, id).catch(() => undefined);
      await deleteMediaIfPresent(page, originalName).catch(() => undefined);
    }
  });
});
