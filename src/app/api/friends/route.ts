import { Prisma } from "@prisma/client";
import { z } from "zod";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { friendLinkInputSchema } from "@/lib/garden-validation";
import {
  assertSameOrigin,
  enforceWriteRateLimit,
  getRequestMetadata,
} from "@/lib/security";

const htmlTagPattern = /<\s*\/?\s*[a-z][^>]*>/i;
const honeypotSchema = z.object({
  company: z.string().max(0).optional(),
}).passthrough();
const publicFriendSchema = friendLinkInputSchema.superRefine((value, context) => {
  const fields = [
    ["name", value.name],
    ["description", value.description],
    ["contact", value.contact],
    ...value.tags.map((tag, index) => [`tags.${index}`, tag]),
  ] as Array<[string, string | null]>;

  for (const [path, text] of fields) {
    if (text && htmlTagPattern.test(text)) {
      context.addIssue({
        code: "custom",
        path: path.split(".").map((part) => (/^\d+$/.test(part) ? Number(part) : part)),
        message: "仅支持纯文本内容",
      });
    }
  }
});

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

async function friendsEnabled() {
  const setting = await db.siteSetting.findUnique({
    where: { key: "friendsEnabled" },
    select: { value: true },
  });
  return setting?.value.trim().toLocaleLowerCase("en-US") !== "false";
}

function tagsFrom(value: unknown) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    return value
      .split(/[,，\r\n]+/)
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return [];
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
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return NextResponse.json(
      { ok: false, message: "这个站点已经提交过，请勿重复申请。" },
      { status: 409 },
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
  console.error("friend_application_api_error", error);
  return NextResponse.json(
    { ok: false, message: "友链申请提交失败，请稍后重试。" },
    { status: 500 },
  );
}

export async function POST(request: Request) {
  try {
    await assertSameOrigin(request);
    if (!(await friendsEnabled())) {
      throw new PublicApiError(403, "友链申请当前已关闭。");
    }

    const payload = await requireJsonObject(request);
    honeypotSchema.parse(payload);
    const input = publicFriendSchema.parse({
      name: payload.name,
      url: payload.url,
      description: payload.description,
      avatarUrl: payload.avatarUrl,
      contact: payload.contact,
      tags: tagsFrom(payload.tags),
      featured: false,
      position: 0,
      status: "DRAFT",
      publishedAt: null,
    });

    const metadata = await getRequestMetadata();
    await enforceWriteRateLimit({
      key: `friend-application:${metadata.ipHash}`,
      limit: 2,
      windowMs: 24 * 60 * 60 * 1000,
    });

    const duplicate = await db.friendLink.findUnique({
      where: { url: input.url },
      select: { id: true },
    });
    if (duplicate) {
      throw new PublicApiError(409, "这个站点已经提交过，请勿重复申请。");
    }

    await db.friendLink.create({
      data: {
        name: input.name,
        url: input.url,
        description: input.description,
        avatarUrl: input.avatarUrl,
        contact: input.contact,
        tagsJson: JSON.stringify(input.tags),
        featured: false,
        position: 0,
        status: "DRAFT",
        publishedAt: null,
      },
    });

    return NextResponse.json(
      { ok: true, message: "友链申请已提交，审核后会出现在友链页。" },
      { status: 202 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
