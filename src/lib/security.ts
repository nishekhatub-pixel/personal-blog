import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function newSessionToken() {
  return randomBytes(32).toString("base64url");
}

export function normalizeEmail(email: string) {
  return email.trim().toLocaleLowerCase("en-US");
}

export function hashIp(ip: string) {
  return createHmac("sha256", env.IP_HASH_SECRET).update(ip).digest("hex");
}

export function newVisitorToken() {
  return randomBytes(32).toString("base64url");
}

export function hashVisitorToken(token: string) {
  return createHmac("sha256", env.IP_HASH_SECRET)
    .update(`r7-visitor:${token}`)
    .digest("hex");
}

export function requestIpFromHeaders(requestHeaders: Headers) {
  const realIp = requestHeaders.get("x-real-ip")?.trim();
  if (realIp) return realIp.slice(0, 128);

  const forwarded = requestHeaders
    .get("x-forwarded-for")
    ?.split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return (forwarded?.at(-1) ?? "unknown").slice(0, 128);
}

export async function getRequestIp() {
  const requestHeaders = await headers();
  return requestIpFromHeaders(requestHeaders);
}

export async function getRequestMetadata() {
  const requestHeaders = await headers();
  const ip = requestIpFromHeaders(requestHeaders);
  return {
    ipHash: hashIp(ip),
    userAgent: requestHeaders.get("user-agent")?.slice(0, 512) ?? null,
  };
}

export function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function assertSameOrigin(request?: Request) {
  const requestHeaders = request ? request.headers : await headers();
  const origin = requestHeaders.get("origin");
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  if (!origin || !host) {
    throw new Error("缺少来源信息，请刷新页面后重试。");
  }

  let originUrl: URL;
  try {
    originUrl = new URL(origin);
  } catch {
    throw new Error("请求来源无效。");
  }

  const configuredHost = new URL(env.APP_URL).host;
  const allowedHosts = new Set([host, configuredHost]);
  if (process.env.NODE_ENV !== "production" && LOOPBACK_HOSTS.has(originUrl.hostname)) {
    return;
  }
  if (!allowedHosts.has(originUrl.host)) {
    throw new Error("请求来源不受信任。");
  }
}

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

export async function enforceWriteRateLimit({ key, limit, windowMs }: RateLimitOptions) {
  const now = Date.now();
  const since = new Date(now - windowMs);
  const cleanupBefore = new Date(
    now - Math.max(24 * 60 * 60 * 1000, windowMs * 2),
  );

  await db.$transaction(async (transaction) => {
    const count = await transaction.loginAttempt.count({
      where: { key, createdAt: { gte: since } },
    });
    if (count >= limit) {
      throw new Error("操作过于频繁，请稍后再试。");
    }
    await transaction.loginAttempt.create({
      data: { key, succeeded: false },
    });

    // Roughly once an hour, trim old limiter rows while already inside a write
    // transaction. Cleanup is deliberately best-effort and never changes the
    // decision for the current request.
    if (Math.floor(now / 60_000) % 61 === 0) {
      await transaction.loginAttempt.deleteMany({
        where: { createdAt: { lt: cleanupBefore } },
      });
    }
  });
}

export function safeRedirectPath(value: FormDataEntryValue | null, fallback = "/admin") {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }
  return value;
}

export function isSafeExternalUrl(value: string | null | undefined) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || (process.env.NODE_ENV !== "production" && url.protocol === "http:");
  } catch {
    return false;
  }
}
