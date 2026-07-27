import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

const publicPostInclude = {
  category: true,
  tags: { include: { tag: true } },
  _count: { select: { comments: { where: { status: "APPROVED" } } } },
} satisfies Prisma.PostInclude;

const publicProjectInclude = {
  tags: { include: { tag: true } },
} satisfies Prisma.ProjectInclude;

export type PublicPost = Prisma.PostGetPayload<{ include: typeof publicPostInclude }>;
export type PublicProject = Prisma.ProjectGetPayload<{ include: typeof publicProjectInclude }>;

export type PublishedPostQuery = {
  category?: string;
  tag?: string;
  query?: string;
  page?: number;
  pageSize?: number;
};

export type PublishedProjectQuery = {
  tag?: string;
  query?: string;
  page?: number;
  pageSize?: number;
};

function pageValues(page = 1, pageSize = 10) {
  const safePage = Number.isFinite(page) ? Math.max(1, Math.trunc(page)) : 1;
  const safeSize = Number.isFinite(pageSize) ? Math.min(50, Math.max(1, Math.trunc(pageSize))) : 10;
  return { page: safePage, pageSize: safeSize, skip: (safePage - 1) * safeSize };
}

export async function getSiteSettings() {
  const settings = await db.siteSetting.findMany({ orderBy: [{ group: "asc" }, { key: "asc" }] });
  const values = Object.fromEntries(settings.map((setting) => [setting.key, setting.value])) as Record<string, string>;
  const siteTitle = values.siteTitle ?? values["site.title"] ?? "R7 的数字花园";
  const siteDescription =
    values.siteDescription ??
    values["site.description"] ??
    "软件技术学生的学习记录、工程实践与作品。";
  const authorName = values.authorName ?? values["profile.name"] ?? "R7";
  const authorBio = values.authorBio ?? values["profile.bio"] ?? "";
  const rawGithubUrl = values.githubUrl ?? values["social.github"] ?? "";
  const githubUrl =
    /^https?:\/\/(?:www\.)?github\.com\/?$/i.test(rawGithubUrl.trim())
      ? ""
      : rawGithubUrl;
  const rawPublicEmail = values.email?.trim() ?? "";
  const publicEmail = /@example\.(?:com|net|org)$/i.test(rawPublicEmail)
    ? ""
    : rawPublicEmail;
  return {
    ...values,
    siteTitle,
    siteDescription,
    siteUrl: values.siteUrl ?? values["site.url"] ?? process.env.APP_URL ?? "http://localhost:3000",
    authorName,
    authorBio,
    contactEmail: values.contactEmail ?? values["contact.email"] ?? "",
    githubUrl,
    nowText: values.nowText ?? values["profile.now"] ?? "",
    siteName: values.siteName || siteTitle || "R7 Digital Garden",
    siteSubtitle:
      values.siteSubtitle ||
      siteDescription ||
      "一个软件技术专业学生的个人数字花园",
    profileName: values.profileName || authorName || "R7",
    profileBio: values.profileBio || authorBio,
    profileAvatar: values.profileAvatar ?? "",
    siteLaunchDate: values.siteLaunchDate ?? "",
    noticeText: values.noticeText ?? "",
    locationName: values.locationName ?? "",
    latitude: values.latitude ?? "",
    longitude: values.longitude ?? "",
    timezone: values.timezone || "Asia/Shanghai",
    weatherEnabled: values.weatherEnabled ?? "false",
    petalsEnabled: values.petalsEnabled ?? "true",
    petalsDensity: values.petalsDensity || "low",
    email: publicEmail,
    musicEnabled: values.musicEnabled ?? "true",
    guestbookEnabled: values.guestbookEnabled ?? "true",
    friendsEnabled: values.friendsEnabled ?? "true",
    commentsEnabled: values.commentsEnabled ?? "true",
    newsletterEnabled: values.newsletterEnabled ?? "true",
  };
}

export function getFeaturedPosts(limit = 4) {
  return db.post.findMany({
    where: { status: "PUBLISHED", featured: true, publishedAt: { lte: new Date() } },
    include: publicPostInclude,
    orderBy: [{ publishedAt: "desc" }],
    take: Math.min(12, Math.max(1, limit)),
  });
}

export function getFeaturedProjects(limit = 4) {
  return db.project.findMany({
    where: { status: "PUBLISHED", featured: true, publishedAt: { lte: new Date() } },
    include: publicProjectInclude,
    orderBy: [{ publishedAt: "desc" }],
    take: Math.min(12, Math.max(1, limit)),
  });
}

