import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  cleanupOrphanedAudio,
  storeAudioUpload,
} from "@/lib/audio-uploads";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { assertSameOrigin } from "@/lib/security";

export const runtime = "nodejs";

function uploadErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("来源") || message.includes("信任")) {
    return NextResponse.json({ error: "请求来源不受信任。" }, { status: 403 });
  }
  if (
    message.includes("音频") ||
    message.includes("文件") ||
    message.includes("MIME") ||
    message.includes("签名") ||
    message.includes("扩展名")
  ) {
    return NextResponse.json(
      { error: message },
      { status: message.includes("不能超过") ? 413 : 400 },
    );
  }
  return NextResponse.json({ error: "音频上传失败，请稍后重试。" }, { status: 500 });
}

export async function POST(request: Request) {
  try {
    await assertSameOrigin(request);
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录。" }, { status: 401 });
    }
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "权限不足。" }, { status: 403 });
    }

    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.toLocaleLowerCase("en-US").startsWith("multipart/form-data")) {
      return NextResponse.json(
        { error: "请使用 multipart/form-data 上传本地音频文件。" },
        { status: 415 },
      );
    }

    const contentLength = Number(request.headers.get("content-length"));
    if (
      Number.isFinite(contentLength) &&
      contentLength > env.AUDIO_UPLOAD_MAX_BYTES + 1024 * 1024
    ) {
      return NextResponse.json(
        {
          error: `音频不能超过 ${Math.floor(
            env.AUDIO_UPLOAD_MAX_BYTES / 1024 / 1024,
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
    if (formData.has("url") || formData.has("audioUrl") || formData.has("proxyUrl")) {
      return NextResponse.json(
        { error: "此接口只接收本地音频文件，不代理远程链接。" },
        { status: 400 },
      );
    }

    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "请选择音频文件。" }, { status: 400 });
    }
    if (file.size > env.AUDIO_UPLOAD_MAX_BYTES) {
      return NextResponse.json(
        {
          error: `音频不能超过 ${Math.floor(
            env.AUDIO_UPLOAD_MAX_BYTES / 1024 / 1024,
          )} MB。`,
        },
        { status: 413 },
      );
    }

    const referencedTracks = await db.musicTrack.findMany({
      where: { sourceType: "UPLOAD" },
      select: { audioUrl: true },
    });
    try {
      await cleanupOrphanedAudio(
        new Set(referencedTracks.map((track) => track.audioUrl)),
      );
    } catch (error) {
      console.warn("audio_orphan_cleanup_failed", {
        actorId: user.id,
        error: error instanceof Error ? error.message : "unknown",
      });
    }

    const audio = await storeAudioUpload(file);
    return NextResponse.json({ audio }, { status: 201 });
  } catch (error) {
    return uploadErrorResponse(error);
  }
}
