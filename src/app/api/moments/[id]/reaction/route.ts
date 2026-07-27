import { z } from "zod";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { momentReactionInputSchema } from "@/lib/garden-validation";
import {
  assertSameOrigin,
  enforceWriteRateLimit,
  getRequestMetadata,
  hashVisitorToken,
  newVisitorToken,
} from "@/lib/security";

const VISITOR_COOKIE = "r7_visitor";
const visitorTokenPattern = /^[A-Za-z0-9_-]{43}$/;
const honeypotSchema = z.object({
  company: z.string().max(0).optional(),
}).passthrough();

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

function visitorTokenFrom(request: Request) {
  const cookie = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${VISITOR_COOKIE}=`))
    ?.slice(VISITOR_COOKIE.length + 1);
  if (!cookie) return null;
  try {
    const value = decodeURIComponent(cookie);
    return visitorTokenPattern.test(value) ? value : null;
  } catch {
    return null;
  }
}

function apiErrorResponse(error: unknown) {
  if (error instanceof PublicApiError) {
    return NextResponse.json({ ok: false, message: error.message }, { status: error.status });
  }
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { ok: false, message: "请求内容无效。" },
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
      { ok: false, message: "操作过于频繁，请稍后再试。" },
      { status: 429 },
    );
  }
  console.error("moment_reaction_api_error", error);
  return NextResponse.json(
    { ok: false, message: "操作失败，请稍后重试。" },
    { status: 500 },
  );
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await assertSameOrigin(request);

    const payload = await requireJsonObject(request);
    honeypotSchema.parse(payload);
    const { id } = await context.params;
    const input = momentReactionInputSchema.parse({ momentId: id });

    const metadata = await getRequestMetadata();
    await enforceWriteRateLimit({
      key: `moment-reaction:${metadata.ipHash}`,
      limit: 30,
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

    const existingVisitorToken = visitorTokenFrom(request);
    const visitorToken = existingVisitorToken ?? newVisitorToken();
    const visitorHash = hashVisitorToken(visitorToken);
    const result = await db.$transaction(async (transaction) => {
      const existing = await transaction.momentReaction.findUnique({
        where: {
          momentId_visitorHash: {
            momentId: moment.id,
            visitorHash,
          },
        },
        select: { id: true },
      });

      let reacted: boolean;
      if (existing) {
        await transaction.momentReaction.deleteMany({
          where: { id: existing.id, visitorHash },
        });
        reacted = false;
      } else {
        await transaction.momentReaction.upsert({
          where: {
            momentId_visitorHash: {
              momentId: moment.id,
              visitorHash,
            },
          },
          create: { momentId: moment.id, visitorHash },
          update: {},
        });
        reacted = true;
      }

      const count = await transaction.momentReaction.count({
        where: { momentId: moment.id },
      });
      return { count, reacted };
    });

    const response = NextResponse.json({ ok: true, ...result });
    if (!existingVisitorToken) {
      response.cookies.set({
        name: VISITOR_COOKIE,
        value: visitorToken,
        httpOnly: true,
        sameSite: "lax",
        secure: new URL(env.APP_URL).protocol === "https:",
        path: "/",
        maxAge: 365 * 24 * 60 * 60,
      });
    }
    return response;
  } catch (error) {
    return apiErrorResponse(error);
  }
}
