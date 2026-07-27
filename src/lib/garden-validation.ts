import { z } from "zod";

export const NOTE_COLOR_KEYS = ["sand", "sage", "peach", "rose", "stone"] as const;
export type NoteColorKey = (typeof NOTE_COLOR_KEYS)[number];

const blockedHostSuffixes = [".localhost", ".local", ".internal", ".lan"];

function isPrivateIpv4(hostname: string) {
  const parts = hostname.split(".");
  if (parts.length !== 4 || parts.some((part) => !/^\d{1,3}$/.test(part))) return false;
  const octets = parts.map(Number);
  if (octets.some((part) => part < 0 || part > 255)) return true;
  const [a, b] = octets;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function isPrivateIpv6(hostname: string) {
  const host = hostname.replace(/^\[|\]$/g, "").toLocaleLowerCase("en-US");
  if (!host.includes(":")) return false;
  if (host === "::" || host === "::1") return true;
  if (host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe8") || host.startsWith("fe9") || host.startsWith("fea") || host.startsWith("feb")) {
    return true;
  }
  const mappedIpv4 = host.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
  return mappedIpv4 ? isPrivateIpv4(mappedIpv4) : false;
}

export function isSafeHttpUrl(value: string, requireHttps = false) {
  try {
    const url = new URL(value);
    if (requireHttps ? url.protocol !== "https:" : !["http:", "https:"].includes(url.protocol)) return false;
    if (url.username || url.password) return false;
    const hostname = url.hostname.toLocaleLowerCase("en-US");
    if (
      !hostname ||
      hostname === "localhost" ||
      blockedHostSuffixes.some((suffix) => hostname.endsWith(suffix)) ||
      isPrivateIpv4(hostname) ||
      isPrivateIpv6(hostname)
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export const httpUrlSchema = z
  .string()
  .trim()
  .max(500)
  .refine((value) => isSafeHttpUrl(value), "请输入安全的公开 HTTP 或 HTTPS 链接");

export const httpsUrlSchema = z
  .string()
  .trim()
  .max(500)
  .refine((value) => isSafeHttpUrl(value, true), "请输入安全的公开 HTTPS 链接");

const emptyToNull = (value: unknown) => (value === "" || value === undefined ? null : value);
const optionalText = (max: number) => z.preprocess(emptyToNull, z.string().trim().max(max).nullable());
const optionalId = z.preprocess(emptyToNull, z.string().trim().min(1).max(64).nullable());
const optionalDate = z.preprocess(emptyToNull, z.coerce.date().nullable());
const optionalHttpUrl = z.preprocess(emptyToNull, httpUrlSchema.nullable());
const optionalHttpsUrl = z.preprocess(emptyToNull, httpsUrlSchema.nullable());
const positionSchema = z.coerce.number().int().min(0).max(1_000_000);
const contentStatusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
const commentStatusSchema = z.enum(["PENDING", "APPROVED", "HIDDEN", "SPAM"]);
const booleanSchema = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  return ["1", "true", "on", "yes"].includes(value.trim().toLocaleLowerCase("en-US"));
}, z.boolean());

export const gardenPaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
});

export const photoAlbumInputSchema = z.object({
  title: z.string().trim().min(1).max(160),
  slug: z.string().trim().min(2).max(191).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: optionalText(5000),
  coverMediaId: optionalId,
  recordDate: optionalDate,
  city: optionalText(120),
  featured: booleanSchema.default(false),
  position: positionSchema.default(0),
  status: contentStatusSchema.default("DRAFT"),
  publishedAt: optionalDate,
});

export const photoInputSchema = z.object({
  albumId: z.string().trim().min(1).max(64),
  mediaId: z.string().trim().min(1).max(64),
  alt: z.string().trim().min(2).max(255),
  caption: optionalText(5000),
  takenAt: optionalDate,
  location: optionalText(255),
  position: positionSchema.default(0),
  status: contentStatusSchema.default("DRAFT"),
  publishedAt: optionalDate,
});

export const momentMediaInputSchema = z.object({
  mediaId: z.string().trim().min(1).max(64),
  alt: z.string().trim().min(2).max(255),
  caption: optionalText(500),
  position: positionSchema.default(0),
});

export const momentInputSchema = z.object({
  content: z.string().trim().min(1).max(1000),
  mood: optionalText(80),
  weather: optionalText(120),
  pinned: booleanSchema.default(false),
  status: contentStatusSchema.default("DRAFT"),
  publishedAt: optionalDate,
  media: z.array(momentMediaInputSchema).max(9).default([]),
});

