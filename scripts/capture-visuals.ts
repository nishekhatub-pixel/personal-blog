import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium, type BrowserContext, type Page } from "@playwright/test";

const port = 3000;
const baseUrl = `http://127.0.0.1:${port}`;
const visualRound =
  process.env.VISUAL_ROUND?.trim().replace(/[^a-zA-Z0-9_-]/g, "") ||
  "round-1";
const outputDirectory = resolve("artifacts", "visual-v2", visualRound);
const nextBinary = resolve("node_modules", "next", "dist", "bin", "next");

async function waitForServer() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {
      // The production server is still starting.
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 250));
  }
  throw new Error("本地生产服务器未在 30 秒内就绪。");
}

async function capture(
  page: Page,
  route: string,
  filename: string,
  consoleErrors: string[],
) {
  consoleErrors.length = 0;
  const response = await page.goto(`${baseUrl}${route}`, {
    waitUntil: "networkidle",
  });
  if (!response || response.status() >= 400) {
    throw new Error(`${route} 返回了 ${response?.status() ?? "空"} 响应。`);
  }

  await page
    .locator("main#main-content:visible")
    .waitFor({ state: "visible" });
  await page.evaluate(() => document.fonts.ready);

  const overlay = await page.locator(
    "[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay",
  ).count();
  if (overlay > 0) {
    throw new Error(`${route} 出现框架错误覆盖层。`);
  }

  const bodyHasContent = await page.evaluate(
    () => document.body.innerText.trim().length > 0,
  );
  if (!bodyHasContent) {
    throw new Error(`${route} 渲染为空白页面。`);
  }

  await page.evaluate(() => {
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) activeElement.blur();

    let captureStyles = document.querySelector<HTMLStyleElement>(
      "#visual-capture-overrides",
    );
    if (!captureStyles) {
      captureStyles = document.createElement("style");
      captureStyles.id = "visual-capture-overrides";
      captureStyles.textContent = `
        .site-header {
          position: relative !important;
          inset-block-start: auto !important;
        }

        .mobile-dock {
          position: absolute !important;
          inset-block-start: calc(100svh - 5.5rem) !important;
          inset-block-end: auto !important;
        }

        .skip-link {
          display: none !important;
        }
      `;
      document.head.append(captureStyles);
    }
  });

  await revealWholePage(page);
  await page.screenshot({
    path: resolve(outputDirectory, filename),
    fullPage: true,
  });

  if (consoleErrors.length > 0) {
    throw new Error(`${route} 产生控制台错误：${consoleErrors.join(" | ")}`);
  }
}

