import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import {
  existsSync,
  readFileSync,
  readdirSync,
  realpathSync,
  statSync,
} from "node:fs";
import { createServer } from "node:net";
import path from "node:path";

const root = process.cwd();
const nextServer = path.join(root, ".next", "server");

function walk(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

function traceFiles(tracePath: string) {
  const trace = JSON.parse(readFileSync(tracePath, "utf8")) as {
    files?: string[];
  };
  return (trace.files ?? []).map((file) => file.replaceAll("\\", "/"));
}

function loadedServerChunks(pagePath: string) {
  const source = readFileSync(pagePath, "utf8");
  return [...source.matchAll(/R\.c\("([^"]+)"\)/g)].map(
    (match) => match[1],
  );
}

function loadsSharp(chunkPath: string) {
  const source = readFileSync(chunkPath, "utf8");
  return (
    source.includes("[externals]_sharp") ||
    source.includes("external module sharp") ||
    /a\.y\(["']sharp-[^"']+["']\)/.test(source)
  );
}

function availablePort() {
  return new Promise<number>((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      assert(address && typeof address === "object");
      const { port } = address;
      server.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function verifyAdminRoutes() {
  const port = await availablePort();
  const server = spawn(
    process.execPath,
    [path.join(root, "node_modules", "next", "dist", "bin", "next"), "start", "-p", String(port)],
    {
      cwd: root,
      env: { ...process.env, NODE_ENV: "production" },
      stdio: "ignore",
      windowsHide: true,
    },
  );
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    let ready = false;
    for (let attempt = 0; attempt < 40; attempt += 1) {
      if (server.exitCode !== null) break;
      try {
        const response = await fetch(`${baseUrl}/admin/login`, {
          redirect: "manual",
        });
        if (response.status === 200) {
          ready = true;
          break;
        }
      } catch {
        await delay(250);
      }
    }
    assert(ready, "The local production server did not become ready.");

    const protectedRoutes = [
      "/admin",
      "/admin/posts",
      "/admin/posts/create",
      "/admin/comments",
      "/admin/categories",
      "/admin/tags",
      "/admin/projects",
      "/admin/media",
      "/admin/settings",
      "/admin/albums",
    ];
    for (const route of protectedRoutes) {
      const response = await fetch(`${baseUrl}${route}`, {
        redirect: "manual",
      });
      assert.equal(response.status, 307, `${route} did not redirect to login.`);
      assert(
        response.headers.get("location")?.startsWith("/admin/login"),
        `${route} returned an unexpected redirect.`,
      );
    }

    const mediaList = await fetch(`${baseUrl}/api/admin/media`, {
      redirect: "manual",
    });
    assert.equal(
      mediaList.status,
      401,
      "The media list endpoint failed before authentication.",
    );
    const legacyUpload = await fetch(`${baseUrl}/api/media/upload`, {
      redirect: "manual",
    });
    assert.equal(
      legacyUpload.status,
      405,
      "The upload-only endpoint failed during module initialization.",
    );

    return protectedRoutes.length + 3;
  } finally {
    if (server.exitCode === null) {
      server.kill();
      await Promise.race([once(server, "exit"), delay(5_000)]);
    }
  }
}

async function main() {
  assert(existsSync(nextServer), "Run `pnpm build` before this verification.");

  const adminPageRoot = path.join(nextServer, "app", "admin", "(protected)");
  const adminPages = walk(adminPageRoot).filter((file) =>
    file.endsWith(`${path.sep}page.js`),
  );
  assert(adminPages.length > 0, "No protected admin route bundles were found.");

  const pollutedAdminPages = adminPages
    .map((pagePath) => ({
      pagePath,
      sharpChunks: loadedServerChunks(pagePath).filter((chunk) => {
        const chunkPath = path.join(root, ".next", chunk);
        return existsSync(chunkPath) && loadsSharp(chunkPath);
      }),
    }))
    .filter((page) => page.sharpChunks.length > 0);

  assert.deepEqual(
    pollutedAdminPages,
    [],
    `Protected admin routes still load sharp:\n${pollutedAdminPages
      .map((page) => path.relative(root, page.pagePath))
      .join("\n")}`,
  );

  const staticRoot = path.join(root, ".next", "static");
  const sharpClientBundles = walk(staticRoot).filter(
    (file) => file.endsWith(".js") && loadsSharp(file),
  );
  assert.deepEqual(
    sharpClientBundles,
    [],
    "A browser bundle contains the sharp external runtime.",
  );

  const uploadRouteTraces = [
    ".next/server/app/api/admin/media/route.js.nft.json",
    ".next/server/app/api/media/upload/route.js.nft.json",
  ];
  const uploadTraceSizesMb: number[] = [];
  for (const relativeTrace of uploadRouteTraces) {
    const tracePath = path.join(root, relativeTrace);
    assert(existsSync(tracePath), `Missing upload trace: ${relativeTrace}`);
    const routePath = tracePath.replace(/\.nft\.json$/, "");
    const eagerSharpChunks = loadedServerChunks(routePath).filter((chunk) => {
      const chunkPath = path.join(root, ".next", chunk);
      return existsSync(chunkPath) && loadsSharp(chunkPath);
    });
    assert.deepEqual(
      eagerSharpChunks,
      [],
      `${relativeTrace} eagerly loads sharp before the upload handler runs.`,
    );

    const files = traceFiles(tracePath);
    const isNextInternalSharp = (file: string) =>
      file.includes("/node_modules/next/node_modules/@img/");
    const applicationSharpBinaries = files.filter(
      (file) =>
        file.includes("@img/sharp-linux-x64") &&
        file.endsWith(".node") &&
        !isNextInternalSharp(file),
    );
    assert(
      applicationSharpBinaries.length > 0,
      `${relativeTrace} does not include the Linux x64 sharp binary.`,
    );
    const applicationLibvipsFiles = files.filter(
      (file) =>
        file.includes("@img/sharp-libvips-linux-x64") &&
        file.includes("libvips-cpp.so") &&
        !isNextInternalSharp(file),
    );
    const applicationLibvipsRealPaths = new Set(
      applicationLibvipsFiles.map((file) =>
        realpathSync(path.resolve(path.dirname(tracePath), file)),
      ),
    );
    assert.equal(
      applicationLibvipsRealPaths.size,
      1,
      `${relativeTrace} must contain exactly one application Linux x64 libvips shared library, not ${applicationLibvipsRealPaths.size}.`,
    );

    const traceSizeMb =
      files.reduce((total, file) => {
        const absolutePath = path.resolve(path.dirname(tracePath), file);
        return total + (existsSync(absolutePath) ? statSync(absolutePath).size : 0);
      }, 0) /
      (1024 * 1024);
    uploadTraceSizesMb.push(traceSizeMb);
    assert(
      traceSizeMb < 200,
      `${relativeTrace} is ${traceSizeMb.toFixed(2)} MB before the Vercel runtime layer.`,
    );
  }

  const sharpModule = await import("sharp");
  const sharp = sharpModule.default;
  const result = await sharp({
    create: {
      width: 2,
      height: 2,
      channels: 4,
      background: { r: 197, g: 124, b: 54, alpha: 1 },
    },
  })
    .webp()
    .toBuffer({ resolveWithObject: true });

  assert.equal(result.info.format, "webp");
  assert(result.data.byteLength > 0);
  const verifiedLocalRoutes = await verifyAdminRoutes();

  console.log(
    JSON.stringify({
      platform: process.platform,
      arch: process.arch,
      sharp: sharp.versions.sharp,
      vips: sharp.versions.vips,
      encodedBytes: result.data.byteLength,
      protectedAdminPagesWithoutSharp: adminPages.length,
      lazyUploadRoutesWithLinuxRuntime: uploadRouteTraces.length,
      largestUploadTraceMb: Number(Math.max(...uploadTraceSizesMb).toFixed(2)),
      verifiedLocalRoutes,
    }),
  );
}

void main();