export const momentCommentInputSchema = z.object({
  momentId: z.string().trim().min(1).max(64),
  parentId: optionalId,
  authorName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(191).transform((value) => value.toLocaleLowerCase("en-US")),
  content: z.string().trim().min(2).max(3000),
  website: z.string().max(0).optional(),
});

export const momentReactionInputSchema = z.object({
  momentId: z.string().trim().min(1).max(64),
});

const musicBaseSchema = z.object({
  title: z.string().trim().min(1).max(220),
  artist: optionalText(160),
  album: optionalText(160),
  durationSeconds: z.preprocess(emptyToNull, z.coerce.number().int().min(1).max(24 * 60 * 60).nullable()),
  coverMediaId: optionalId,
  lyrics: optionalText(200_000),
  note: optionalText(20_000),
  featured: booleanSchema.default(false),
  favorite: booleanSchema.default(false),
  status: contentStatusSchema.default("DRAFT"),
  publishedAt: optionalDate,
});

const uploadedMusicSchema = musicBaseSchema.extend({
  sourceType: z.literal("UPLOAD"),
  audioUrl: z.string().trim().regex(/^\/uploads\/audio\/\d{4}\/\d{2}\/[a-f0-9-]+\.(mp3|m4a|aac|ogg)$/),
  originalName: z.string().trim().min(1).max(255),
  storedName: z.string().trim().regex(/^[a-f0-9-]+\.(mp3|m4a|aac|ogg)$/),
  mimeType: z.enum(["audio/mpeg", "audio/mp4", "audio/aac", "audio/ogg"]),
  size: z.coerce.number().int().positive(),
});

const remoteMusicSchema = musicBaseSchema.extend({
  sourceType: z.literal("REMOTE"),
  audioUrl: httpsUrlSchema,
  originalName: z.null().optional(),
  storedName: z.null().optional(),
  mimeType: z.null().optional(),
  size: z.null().optional(),
});

export const musicTrackInputSchema = z.discriminatedUnion("sourceType", [uploadedMusicSchema, remoteMusicSchema]);

export const playlistTrackInputSchema = z.object({
  trackId: z.string().trim().min(1).max(64),
  position: positionSchema,
  note: optionalText(500),
});

export const playlistInputSchema = z.object({
  title: z.string().trim().min(1).max(180),
  slug: z.string().trim().min(2).max(191).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: optionalText(5000),
  coverMediaId: optionalId,
  featured: booleanSchema.default(false),
  position: positionSchema.default(0),
  status: contentStatusSchema.default("DRAFT"),
  publishedAt: optionalDate,
  tracks: z.array(playlistTrackInputSchema).max(500).superRefine((tracks, context) => {
    const trackIds = new Set<string>();
    const positions = new Set<number>();
    tracks.forEach((track, index) => {
      if (trackIds.has(track.trackId)) {
        context.addIssue({ code: "custom", path: [index, "trackId"], message: "同一首音乐不能重复加入歌单" });
      }
      if (positions.has(track.position)) {
        context.addIssue({ code: "custom", path: [index, "position"], message: "歌单顺序不能重复" });
      }
      trackIds.add(track.trackId);
      positions.add(track.position);
    });
  }).default([]),
});

export const guestbookMessageInputSchema = z.object({
  nickname: z.string().trim().min(2).max(80),
  content: z.string().trim().min(2).max(3000),
  website: optionalHttpUrl,
  colorKey: z.enum(NOTE_COLOR_KEYS),
  company: z.string().max(0).optional(),
});

export const guestbookModerationInputSchema = z.object({
  id: z.string().trim().min(1).max(64),
  status: commentStatusSchema,
  pinned: booleanSchema.default(false),
  replyContent: optionalText(3000),
});

export const friendLinkInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  url: httpUrlSchema,
  description: z.string().trim().min(2).max(500),
  avatarUrl: optionalHttpsUrl,
  contact: optionalText(255),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  featured: booleanSchema.default(false),
  position: positionSchema.default(0),
  status: contentStatusSchema.default("DRAFT"),
  publishedAt: optionalDate,
});

export type PhotoAlbumInput = z.infer<typeof photoAlbumInputSchema>;
export type PhotoInput = z.infer<typeof photoInputSchema>;
export type MomentInput = z.infer<typeof momentInputSchema>;
export type MusicTrackInput = z.infer<typeof musicTrackInputSchema>;
export type PlaylistInput = z.infer<typeof playlistInputSchema>;
export type GuestbookMessageInput = z.infer<typeof guestbookMessageInputSchema>;
export type FriendLinkInput = z.infer<typeof friendLinkInputSchema>;