async function revealWholePage(page: Page) {
  for (let step = 0; step < 60; step += 1) {
    const state = await page.evaluate(() => ({
      scrollHeight: document.documentElement.scrollHeight,
      scrollY: window.scrollY,
      viewportHeight: window.innerHeight,
    }));
    if (
      state.scrollY + state.viewportHeight >=
      state.scrollHeight - 2
    ) {
      break;
    }
    await page.evaluate(() => {
      window.scrollBy(0, Math.max(window.innerHeight * 0.78, 420));
    });
    await page.waitForTimeout(90);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(350);
}

function watchConsole(page: Page) {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

async function createPage(context: BrowserContext) {
  const page = await context.newPage();
  return { page, consoleErrors: watchConsole(page) };
}

async function main() {
  await mkdir(outputDirectory, { recursive: true });

  const serverLogs: string[] = [];
  const server = spawn(
    process.execPath,
    [nextBinary, "start", "-p", String(port)],
    {
      cwd: process.cwd(),
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    },
  );
  server.stdout.on("data", (chunk) => serverLogs.push(String(chunk)));
  server.stderr.on("data", (chunk) => serverLogs.push(String(chunk)));

  let browser;
  try {
    await waitForServer();
    browser = await chromium.launch();

    const desktop = await browser.newContext({
      colorScheme: "light",
      viewport: { width: 1440, height: 1000 },
    });
    const desktopSession = await createPage(desktop);

    await capture(
      desktopSession.page,
      "/",
      "01-home-desktop-light.png",
      desktopSession.consoleErrors,
    );
    await capture(
      desktopSession.page,
      "/photos",
      "02-photos-desktop-light.png",
      desktopSession.consoleErrors,
    );
    await capture(
      desktopSession.page,
      "/music",
      "03-music-desktop-light.png",
      desktopSession.consoleErrors,
    );
    await capture(
      desktopSession.page,
      "/moments",
      "04-moments-desktop-light.png",
      desktopSession.consoleErrors,
    );
    await capture(
      desktopSession.page,
      "/guestbook",
      "05-guestbook-desktop-light.png",
      desktopSession.consoleErrors,
    );
    await capture(
      desktopSession.page,
      "/about",
      "06-about-desktop-light.png",
      desktopSession.consoleErrors,
    );
    await capture(
      desktopSession.page,
      "/blog",
      "07-blog-desktop-light.png",
      desktopSession.consoleErrors,
    );
    await capture(
      desktopSession.page,
      "/projects",
      "08-projects-desktop-light.png",
      desktopSession.consoleErrors,
    );
    await capture(
      desktopSession.page,
      "/archive",
      "09-archive-desktop-light.png",
      desktopSession.consoleErrors,
    );
    await capture(
      desktopSession.page,
      "/friends",
      "10-friends-desktop-light.png",
      desktopSession.consoleErrors,
    );

    await desktopSession.page.goto(`${baseUrl}/admin/login`);
    await desktopSession.page.getByLabel("邮箱").fill(
      process.env.ADMIN_EMAIL ?? "admin@r7.local",
    );
    await desktopSession.page.getByLabel("密码").fill(
      process.env.ADMIN_PASSWORD ?? "R7-Local-2026-Change-Me",
    );
    await desktopSession.page
      .getByRole("button", { name: "进入编辑室" })
      .click();
    await desktopSession.page.waitForURL(/\/admin(?:\/)?$/);
    await capture(
      desktopSession.page,
      "/admin/moments",
      "11-admin-moments-desktop-light.png",
      desktopSession.consoleErrors,
    );
    await capture(
      desktopSession.page,
      "/admin/settings",
      "11b-admin-settings-desktop-light.png",
      desktopSession.consoleErrors,
    );
    await capture(
      desktopSession.page,
      "/admin/music/new",
      "11c-admin-music-upload-desktop-light.png",
      desktopSession.consoleErrors,
    );
    await capture(
      desktopSession.page,
      "/admin/albums",
      "11d-admin-albums-desktop-light.png",
      desktopSession.consoleErrors,
    );
    await desktop.close();

    const dark = await browser.newContext({
      colorScheme: "dark",
      viewport: { width: 1440, height: 1000 },
    });
    await dark.addInitScript(() => {
      window.localStorage.setItem("theme", "dark");
    });
    const darkSession = await createPage(dark);
    await capture(
      darkSession.page,
      "/",
      "12-home-desktop-dark.png",
      darkSession.consoleErrors,
    );
    await dark.close();

    const mobile = await browser.newContext({
      colorScheme: "light",
      hasTouch: true,
      isMobile: true,
      viewport: { width: 390, height: 844 },
    });
    const mobileSession = await createPage(mobile);
    await capture(
      mobileSession.page,
      "/",
      "13-home-mobile-390-light.png",
      mobileSession.consoleErrors,
    );
    await capture(
      mobileSession.page,
      "/music",
      "14-music-mobile-390-light.png",
      mobileSession.consoleErrors,
    );
    await capture(
      mobileSession.page,
      "/guestbook",
      "15-guestbook-mobile-390-light.png",
      mobileSession.consoleErrors,
    );
    await capture(
      mobileSession.page,
      "/photos",
      "16-photos-mobile-390-light.png",
      mobileSession.consoleErrors,
    );
    await capture(
      mobileSession.page,
      "/moments",
      "17-moments-mobile-390-light.png",
      mobileSession.consoleErrors,
    );
    await capture(
      mobileSession.page,
      "/blog",
      "18-blog-mobile-390-light.png",
      mobileSession.consoleErrors,
    );
    await capture(
      mobileSession.page,
      "/about",
      "19-about-mobile-390-light.png",
      mobileSession.consoleErrors,
    );
    await mobile.close();

    console.log(`视觉截图已写入 ${outputDirectory}`);
  } catch (error) {
    console.error(serverLogs.join(""));
    throw error;
  } finally {
    await browser?.close();
    if (!server.killed) server.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
