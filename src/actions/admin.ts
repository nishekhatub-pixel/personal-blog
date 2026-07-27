"use server";

import { CommentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authenticateCredentials, createSession, destroySession, requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  assertSameOrigin,
  getRequestMetadata,
  hashIp,
  normalizeEmail,
  safeRedirectPath,
} from "@/lib/security";
import {
  categorySchema,
  checkbox,
  identifierSchema,
  postSchema,
  projectSchema,
  siteSettingsSchema,
  stringList,
  stringValue,
  tagSchema,
} from "@/lib/validation";

function refreshContent() {
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath("/archive");
  revalidatePath("/categories");
  revalidatePath("/tags");
  revalidatePath("/projects");
  revalidatePath("/search");
  revalidatePath("/rss.xml");
}

function requiredId(formData: FormData) {
  return identifierSchema.parse(stringValue(formData, "id"));
}

function postInput(formData: FormData) {
  return postSchema.parse({
    title: stringValue(formData, "title"),
    slug: stringValue(formData, "slug"),
    excerpt: stringValue(formData, "excerpt"),
    content: stringValue(formData, "content"),
    coverImage: stringValue(formData, "coverImage"),
    coverAlt: stringValue(formData, "coverAlt"),
    status: stringValue(formData, "status") || "DRAFT",
    featured: checkbox(formData, "featured"),
    readingMinutes: Number(stringValue(formData, "readingMinutes") || 5),
    seoTitle: stringValue(formData, "seoTitle"),
    seoDescription: stringValue(formData, "seoDescription"),
    categoryId: stringValue(formData, "categoryId"),
    tagIds: stringList(formData, "tagIds"),
  });
}

function projectInput(formData: FormData) {
  const technology = stringValue(formData, "technology");
  const gallery = stringValue(formData, "gallery");
  return projectSchema.parse({
    title: stringValue(formData, "title"),
    slug: stringValue(formData, "slug"),
    summary: stringValue(formData, "summary"),
    body: stringValue(formData, "body"),
    coverImage: stringValue(formData, "coverImage"),
    coverAlt: stringValue(formData, "coverAlt"),
    gallery: gallery.split(/\r?\n/).map((item) => item.trim()).filter(Boolean),
    technologies: technology.split(/[,\r\n，]+/).map((item) => item.trim()).filter(Boolean),
    demoUrl: stringValue(formData, "demoUrl"),
    sourceUrl: stringValue(formData, "sourceUrl"),
    status: stringValue(formData, "status") || "DRAFT",
    featured: checkbox(formData, "featured"),
    seoTitle: stringValue(formData, "seoTitle"),
    seoDescription: stringValue(formData, "seoDescription"),
    tagIds: stringList(formData, "tagIds"),
  });
}

export async function loginAction(formData: FormData): Promise<void> {
  await assertSameOrigin();
  const email = normalizeEmail(stringValue(formData, "email"));
  const password = stringValue(formData, "password");
  const next = safeRedirectPath(formData.get("next"));
  const metadata = await getRequestMetadata();
  const attemptKey = `login:${hashIp(`${metadata.ipHash}:${email}`)}`;
  const since = new Date(Date.now() - 15 * 60 * 1000);
  const failedCount = await db.loginAttempt.count({
    where: { key: attemptKey, succeeded: false, createdAt: { gte: since } },
  });
  if (failedCount >= 5) {
    redirect("/admin/login?error=too-many-attempts");
  }

  const user = await authenticateCredentials(email, password);
  await db.loginAttempt.create({ data: { key: attemptKey, succeeded: Boolean(user) } });
  if (!user) redirect("/admin/login?error=invalid-credentials");

  await createSession(user.id);
  redirect(next);
}

export async function logoutAction() {
  await assertSameOrigin();
  await destroySession();
  redirect("/admin/login");
}

export async function createPost(formData: FormData) {
  await assertSameOrigin();
  await requireAdmin();
  const input = postInput(formData);
  const { tagIds, ...data } = input;
  const post = await db.post.create({
    data: {
      ...data,
      publishedAt: data.status === "PUBLISHED" ? new Date() : null,
      tags: { create: tagIds.map((tagId) => ({ tagId })) },
    },
  });
  refreshContent();
  redirect(`/admin/posts/${post.id}/edit?created=1`);
}

