import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const uploadRoot = path.resolve(process.cwd(), "public", "uploads");
const uuidWebpPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}-([1-9]\d{0,3})\.webp$/i;

function resolveImagePath(segments: string[]) {
  if (segments.length !== 3) return null;
  const [year, month, filename] = segments;
  if (!/^\d{4}$/.test(year) || !/^(0[1-9]|1[0-2])$/.test(month)) {
    return null;
  }

  const match = uuidWebpPattern.exec(filename);
  const width = Number(match?.[1] ?? 0);
  if (!match || width > 2000) return null;

  const target = path.resolve(uploadRoot, year, month, filename);
  const relative = path.relative(uploadRoot, target);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    return null;
  }
  return target;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const target = resolveImagePath((await context.params).path);
  if (!target) {
    return NextResponse.json({ error: "图片路径无效。" }, { status: 400 });
  }

  try {
    const image = await readFile(target);
    return new Response(image, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": String(image.byteLength),
        "Content-Type": "image/webp",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String(error.code)
        : "";
    if (code === "ENOENT") {
      return NextResponse.json({ error: "图片不存在。" }, { status: 404 });
    }
    return NextResponse.json({ error: "图片暂时无法读取。" }, { status: 500 });
  }
}
