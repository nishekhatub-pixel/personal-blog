import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { assertSameOrigin } from "@/lib/security";

export async function listMediaResponse(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "未登录。" }, { status: 401 });
  const url = new URL(request.url);
  const page = Math.max(1, Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(50, Math.max(1, Number.parseInt(url.searchParams.get("pageSize") ?? "24", 10) || 24));
  const [items, total] = await db.$transaction([
    db.media.findMany({ orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
    db.media.count(),
  ]);
  return NextResponse.json({ items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
}

export async function uploadMediaResponse(request: Request) {
  try {
    await assertSameOrigin(request);
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "未登录。" }, { status: 401 });

    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.toLocaleLowerCase("en-US").startsWith("multipart/form-data")) {
      return NextResponse.json(
        { error: "请使用 multipart/form-data 上传本地图片文件。" },
        { status: 415 },
      );
    }
    const contentLength = Number(request.headers.get("content-length"));
    if (
      Number.isFinite(contentLength) &&
      contentLength > env.UPLOAD_MAX_BYTES + 1024 * 1024
    ) {
      return NextResponse.json(
        {
          error: `图片不能超过 ${Math.floor(
            env.UPLOAD_MAX_BYTES / 1024 / 1024,
          )} MB。`,
        },
        { status: 413 },
      );
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { error: "上传内容不是有效的 multipart 表单。" },
        { status: 400 },
      );
    }
    const file = formData.get("file");
    const alt = formData.get("alt");
    const requestedKind = formData.get("kind");
    const storageKind =
      requestedKind === "photos" ||
      requestedKind === "music" ||
      requestedKind === "avatars"
        ? requestedKind
        : "images";
    if (!(file instanceof File)) return NextResponse.json({ error: "请选择图片文件。" }, { status: 400 });
    const { processMediaUpload } = await import("@/lib/uploads");
    const media = await processMediaUpload(
      file,
      typeof alt === "string" ? alt : "",
      storageKind,
    );
    return NextResponse.json({ media }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "上传失败。";
    const status = message.includes("来源")
      ? 403
      : message.includes("不能超过")
        ? 413
        : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