export async function updatePost(formData: FormData) {
  await assertSameOrigin();
  await requireAdmin();
  const id = requiredId(formData);
  const input = postInput(formData);
  const existing = await db.post.findUniqueOrThrow({ where: { id }, select: { publishedAt: true } });
  const { tagIds, ...data } = input;
  await db.post.update({
    where: { id },
    data: {
      ...data,
      publishedAt: data.status === "PUBLISHED" ? (existing.publishedAt ?? new Date()) : existing.publishedAt,
      tags: {
        deleteMany: {},
        create: tagIds.map((tagId) => ({ tagId })),
      },
    },
  });
  refreshContent();
  revalidatePath(`/blog/${data.slug}`);
  redirect(`/admin/posts/${id}/edit?saved=1`);
}

export async function deletePost(formData: FormData) {
  await assertSameOrigin();
  await requireAdmin();
  await db.post.delete({ where: { id: requiredId(formData) } });
  refreshContent();
  revalidatePath("/admin/posts");
}

export async function createCategory(formData: FormData) {
  await assertSameOrigin();
  await requireAdmin();
  const data = categorySchema.parse({
    name: stringValue(formData, "name"),
    slug: stringValue(formData, "slug"),
    description: stringValue(formData, "description"),
  });
  await db.category.create({ data });
  revalidatePath("/admin/categories");
  refreshContent();
}

export async function updateCategory(formData: FormData) {
  await assertSameOrigin();
  await requireAdmin();
  const id = requiredId(formData);
  const data = categorySchema.parse({
    name: stringValue(formData, "name"),
    slug: stringValue(formData, "slug"),
    description: stringValue(formData, "description"),
  });
  await db.category.update({ where: { id }, data });
  revalidatePath("/admin/categories");
  refreshContent();
}

export async function deleteCategory(formData: FormData) {
  await assertSameOrigin();
  await requireAdmin();
  const id = requiredId(formData);
  const postCount = await db.post.count({ where: { categoryId: id } });
  if (postCount > 0) throw new Error("该分类仍有关联文章，不能删除。");
  await db.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
  refreshContent();
}

export async function createTag(formData: FormData) {
  await assertSameOrigin();
  await requireAdmin();
  const data = tagSchema.parse({ name: stringValue(formData, "name"), slug: stringValue(formData, "slug") });
  await db.tag.create({ data });
  revalidatePath("/admin/tags");
  refreshContent();
}

export async function updateTag(formData: FormData) {
  await assertSameOrigin();
  await requireAdmin();
  const id = requiredId(formData);
  const data = tagSchema.parse({ name: stringValue(formData, "name"), slug: stringValue(formData, "slug") });
  await db.tag.update({ where: { id }, data });
  revalidatePath("/admin/tags");
  refreshContent();
}

export async function deleteTag(formData: FormData) {
  await assertSameOrigin();
  await requireAdmin();
  await db.tag.delete({ where: { id: requiredId(formData) } });
  revalidatePath("/admin/tags");
  refreshContent();
}

export async function createProject(formData: FormData) {
  await assertSameOrigin();
  await requireAdmin();
  const input = projectInput(formData);
  const { gallery, technologies, tagIds, ...data } = input;
  const project = await db.project.create({
    data: {
      ...data,
      galleryJson: JSON.stringify(gallery),
      technologyJson: JSON.stringify(technologies),
      publishedAt: data.status === "PUBLISHED" ? new Date() : null,
      tags: { create: tagIds.map((tagId) => ({ tagId })) },
    },
  });
  refreshContent();
  redirect(`/admin/projects/${project.id}/edit?created=1`);
}

export async function updateProject(formData: FormData) {
  await assertSameOrigin();
  await requireAdmin();
  const id = requiredId(formData);
  const input = projectInput(formData);
  const existing = await db.project.findUniqueOrThrow({ where: { id }, select: { publishedAt: true } });
  const { gallery, technologies, tagIds, ...data } = input;
  await db.project.update({
    where: { id },
    data: {
      ...data,
      galleryJson: JSON.stringify(gallery),
      technologyJson: JSON.stringify(technologies),
      publishedAt: data.status === "PUBLISHED" ? (existing.publishedAt ?? new Date()) : existing.publishedAt,
      tags: { deleteMany: {}, create: tagIds.map((tagId) => ({ tagId })) },
    },
  });
  refreshContent();
  revalidatePath(`/projects/${data.slug}`);
  redirect(`/admin/projects/${id}/edit?saved=1`);
}

