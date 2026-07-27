import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath: string) {
  return readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

describe("sharp server boundaries", () => {
  it("keeps the shared admin action module free of image processing", () => {
    const adminActions = source("src/actions/admin.ts");

    expect(adminActions).not.toMatch(/@\/lib\/uploads|from\s+["']sharp["']/);
  });

  it("loads sharp only inside the upload processing path", () => {
    const uploads = source("src/lib/uploads.ts");
    const mediaApi = source("src/lib/media-api.ts");

    expect(uploads).not.toMatch(/import\s+sharp\s+from\s+["']sharp["']/);
    expect(uploads).toContain('import("sharp")');
    expect(mediaApi).not.toMatch(
      /import\s+\{\s*processMediaUpload\s*\}\s+from\s+["']@\/lib\/uploads["']/,
    );
    expect(mediaApi).toContain('await import("@/lib/uploads")');
  });

  it("pins media upload handlers to the Node.js runtime", () => {
    for (const route of [
      "src/app/api/admin/media/route.ts",
      "src/app/api/media/upload/route.ts",
    ]) {
      expect(source(route)).toContain('export const runtime = "nodejs"');
    }
  });
});
