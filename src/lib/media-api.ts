import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
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

    const formData = await request.formData();
    const file = formData.get("file");
    const alt = formData.get("alt");
    if (!(file instanceof File)) return NextResponse.json({ error: "请选择图片文件。" }, { status: 400 });
    const { processMediaUpload } = await import("@/lib/uploads");
    const media = await processMediaUpload(file, typeof alt === "string" ? alt : "");
    return NextResponse.json({ media }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "上传失败。";
    return NextResponse.json({ error: message }, { status: message.includes("来源") ? 403 : 400 });
  }
}
