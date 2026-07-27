import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium, type Page } from "@playwright/test";

const BASE_URL = "https://www.aibrium.cn/";
const OUTPUT_DIRECTORY = path.resolve(process.cwd(), "artifacts", "reference-aibrium");

type LinkRecord = {
  href: string;
  text: string;
};

type PageRecord = {
  key: string;
  label: string;
  url: string;
  title: string;
  headings: string[];
  links: LinkRecord[];
  landmarks: {
    main: number;
    nav: number;
    aside: number;
    article: number;
  };
  layout: {
    viewportWidth: number;
    bodyBackground: string;
    bodyColor: string;
    mainWidth: number | null;
    mainLeft: number | null;
  };
  blockingLoader: {
    found: boolean;
    hidden: boolean;
    position: string;
    width: number;
    height: number;
  };
  screenshot: string;
};

const targets = [
  { key: "archive", label: "归档", pattern: /归档|archive/i },
  { key: "photos", label: "照片墙", pattern: /照片|相册|图库|photos?|gallery/i },
  { key: "music", label: "音乐", pattern: /音乐|music/i },
  { key: "moments", label: "说说", pattern: /说说|动态|moments?|talk/i },
  { key: "guestbook", label: "留言墙", pattern: /留言|guestbook|message/i },
  { key: "friends", label: "友链", pattern: /友链|朋友|friends?|links?/i },
  { key: "about", label: "关于", pattern: /关于|about/i },
  { key: "projects", label: "开源项目", pattern: /开源|项目|projects?|open.?source/i },
] as const;

function normalizeText(value: string | null) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

async function collectLinks(page: Page) {
  return page.locator("a[href]").evaluateAll((anchors) =>
    anchors
      .map((anchor) => {
        const element = anchor as HTMLAnchorElement;
        return {
          href: element.href,
          text: (element.textContent ?? "").replace(/\s+/g, " ").trim(),
        };
      })
      .filter((link) => link.href.length > 0),
  );
}

async function revealPageBehindBlockingLoader(page: Page) {
  return page.evaluate(() => {
    const candidates = Array.from(document.querySelectorAll<HTMLElement>("body *")).filter((element) =>
      /^LOADING\.{0,3}$/i.test((element.textContent ?? "").trim()),
    );
    const loadingText = candidates.at(0);
    let current: HTMLElement | null = loadingText ?? null;
    let blocker: HTMLElement | null = null;

    while (current && current !== document.body) {
      const rect = current.getBoundingClientRect();
      const style = getComputedStyle(current);
      const coversViewport =
        rect.width >= window.innerWidth * 0.9 && rect.height >= window.innerHeight * 0.9;
      if (coversViewport && (style.position === "fixed" || style.position === "absolute")) {
        blocker = current;
      }
      current = current.parentElement;
    }

    const rect = blocker?.getBoundingClientRect();
    const position = blocker ? getComputedStyle(blocker).position : "";
    if (blocker) blocker.style.display = "none";
    document.documentElement.style.overflow = "auto";
    document.body.style.overflow = "auto";

    return {
      found: Boolean(loadingText),
      hidden: Boolean(blocker),
      position,
      width: rect ? Math.round(rect.width) : 0,
      height: rect ? Math.round(rect.height) : 0,
    };
  });
}