export async function getPublishedPosts(params: PublishedPostQuery = {}) {
  const { page, pageSize, skip } = pageValues(params.page, params.pageSize);
  const query = params.query?.trim().slice(0, 100);
  const where: Prisma.PostWhereInput = {
    status: "PUBLISHED",
    publishedAt: { lte: new Date() },
    ...(params.category ? { category: { slug: params.category } } : {}),
    ...(params.tag ? { tags: { some: { tag: { slug: params.tag } } } } : {}),
    ...(query
      ? {
          OR: [
            { title: { contains: query } },
            { excerpt: { contains: query } },
            { content: { contains: query } },
          ],
        }
      : {}),
  };
  const [items, total] = await db.$transaction([
    db.post.findMany({
      where,
      include: publicPostInclude,
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
      skip,
      take: pageSize,
    }),
    db.post.count({ where }),
  ]);
  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export function getPostBySlug(slug: string) {
  return db.post.findFirst({
    where: { slug, status: "PUBLISHED", publishedAt: { lte: new Date() } },
    include: {
      ...publicPostInclude,
      comments: {
        where: { status: "APPROVED", parentId: null },
        include: { replies: { where: { status: "APPROVED" }, orderBy: { createdAt: "asc" } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function getPostNeighbors(slug: string) {
  const current = await db.post.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: { id: true, publishedAt: true },
  });
  if (!current?.publishedAt) return { previous: null, next: null };

  const [previous, next] = await Promise.all([
    db.post.findFirst({
      where: { status: "PUBLISHED", publishedAt: { lt: current.publishedAt } },
      select: { title: true, slug: true, excerpt: true, publishedAt: true },
      orderBy: { publishedAt: "desc" },
    }),
    db.post.findFirst({
      where: { status: "PUBLISHED", publishedAt: { gt: current.publishedAt, lte: new Date() } },
      select: { title: true, slug: true, excerpt: true, publishedAt: true },
      orderBy: { publishedAt: "asc" },
    }),
  ]);
  return { previous, next };
}

export async function getRelatedPosts(postId: string, categoryId?: string, tagIds: string[] = [], limit = 3) {
  let resolvedCategory = categoryId;
  let resolvedTagIds = tagIds;
  if (!resolvedCategory) {
    const post = await db.post.findUnique({
      where: { id: postId },
      select: { categoryId: true, tags: { select: { tagId: true } } },
    });
    resolvedCategory = post?.categoryId;
    resolvedTagIds = post?.tags.map((tag) => tag.tagId) ?? [];
  }
  return db.post.findMany({
    where: {
      id: { not: postId },
      status: "PUBLISHED",
      publishedAt: { lte: new Date() },
      OR: [
        ...(resolvedCategory ? [{ categoryId: resolvedCategory }] : []),
        ...(resolvedTagIds.length ? [{ tags: { some: { tagId: { in: resolvedTagIds } } } }] : []),
      ],
    },
    include: publicPostInclude,
    orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
    take: Math.min(8, Math.max(1, limit)),
  });
}

export function getCategories() {
  return db.category.findMany({
    include: { _count: { select: { posts: { where: { status: "PUBLISHED" } } } } },
    orderBy: [{ posts: { _count: "desc" } }, { name: "asc" }],
  });
}

export function getTags() {
  return db.tag.findMany({
    include: {
      _count: {
        select: {
          posts: { where: { post: { status: "PUBLISHED" } } },
          projects: { where: { project: { status: "PUBLISHED" } } },
        },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function getArchive() {
  const posts = await db.post.findMany({
    where: { status: "PUBLISHED", publishedAt: { lte: new Date() } },
    include: publicPostInclude,
    orderBy: { publishedAt: "desc" },
  });
  const groups = new Map<number, PublicPost[]>();
  for (const post of posts) {
    const year = (post.publishedAt ?? post.createdAt).getFullYear();
    groups.set(year, [...(groups.get(year) ?? []), post]);
  }
  return Array.from(groups, ([year, yearPosts]) => ({ year, posts: yearPosts })).sort((a, b) => b.year - a.year);
}

export async function getPublishedProjects(params: PublishedProjectQuery = {}) {
  const { page, pageSize, skip } = pageValues(params.page, params.pageSize ?? 12);
  const query = params.query?.trim().slice(0, 100);
  const where: Prisma.ProjectWhereInput = {
    status: "PUBLISHED",
    publishedAt: { lte: new Date() },
    ...(params.tag ? { tags: { some: { tag: { slug: params.tag } } } } : {}),
    ...(query
      ? {
          OR: [
            { title: { contains: query } },
            { summary: { contains: query } },
            { body: { contains: query } },
          ],
        }
      : {}),
  };
  const [items, total] = await db.$transaction([
    db.project.findMany({
      where,
      include: publicProjectInclude,
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
      skip,
      take: pageSize,
    }),
    db.project.count({ where }),
  ]);
  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export function getProjectBySlug(slug: string) {
  return db.project.findFirst({
    where: { slug, status: "PUBLISHED", publishedAt: { lte: new Date() } },
    include: publicProjectInclude,
  });
}

export async function searchContent(query: string, limit = 20) {
  const normalized = query.trim().slice(0, 100);
  if (normalized.length < 2) return { query: normalized, posts: [], projects: [], total: 0 };
  const take = Math.min(50, Math.max(1, limit));
  const [posts, projects] = await Promise.all([
    db.post.findMany({
      where: {
        status: "PUBLISHED",
        publishedAt: { lte: new Date() },
        OR: [
          { title: { contains: normalized } },
          { excerpt: { contains: normalized } },
          { content: { contains: normalized } },
        ],
      },
      include: publicPostInclude,
      orderBy: { publishedAt: "desc" },
      take,
    }),
    db.project.findMany({
      where: {
        status: "PUBLISHED",
        publishedAt: { lte: new Date() },
        OR: [
          { title: { contains: normalized } },
          { summary: { contains: normalized } },
          { body: { contains: normalized } },
        ],
      },
      include: publicProjectInclude,
      orderBy: { publishedAt: "desc" },
      take,
    }),
  ]);
  return { query: normalized, posts, projects, total: posts.length + projects.length };
}

export function getTimelineEvents() {
  return db.timelineEvent.findMany({
    where: { visible: true },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });
}
