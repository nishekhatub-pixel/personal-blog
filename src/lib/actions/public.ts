"use server";

import { CommentStatus, ContentStatus, SubscriberStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { assertSameOrigin, enforceWriteRateLimit, getRequestMetadata } from "@/lib/security";
import { commentSchema, contactSchema, stringValue, subscribeSchema } from "@/lib/validation";

export type PublicActionResult = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

function invalidResult(error: { flatten(): { fieldErrors: Record<string, string[]> } }): PublicActionResult {
  return {
    ok: false,
    message: "请检查表单中的内容。",
    fieldErrors: error.flatten().fieldErrors,
  };
}

async function featureEnabled(key: "commentsEnabled" | "newsletterEnabled") {
  const setting = await db.siteSetting.findUnique({ where: { key }, select: { value: true } });
  return setting?.value.trim().toLocaleLowerCase("en-US") !== "false";
}

export async function createComment(formData: FormData): Promise<PublicActionResult> {
  try {
    await assertSameOrigin();
    if (!(await featureEnabled("commentsEnabled"))) {
      return { ok: false, message: "评论功能当前已关闭。" };
    }
    const parsed = commentSchema.safeParse({
      postId: stringValue(formData, "postId"),
      parentId: stringValue(formData, "parentId"),
      authorName: stringValue(formData, "authorName"),
      email: stringValue(formData, "email"),
      content: stringValue(formData, "content"),
      website: stringValue(formData, "website"),
    });
    if (!parsed.success) return invalidResult(parsed.error);

    const metadata = await getRequestMetadata();
    await enforceWriteRateLimit({
      key: `comment:${metadata.ipHash}`,
      limit: 5,
      windowMs: 10 * 60 * 1000,
    });

    const post = await db.post.findFirst({
      where: { id: parsed.data.postId, status: ContentStatus.PUBLISHED },
      select: { id: true },
    });
    if (!post) return { ok: false, message: "文章不存在或尚未发布。" };

    if (parsed.data.parentId) {
      const parent = await db.comment.findFirst({
        where: { id: parsed.data.parentId, postId: post.id },
        select: { id: true },
      });
      if (!parent) return { ok: false, message: "回复的评论不存在。" };
    }

    await db.comment.create({
      data: {
        postId: post.id,
        parentId: parsed.data.parentId,
        authorName: parsed.data.authorName,
        email: parsed.data.email,
        content: parsed.data.content,
        status: CommentStatus.PENDING,
        ipHash: metadata.ipHash,
        userAgent: metadata.userAgent,
      },
    });
    return { ok: true, message: "评论已提交，审核通过后会显示。" };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "评论提交失败，请稍后重试。" };
  }
}

export async function subscribe(formData: FormData): Promise<PublicActionResult> {
  try {
    await assertSameOrigin();
    if (!(await featureEnabled("newsletterEnabled"))) {
      return { ok: false, message: "邮件订阅当前已关闭。" };
    }
    const parsed = subscribeSchema.safeParse({
      email: stringValue(formData, "email"),
      company: stringValue(formData, "company"),
    });
    if (!parsed.success) return invalidResult(parsed.error);

    const metadata = await getRequestMetadata();
    await enforceWriteRateLimit({
      key: `subscribe:${metadata.ipHash}`,
      limit: 4,
      windowMs: 60 * 60 * 1000,
    });
    await db.subscriber.upsert({
      where: { email: parsed.data.email },
      create: { email: parsed.data.email, ipHash: metadata.ipHash },
      update: { status: SubscriberStatus.ACTIVE, ipHash: metadata.ipHash },
    });
    return { ok: true, message: "订阅成功，新的学习记录会发送到你的邮箱。" };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "订阅失败，请稍后重试。" };
  }
}

export async function contact(formData: FormData): Promise<PublicActionResult> {
  try {
    await assertSameOrigin();
    const parsed = contactSchema.safeParse({
      name: stringValue(formData, "name"),
      email: stringValue(formData, "email"),
      subject: stringValue(formData, "subject"),
      message: stringValue(formData, "message"),
      website: stringValue(formData, "website"),
    });
    if (!parsed.success) return invalidResult(parsed.error);

    const metadata = await getRequestMetadata();
    await enforceWriteRateLimit({
      key: `contact:${metadata.ipHash}`,
      limit: 3,
      windowMs: 60 * 60 * 1000,
    });
    await db.contactMessage.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        subject: parsed.data.subject,
        message: parsed.data.message,
        ipHash: metadata.ipHash,
      },
    });
    return { ok: true, message: "消息已经安全送达，我会尽快回复。" };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "发送失败，请稍后重试。" };
  }
}
