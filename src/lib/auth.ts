import { compare } from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { getRequestMetadata, hashToken, newSessionToken, normalizeEmail } from "@/lib/security";

const SESSION_COOKIE = "r7_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 14;
const SESSION_REFRESH_MS = 1000 * 60 * 60 * 24;
const sessionCookieIsSecure = new URL(env.APP_URL).protocol === "https:";

export async function authenticateCredentials(email: string, password: string) {
  const user = await db.user.findUnique({ where: { email: normalizeEmail(email) } });
  if (!user || !(await compare(password, user.passwordHash))) {
    return null;
  }
  return user;
}

export async function createSession(userId: string) {
  const token = newSessionToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  const metadata = await getRequestMetadata();

  await db.session.create({
    data: {
      tokenHash,
      userId,
      expiresAt,
      ipHash: metadata.ipHash,
      userAgent: metadata.userAgent,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: sessionCookieIsSecure,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });

  if (!session || session.expiresAt <= new Date()) {
    if (session) await db.session.delete({ where: { id: session.id } });
    cookieStore.delete(SESSION_COOKIE);
    return null;
  }

  if (Date.now() - session.lastSeenAt.getTime() > SESSION_REFRESH_MS) {
    await db.session.update({
      where: { id: session.id },
      data: { lastSeenAt: new Date() },
    });
  }

  return session.user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    redirect("/admin/login");
  }
  return user;
}

export async function purgeExpiredSessions() {
  return db.session.deleteMany({ where: { expiresAt: { lte: new Date() } } });
}
