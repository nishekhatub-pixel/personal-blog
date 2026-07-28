import { expect, type Page } from "@playwright/test";

export const adminEmail =
  process.env.ADMIN_EMAIL ?? "admin@r7.local";
export const adminPassword =
  process.env.ADMIN_PASSWORD ?? "R7-Local-2026-Change-Me";

export async function loginAsAdmin(page: Page) {
  await page.goto("/admin/login");
  await expect(
    page.getByRole("heading", { name: "进入编辑室" }),
  ).toBeVisible();
  await page.getByLabel("邮箱").fill(adminEmail);
  await page.getByLabel("密码").fill(adminPassword);
  await page.getByRole("button", { name: "进入编辑室" }).click();
  await expect(page).toHaveURL(/\/admin(?:\/)?$/, { timeout: 15_000 });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
    timeout: 15_000,
  });
}

export async function expectHealthyPage(
  page: Page,
  path: string,
  heading: string | RegExp,
) {
  const response = await page.goto(path);
  expect(response, `Expected a document response for ${path}`).not.toBeNull();
  expect(
    response!.status(),
    `Expected ${path} to return a successful status`,
  ).toBeLessThan(400);
  await expect(page.locator("main#main-content:visible")).toBeVisible({
    timeout: 15_000,
  });
  await expect(
    page.getByRole("heading", { level: 1, name: heading }),
  ).toBeVisible();
}
