export type Taxonomy = {
  id?: string;
  name: string;
  slug: string;
  description?: string | null;
  _count?: { posts?: number; projects?: number };
};

export type TagJoin = { tag: Taxonomy } | Taxonomy;

export type PublicPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  coverImage?: string | null;
  coverAlt?: string | null;
  featured?: boolean;
  readingMinutes: number;
  viewCount?: number;
  publishedAt: Date | string | null;
  updatedAt?: Date | string;
  category: Taxonomy;
  tags: TagJoin[];
  comments?: PublicComment[];
  seoTitle?: string | null;
  seoDescription?: string | null;
};

export type PublicProject = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  body?: string;
  coverImage?: string | null;
  coverAlt?: string | null;
  galleryJson?: string;
  technologyJson?: string;
  demoUrl?: string | null;
  sourceUrl?: string | null;
  featured?: boolean;
  publishedAt: Date | string | null;
  tags: TagJoin[];
  seoTitle?: string | null;
  seoDescription?: string | null;
};

export type PublicComment = {
  id: string;
  authorName: string;
  content: string;
  createdAt: Date | string;
  parentId?: string | null;
  replies?: PublicComment[];
};

export type TimelineItem = {
  id: string;
  title: string;
  description: string;
  dateLabel?: string | null;
  phase: string;
  position: number;
};

export type SiteSettings = Record<string, string>;

export function unwrapTags(tags: TagJoin[] | undefined): Taxonomy[] {
  return (tags ?? []).map((item) => ("tag" in item ? item.tag : item));
}

export function parseStringArray(value?: string | null): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function formatDate(value: Date | string | null | undefined, withYear = true) {
  if (!value) return "尚未发布";
  return new Intl.DateTimeFormat("zh-CN", {
    year: withYear ? "numeric" : undefined,
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

