import { z } from "zod";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { momentCommentInputSchema } from "@/lib/garden-validation";
import {
  assertSameOrigin,
  enforceWriteRateLimit,
  getRequestMetadata,
} from "@/lib/security";

const htmlTagPattern = /<\s*\/?\s*[a-z][^>]*>/i;
const publicMomentCommentSchema = momentCommentInputSchema.superRefine(
  (value, context) => {
    for (const key of ["authorName", "content"] as const) {
      if (htmlTagPattern.test(value[key])) {
        context.addIssue({
          code: "custom",
          path: [key],
          message: "仅支持纯文本内容",
        });
      }
    }
  },
);

class PublicApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function requireJsonObject(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLocaleLowerCase("en-US").includes("application/json")) {
    throw new PublicApiError(415, "请使用 application/json 提交。");
  }
  let value: unknown;
  try {
    value = await request.json();
  } catch {
    throw new PublicApiError(400, "请求内容不是有效的 JSON。");
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new PublicApiError(400, "请求内容必须是 JSON 对象。");
  }
  return value as Record<string, unknown>;
}

async function commentsEnabled() {
  const setting = await db.siteSetting.findUnique({
    where: { key: "commentsEnabled" },
    select: { value: true },
  });
  return setting?.value.trim().toLocaleLowerCase("en-US") !== "false";
}

function apiErrorResponse(error: unknown) {
  if (error instanceof PublicApiError) {
    return NextResponse.json({ ok: false, message: error.message }, { status: error.status });
  }
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        ok: false,
        message: "请检查提交内容。",
        fieldErrors: error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }
  const message = error instanceof Error ? error.message : "";
  if (message.includes("来源") || message.includes("信任")) {
    return NextResponse.json(
      { ok: false, message: "请求来源不受信任。" },
      { status: 403 },
    );
  }
  if (message.includes("频繁")) {
    return NextResponse.json(
      { ok: false, message: "提交过于频繁，请稍后再试。" },
      { status: 429 },
    );
  }
  console.error("moment_comment_api_error", error);
  return NextResponse.json(
    { ok: false, message: "评论提交失败，请稍后重试。" },
    { status: 500 },
  );
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await assertSameOrigin(request);
    if (!(await commentsEnabled())) {
      throw new PublicApiError(403, "评论功能当前已关闭。");
    }

    const { id } = await context.params;
    const payload = await requireJsonObject(request);
    const input = publicMomentCommentSchema.parse({
      momentId: id,
      parentId: payload.parentId,
      authorName: payload.authorName,
      email: payload.email,
      content: payload.content,
      website: payload.website,
    });

    const metadata = await getRequestMetadata();
    await enforceWriteRateLimit({
      key: `moment-comment:${metadata.ipHash}`,
      limit: 5,
      windowMs: 10 * 60 * 1000,
    });

    const moment = await db.moment.findFirst({
      where: {
        id: input.momentId,
        status: "PUBLISHED",
        publishedAt: { lte: new Date() },
      },
      select: { id: true },
    });
    if (!moment) throw new PublicApiError(404, "说说不存在或尚未发布。");

    if (input.parentId) {
      const parent = await db.momentComment.findFirst({
        where: {
          id: input.parentId,
          momentId: moment.id,
          status: "APPROVED",
        },
        select: { id: true },
      });
      if (!parent) {
        throw new PublicApiError(400, "回复的评论不存在或尚未通过审核。");
      }
    }

    await db.momentComment.create({
      data: {
        momentId: moment.id,
        parentId: input.parentId,
        authorName: input.authorName,
        email: input.email,
        content: input.content,
        status: "PENDING",
        ipHash: metadata.ipHash,
        userAgent: metadata.userAgent,
      },
    });

    return NextResponse.json(
      { ok: true, message: "评论已提交，审核通过后会显示。" },
      { status: 202 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