export async function deleteProject(formData: FormData) {
  await assertSameOrigin();
  await requireAdmin();
  await db.project.delete({ where: { id: requiredId(formData) } });
  refreshContent();
  revalidatePath("/admin/projects");
}

export async function moderateComment(formData: FormData) {
  await assertSameOrigin();
  await requireAdmin();
  const id = requiredId(formData);
  const status = CommentStatus[stringValue(formData, "status") as keyof typeof CommentStatus];
  if (!status) throw new Error("评论状态无效。");
  await db.comment.update({ where: { id }, data: { status } });
  revalidatePath("/admin/comments");
  refreshContent();
}

export async function deleteComment(formData: FormData) {
  await assertSameOrigin();
  await requireAdmin();
  await db.comment.delete({ where: { id: requiredId(formData) } });
  revalidatePath("/admin/comments");
  refreshContent();
}

export async function updateSettings(formData: FormData) {
  await assertSameOrigin();
  await requireAdmin();
  const settings = siteSettingsSchema.parse({
    siteTitle: stringValue(formData, "siteTitle"),
    siteDescription: stringValue(formData, "siteDescription"),
    siteUrl: stringValue(formData, "siteUrl"),
    authorName: stringValue(formData, "authorName"),
    authorBio: stringValue(formData, "authorBio"),
    contactEmail: stringValue(formData, "contactEmail"),
    githubUrl: stringValue(formData, "githubUrl"),
    nowText: stringValue(formData, "nowText"),
    footerNote: stringValue(formData, "footerNote"),
    commentsEnabled: checkbox(formData, "commentsEnabled"),
    newsletterEnabled: checkbox(formData, "newsletterEnabled"),
    siteName: stringValue(formData, "siteName"),
    siteSubtitle: stringValue(formData, "siteSubtitle"),
    profileName: stringValue(formData, "profileName"),
    profileBio: stringValue(formData, "profileBio"),
    profileAvatar: stringValue(formData, "profileAvatar"),
    siteLaunchDate: stringValue(formData, "siteLaunchDate"),
    noticeText: stringValue(formData, "noticeText"),
    locationName: stringValue(formData, "locationName"),
    latitude: stringValue(formData, "latitude"),
    longitude: stringValue(formData, "longitude"),
    timezone: stringValue(formData, "timezone"),
    weatherEnabled: checkbox(formData, "weatherEnabled"),
    petalsEnabled: checkbox(formData, "petalsEnabled"),
    petalsDensity: stringValue(formData, "petalsDensity") || "low",
    email: stringValue(formData, "email"),
    musicEnabled: checkbox(formData, "musicEnabled"),
    guestbookEnabled: checkbox(formData, "guestbookEnabled"),
    friendsEnabled: checkbox(formData, "friendsEnabled"),
  });
  const groups: Record<string, string> = {
    siteTitle: "basic",
    siteDescription: "basic",
    siteUrl: "basic",
    siteName: "basic",
    siteSubtitle: "basic",
    footerNote: "basic",
    authorName: "profile",
    authorBio: "profile",
    profileName: "profile",
    profileBio: "profile",
    profileAvatar: "profile",
    nowText: "profile",
    siteLaunchDate: "location",
    noticeText: "location",
    locationName: "location",
    latitude: "location",
    longitude: "location",
    timezone: "location",
    weatherEnabled: "location",
    petalsEnabled: "appearance",
    petalsDensity: "appearance",
    musicEnabled: "music",
    commentsEnabled: "interactions",
    newsletterEnabled: "interactions",
    guestbookEnabled: "interactions",
    friendsEnabled: "interactions",
    githubUrl: "social",
    email: "social",
    contactEmail: "social",
  };
  const entries = Object.entries(settings).map(([key, value]) => ({
    key,
    value: value === null ? "" : String(value),
    group: groups[key] ?? "general",
  }));
  await db.$transaction(
    entries.map(({ key, value, group }) =>
      db.siteSetting.upsert({
        where: { key },
        create: { key, value, group },
        update: { value, group },
      }),
    ),
  );
  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
  revalidatePath("/photos");
  revalidatePath("/music");
  revalidatePath("/moments");
  revalidatePath("/guestbook");
  revalidatePath("/friends");
  revalidatePath("/about");
  revalidatePath("/calendar");
  revalidatePath("/api/weather");
  revalidatePath("/sitemap.xml");
  refreshContent();
}