async function inspectPage(page: Page, key: string, label: string, screenshotName: string): Promise<PageRecord> {
  await page.waitForLoadState("domcontentloaded");
  const loader = page.getByText(/^LOADING\.{0,3}$/i).first();
  await loader.waitFor({ state: "hidden", timeout: 12_000 }).catch(async () => {
    await page.waitForTimeout(5_000);
  });
  await page.waitForTimeout(800);
  const blockingLoader = await revealPageBehindBlockingLoader(page);
  await page.waitForTimeout(250);

  const headings = await page
    .locator("h1, h2, h3")
    .allTextContents()
    .then((items) => items.map(normalizeText).filter(Boolean).slice(0, 24));
  const links = await collectLinks(page);
  const landmarks = {
    main: await page.locator("main").count(),
    nav: await page.locator("nav").count(),
    aside: await page.locator("aside").count(),
    article: await page.locator("article").count(),
  };
  const layout = await page.evaluate(() => {
    const bodyStyle = getComputedStyle(document.body);
    const main = document.querySelector("main");
    const rect = main?.getBoundingClientRect();
    return {
      viewportWidth: window.innerWidth,
      bodyBackground: bodyStyle.backgroundColor,
      bodyColor: bodyStyle.color,
      mainWidth: rect ? Math.round(rect.width) : null,
      mainLeft: rect ? Math.round(rect.left) : null,
    };
  });

  const screenshotPath = path.join(OUTPUT_DIRECTORY, screenshotName);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  return {
    key,
    label,
    url: page.url(),
    title: await page.title(),
    headings,
    links: links.slice(0, 80),
    landmarks,
    layout,
    blockingLoader,
    screenshot: path.relative(process.cwd(), screenshotPath).replaceAll("\\", "/"),
  };
}

async function main() {
  await mkdir(OUTPUT_DIRECTORY, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
    colorScheme: "light",
    locale: "zh-CN",
  });
  const page = await context.newPage();
  const records: PageRecord[] = [];

  try {
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 60_000 });
    records.push(await inspectPage(page, "home", "首页", "home-desktop.png"));

    const homeLinks = await collectLinks(page);
    const origin = new URL(page.url()).origin;
    const sameOriginLinks = homeLinks.filter((link) => {
      try {
        return new URL(link.href).origin === origin;
      } catch {
        return false;
      }
    });

    for (const target of targets) {
      const match = sameOriginLinks.find(
        (link) => target.pattern.test(link.text) || target.pattern.test(new URL(link.href).pathname),
      );
      if (!match) {
        records.push({
          key: target.key,
          label: target.label,
          url: "",
          title: "NAV_LINK_NOT_FOUND",
          headings: [],
          links: [],
          landmarks: { main: 0, nav: 0, aside: 0, article: 0 },
          layout: {
            viewportWidth: 1440,
            bodyBackground: "",
            bodyColor: "",
            mainWidth: null,
            mainLeft: null,
          },
          blockingLoader: {
            found: false,
            hidden: false,
            position: "",
            width: 0,
            height: 0,
          },
          screenshot: "",
        });
        continue;
      }

      await page.goto(match.href, { waitUntil: "domcontentloaded", timeout: 60_000 });
      records.push(await inspectPage(page, target.key, target.label, `${target.key}-desktop.png`));
    }

    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      colorScheme: "light",
      locale: "zh-CN",
    });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 60_000 });
    const mobileLoader = mobilePage.getByText(/^LOADING\.{0,3}$/i).first();
    await mobileLoader.waitFor({ state: "hidden", timeout: 12_000 }).catch(async () => {
      await mobilePage.waitForTimeout(5_000);
    });
    await mobilePage.waitForTimeout(800);
    await revealPageBehindBlockingLoader(mobilePage);
    await mobilePage.waitForTimeout(250);
    await mobilePage.screenshot({
      path: path.join(OUTPUT_DIRECTORY, "home-mobile-390.png"),
      fullPage: true,
    });
    await mobileContext.close();

    const outputPath = path.join(OUTPUT_DIRECTORY, "research.json");
    await writeFile(outputPath, `${JSON.stringify({ baseUrl: BASE_URL, records }, null, 2)}\n`, "utf8");
    process.stdout.write(
      `${JSON.stringify(
        {
          outputPath,
          pages: records.map(({ key, label, url, title, headings, landmarks, screenshot }) => ({
            key,
            label,
            url,
            title,
            headings,
            landmarks,
            screenshot,
          })),
        },
        null,
        2,
      )}\n`,
    );
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch((error) => {
  const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
