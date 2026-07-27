import { z } from "zod";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  guestbookMessageInputSchema,
  NOTE_COLOR_KEYS,
} from "@/lib/garden-validation";
import {
  assertSameOrigin,
  enforceWriteRateLimit,
  getRequestMetadata,
} from "@/lib/security";

const htmlTagPattern = /<\s*\/?\s*[a-z][^>]*>/i;
const publicGuestbookSchema = guestbookMessageInputSchema.superRefine(
  (value, context) => {
    for (const key of ["nickname", "content"] as const) {
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

async function guestbookEnabled() {
  const setting = await db.siteSetting.findUnique({
    where: { key: "guestbookEnabled" },
    select: { value: true },
  });
  return setting?.value.trim().toLocaleLowerCase("en-US") !== "false";
}

function noteColorFor(nickname: unknown, content: unknown) {
  const seed = `${typeof nickname === "string" ? nickname : ""}:${
    typeof content === "string" ? content : ""
  }`;
  const total = Array.from(seed).reduce(
    (sum, character) => sum + (character.codePointAt(0) ?? 0),
    0,
  );
  return NOTE_COLOR_KEYS[total % NOTE_COLOR_KEYS.length];
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
  console.error("guestbook_api_error", error);
  return NextResponse.json(
    { ok: false, message: "留言提交失败，请稍后重试。" },
    { status: 500 },
  );
}

export async function POST(request: Request) {
  try {
    await assertSameOrigin(request);
    if (!(await guestbookEnabled())) {
      throw new PublicApiError(403, "留言墙当前已关闭。");
    }

    const payload = await requireJsonObject(request);
    const input = publicGuestbookSchema.parse({
      nickname: payload.nickname,
      content: payload.content,
      website: payload.website,
      company: payload.company,
      colorKey: noteColorFor(payload.nickname, payload.content),
    });

    const metadata = await getRequestMetadata();
    await enforceWriteRateLimit({
      key: `guestbook:${metadata.ipHash}`,
      limit: 3,
      windowMs: 60 * 60 * 1000,
    });

    await db.guestbookMessage.create({
      data: {
        nickname: input.nickname,
        content: input.content,
        website: input.website,
        colorKey: input.colorKey,
        status: "PENDING",
        ipHash: metadata.ipHash,
        userAgent: metadata.userAgent,
      },
    });

    return NextResponse.json(
      { ok: true, message: "留言已提交，审核通过后会显示。" },
      { status: 202 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
