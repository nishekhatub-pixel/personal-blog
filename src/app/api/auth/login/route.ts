import { z } from "zod";
import { NextResponse } from "next/server";
import { authenticateCredentials, createSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { assertSameOrigin, getRequestMetadata, hashIp, normalizeEmail } from "@/lib/security";

const loginSchema = z.object({
  email: z.string().trim().email().max(191),
  password: z.string().min(8).max(200),
});

export async function POST(request: Request) {
  try {
    await assertSameOrigin(request);
    const parsed = loginSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "邮箱或密码格式不正确。" }, { status: 400 });

    const email = normalizeEmail(parsed.data.email);
    const metadata = await getRequestMetadata();
    const attemptKey = `login:${hashIp(`${metadata.ipHash}:${email}`)}`;
    const since = new Date(Date.now() - 15 * 60 * 1000);
    const failedCount = await db.loginAttempt.count({
      where: { key: attemptKey, succeeded: false, createdAt: { gte: since } },
    });
    if (failedCount >= 5) {
      return NextResponse.json(
        { error: "登录尝试过多，请 15 分钟后再试。" },
        { status: 429, headers: { "Retry-After": "900" } },
      );
    }

    const user = await authenticateCredentials(email, parsed.data.password);
    await db.loginAttempt.create({ data: { key: attemptKey, succeeded: Boolean(user) } });
    if (!user) return NextResponse.json({ error: "邮箱或密码不正确。" }, { status: 401 });

    await createSession(user.id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "登录失败。";
    return NextResponse.json({ error: message }, { status: message.includes("来源") ? 403 : 400 });
  }
}
