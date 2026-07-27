import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

const accessiblePublicPaths = [
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
  "/calendar",
  "/about",
  "/now",
  "/contact",
  "/search?q=MySQL",
];

async function expectNoAxeViolations(
  page: import("@playwright/test").Page,
) {
  const results = await new AxeBuilder({ page }).analyze();
  const impactRank = {
    critical: 0,
    serious: 1,
    moderate: 2,
    minor: 3,
    null: 4,
  };
  const summary = [...results.violations]
    .sort(
      (left, right) => {
        if (left.id === "color-contrast") return -1;
        if (right.id === "color-contrast") return 1;
        return (
          impactRank[left.impact ?? "null"] -
          impactRank[right.impact ?? "null"]
        );
      },
    )
    .map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    help: violation.help,
    nodes: violation.nodes.map((node) => ({
      target: node.target.join(" "),
      failureSummary: node.failureSummary,
      checks: [...node.any, ...node.all, ...node.none].map((check) => ({
        message: check.message,
        data: check.data,
      })),
    })),
    }));

  expect(summary).toEqual([]);
}

test.describe("axe accessibility audit", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium",
      "The complete axe audit runs once in desktop Chromium.",
    );
  });

  for (const path of accessiblePublicPaths) {
    test(`${path} has no automatically detectable violations`, async ({
      page,
    }) => {
      await page.goto(path, { waitUntil: "networkidle" });
      const main = page.locator("main#main-content");
      await expect(main).toHaveCount(1);
      await expect(main).toBeVisible();
      await expectNoAxeViolations(page);
    });
  }

  test("admin login has no automatically detectable violations", async ({
    page,
  }) => {
    await page.goto("/admin/login", { waitUntil: "networkidle" });
    await expectNoAxeViolations(page);
  });

  test("authenticated dashboard has no automatically detectable violations", async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await expectNoAxeViolations(page);

    for (const path of ["/admin/moments", "/admin/guestbook"]) {
      await page.goto(path, { waitUntil: "networkidle" });
      const main = page.locator("main#main-content");
      await expect(main).toHaveCount(1);
      await expect(main).toBeVisible();
      await expectNoAxeViolations(page);
    }
  });
});
