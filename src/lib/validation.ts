import { z } from "zod";
import { isSafeExternalUrl, normalizeEmail } from "@/lib/security";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const identifierSchema = z.string().trim().min(1).max(64);
export const slugSchema = z.string().trim().min(2).max(191).regex(slugPattern, "Slug 只能包含小写字母、数字和连字符");
export const emailSchema = z.string().trim().email().max(191).transform(normalizeEmail);
export const optionalUrlSchema = z
  .string()
  .trim()
  .max(500)
  .refine((value) => isSafeExternalUrl(value || null), "链接必须使用 HTTPS")
  .transform((value) => value || null);

export const optionalAssetUrlSchema = z
  .string()
  .trim()
  .max(500)
  .refine(
    (value) =>
      value === "" ||
      /^\/(?:uploads|images)\/[a-zA-Z0-9/_.-]+\.(?:avif|gif|heic|heif|jpe?g|png|tiff?|webp|svg)$/i.test(
        value,
      ) ||
      isSafeExternalUrl(value),
    "图片必须来自媒体库或使用安全的 HTTPS 链接",
  )
  .transform((value) => value || null);

const optionalCoordinate = (minimum: number, maximum: number) =>
  z.preprocess(
    (value) => (value === "" || value === undefined ? null : value),
    z.coerce.number().min(minimum).max(maximum).nullable(),
  );

const timeZoneSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .refine((value) => {
    try {
      new Intl.DateTimeFormat("zh-CN", { timeZone: value }).format();
      return true;
    } catch {
      return false;
    }
  }, "请输入有效的 IANA 时区，例如 Asia/Shanghai");

const optionalIsoDateSchema = z
  .string()
  .trim()
  .refine(
    (value) =>
      value === "" ||
      (/^\d{4}-\d{2}-\d{2}$/.test(value) &&
        !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime())),
    "日期必须使用 YYYY-MM-DD 格式",
  );

export const postSchema = z.object({
  title: z.string().trim().min(2).max(220),
  slug: slugSchema,
  excerpt: z.string().trim().min(20).max(500),
  content: z.string().trim().min(50).max(300_000),
  coverImage: z.string().trim().max(500).optional().transform((value) => value || null),
  coverAlt: z.string().trim().max(255).optional().transform((value) => value || null),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  featured: z.boolean(),
  readingMinutes: z.number().int().min(1).max(120),
  seoTitle: z.string().trim().max(220).optional().transform((value) => value || null),
  seoDescription: z.string().trim().max(500).optional().transform((value) => value || null),
  categoryId: identifierSchema,
  tagIds: z.array(identifierSchema).max(20),
});

export const projectSchema = z.object({
  title: z.string().trim().min(2).max(220),
  slug: slugSchema,
  summary: z.string().trim().min(20).max(500),
  body: z.string().trim().min(50).max(300_000),
  coverImage: z.string().trim().max(500).optional().transform((value) => value || null),
  coverAlt: z.string().trim().max(255).optional().transform((value) => value || null),
  gallery: z.array(z.string().trim().max(500)).max(20),
  technologies: z.array(z.string().trim().min(1).max(50)).max(30),
  demoUrl: optionalUrlSchema,
  sourceUrl: optionalUrlSchema,
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  featured: z.boolean(),
  seoTitle: z.string().trim().max(220).optional().transform((value) => value || null),
  seoDescription: z.string().trim().max(500).optional().transform((value) => value || null),
  tagIds: z.array(identifierSchema).max(20),
});

export const categorySchema = z.object({
  name: z.string().trim().min(1).max(80),
  slug: slugSchema,
  description: z.string().trim().max(500).optional().transform((value) => value || null),
});

export const tagSchema = z.object({
  name: z.string().trim().min(1).max(80),
  slug: slugSchema,
});

export const commentSchema = z.object({
  postId: identifierSchema,
  parentId: z.string().trim().max(64).optional().transform((value) => value || null),
  authorName: z.string().trim().min(2).max(100),
  email: emailSchema,
  content: z.string().trim().min(3).max(3000),
  website: z.string().max(0).optional(),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: emailSchema,
  subject: z.string().trim().min(2).max(220),
  message: z.string().trim().min(10).max(5000),
  website: z.string().max(0).optional(),
});

export const subscribeSchema = z.object({
  email: emailSchema,
  company: z.string().max(0).optional(),
});

export const siteSettingsSchema = z.object({
  siteTitle: z.string().trim().min(2).max(70),
  siteDescription: z.string().trim().min(10).max(180),
  siteUrl: z
    .string()
    .trim()
    .url()
    .max(500)
    .refine(
      (value) =>
        isSafeExternalUrl(value) ||
        /^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d{1,5})?$/i.test(value),
      "站点链接必须使用 HTTPS；本地开发可使用 localhost",
    ),
  authorName: z.string().trim().min(1).max(80),
  authorBio: z.string().trim().max(800),
  contactEmail: z.union([z.literal(""), emailSchema]),
  githubUrl: optionalUrlSchema,
  nowText: z.string().trim().max(3000),
  footerNote: z.string().trim().max(160),
  commentsEnabled: z.boolean(),
  newsletterEnabled: z.boolean(),
  siteName: z.string().trim().min(2).max(100),
  siteSubtitle: z.string().trim().min(2).max(180),
  profileName: z.string().trim().min(1).max(80),
  profileBio: z.string().trim().max(800),
  profileAvatar: optionalAssetUrlSchema,
  siteLaunchDate: optionalIsoDateSchema,
  noticeText: z.string().trim().max(300),
  locationName: z.string().trim().max(120),
  latitude: optionalCoordinate(-90, 90),
  longitude: optionalCoordinate(-180, 180),
  timezone: timeZoneSchema,
  weatherEnabled: z.boolean(),
  weatherMode: z.enum(["auto", "manual"]).default("auto"),
  manualWeatherCondition: z.string().trim().max(40).default(""),
  manualWeatherTemperature: optionalCoordinate(-100, 100),
  manualWeatherDescription: z.string().trim().max(240).default(""),
  petalsEnabled: z.boolean(),
  petalsDensity: z.enum(["low", "medium", "high"]),
  email: z.union([z.literal(""), emailSchema]),
  musicEnabled: z.boolean(),
  guestbookEnabled: z.boolean(),
  friendsEnabled: z.boolean(),
});

export function checkbox(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true" || formData.get(key) === "1";
}

export function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export function stringList(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .flatMap((value) => (typeof value === "string" ? value.split(",") : []))
    .map((value) => value.trim())
    .filter(Boolean);
}
