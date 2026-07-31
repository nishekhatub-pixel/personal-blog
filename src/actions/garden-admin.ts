"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import {
  deleteStoredAudio,
  verifyStoredAudio,
} from "@/lib/audio-uploads";
import { db } from "@/lib/db";
import {
  friendLinkInputSchema,
  guestbookModerationInputSchema,
  heroSlideInputSchema,
  momentInputSchema,
  musicTrackInputSchema,
  photoAlbumInputSchema,
  photoInputSchema,
  playlistInputSchema,
} from "@/lib/garden-validation";
import { assertSameOrigin } from "@/lib/security";
import { checkbox, stringValue } from "@/lib/validation";

const identifierSchema = z.string().trim().min(1).max(64);
const albumPhotoDraftInputSchema = z.object({
  albumId: identifierSchema,
  mediaId: identifierSchema,
});
const albumPhotoMoveInputSchema = z.object({
  albumId: identifierSchema,
  direction: z.enum(["up", "down"]),
  photoId: identifierSchema,
});
const photoAlbumModeSchema = z.enum(["NONE", "EXISTING", "NEW"]);
const inlinePhotoAlbumSchema = photoAlbumInputSchema.pick({
  description: true,
  slug: true,
  title: true,
});
const momentCommentModerationSchema = guestbookModerationInputSchema.pick({
  id: true,
  status: true,
});

type AlbumPhotoDraftActionResult =
  | { ok: true; message: string; photoId: string }
  | { ok: false; message: string };

type AlbumPhotoMoveActionResult =
  | { ok: true; message: string; order: string[] }
  | { ok: false; message: string };

class ReadableGardenActionError extends Error {}

type PublicationInput = {
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publishedAt: Date | null;
};

function requiredId(formData: FormData) {
  return identifierSchema.parse(stringValue(formData, "id"));
}

function jsonValue(formData: FormData, key: string, fallback: unknown = []) {
  const value = stringValue(formData, key).trim();
  if (!value) return fallback;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function databaseErrorCode(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error)) return "";
  return typeof error.code === "string" ? error.code : "";
}

function resolvePublishedAt(
  input: PublicationInput,
  existingPublishedAt: Date | null = null,
) {
  if (input.publishedAt) return input.publishedAt;
  if (existingPublishedAt) return existingPublishedAt;
  return input.status === "PUBLISHED" ? new Date() : null;
}

function logAdminWrite(
  actorId: string,
  resource: string,
  action: "create" | "update" | "delete" | "moderate",
  id: string,
) {
  console.info("garden_admin_write", {
    actorId,
    resource,
    action,
    id,
  });
}

function revalidate(paths: string[]) {
  for (const path of new Set(paths)) revalidatePath(path);
}

function refreshMoments(id?: string) {
  revalidate([
    "/",
    "/moments",
    "/sitemap.xml",
    "/admin",
    "/admin/moments",
    ...(id ? [`/admin/moments/${id}/edit`] : []),
  ]);
}

function refreshPhotos(options: {
  albumIds?: string[];
  photoIds?: string[];
  slugs?: string[];
} = {}) {
  const {
    albumIds = [],
    photoIds = [],
    slugs = [],
  } = options;
  revalidate([
    "/",
    "/photos",
    "/sitemap.xml",
    "/admin",
    "/admin/albums",
    "/admin/photos",
    ...albumIds.map((id) => `/admin/albums/${id}/edit`),
    ...photoIds.map((id) => `/admin/photos/${id}/edit`),
    ...slugs.map((slug) => `/photos/${slug}`),
  ]);
}

function refreshHero(id?: string) {
  revalidate([
    "/",
    "/admin",
    "/admin/hero",
    ...(id ? [`/admin/hero#hero-slide-${id}`] : []),
  ]);
}

function refreshMusicTrack(id?: string) {
  revalidate([
    "/",
    "/music",
    "/sitemap.xml",
    "/admin",
    "/admin/music",
    ...(id ? [`/admin/music/${id}/edit`] : []),
  ]);
}

function refreshPlaylist(id?: string) {
  revalidate([
    "/",
    "/music",
    "/sitemap.xml",
    "/admin",
    "/admin/playlists",
    ...(id ? [`/admin/playlists/${id}/edit`] : []),
  ]);
}

function refreshGuestbook() {
  revalidate(["/", "/guestbook", "/admin", "/admin/guestbook"]);
}

function refreshFriends(id?: string) {
  revalidate([
    "/",
    "/friends",
    "/sitemap.xml",
    "/admin",
    "/admin/friends",
    ...(id ? [`/admin/friends/${id}/edit`] : []),
  ]);
}

function warnAudioCleanup(
  actorId: string,
  action: "create" | "update" | "delete",
  id: string,
  error: unknown,
) {
  console.warn("garden_audio_cleanup_failed", {
    actorId,
    resource: "musicTrack",
    action,
    id,
    errorName: error instanceof Error ? error.name : "UnknownError",
  });
}

async function verifyMusicUpload(
  input: ReturnType<typeof musicTrackInput>,
) {
  if (input.sourceType !== "UPLOAD") return;
  await verifyStoredAudio({
    audioUrl: input.audioUrl,
    storedName: input.storedName,
    mimeType: input.mimeType,
    size: input.size,
  });
}

async function cleanupUnreferencedAudio(
  actorId: string,
  action: "create" | "update",
  audioUrl: string,
) {
  try {
    const references = await db.musicTrack.count({ where: { audioUrl } });
    if (references === 0) await deleteStoredAudio(audioUrl);
  } catch (error) {
    warnAudioCleanup(actorId, action, audioUrl, error);
  }
}

function readableMusicWriteError(error: unknown) {
  const code = databaseErrorCode(error);
  if (code === "P2002") {
    return new Error("音频地址或存储名称已被其他曲目使用。");
  }
  if (code === "P2003") {
    return new Error("选择的音乐封面不存在，请刷新媒体库后重试。");
  }
  if (code === "P2025") {
    return new Error("曲目不存在或已被删除，请返回音乐列表。");
  }
  return new Error("音乐保存失败，请检查音频文件后重试。");
}

function momentInput(formData: FormData) {
  return momentInputSchema.parse({
    content: stringValue(formData, "content"),
    mood: stringValue(formData, "mood"),
    weather: stringValue(formData, "weather"),
    pinned: checkbox(formData, "pinned"),
    status: stringValue(formData, "status") || "DRAFT",
    publishedAt: stringValue(formData, "publishedAt"),
    media: jsonValue(formData, "mediaJson"),
  });
}

function photoAlbumInput(formData: FormData) {
  return photoAlbumInputSchema.parse({
    title: stringValue(formData, "title"),
    slug: stringValue(formData, "slug"),
    description: stringValue(formData, "description"),
    coverMediaId: stringValue(formData, "coverMediaId"),
    recordDate: stringValue(formData, "recordDate"),
    city: stringValue(formData, "city"),
    featured: checkbox(formData, "featured"),
    position: stringValue(formData, "position") || "0",
    status: stringValue(formData, "status") || "DRAFT",
    publishedAt: stringValue(formData, "publishedAt"),
  });
}

function photoInput(formData: FormData) {
  const rawAlbumId = stringValue(formData, "albumId");
  const albumMode = photoAlbumModeSchema.parse(
    stringValue(formData, "albumMode") || (rawAlbumId ? "EXISTING" : "NONE"),
  );
  const input = photoInputSchema.parse({
    albumId: albumMode === "EXISTING" ? rawAlbumId : "",
    mediaId: stringValue(formData, "mediaId"),
    alt: stringValue(formData, "alt"),
    caption: stringValue(formData, "caption"),
    takenAt: stringValue(formData, "takenAt"),
    location: stringValue(formData, "location"),
    position: stringValue(formData, "position") || "0",
    status: stringValue(formData, "status") || "DRAFT",
    publishedAt: stringValue(formData, "publishedAt"),
  });
  const newAlbum =
    albumMode === "NEW"
      ? inlinePhotoAlbumSchema.parse({
          description: stringValue(formData, "newAlbumDescription"),
          slug: stringValue(formData, "newAlbumSlug"),
          title: stringValue(formData, "newAlbumTitle"),
        })
      : null;
  return { input, newAlbum };
}

function heroSlideInput(formData: FormData) {
  return heroSlideInputSchema.parse({
    alt: stringValue(formData, "alt"),
    mediaId: stringValue(formData, "mediaId"),
    position: stringValue(formData, "position") || "0",
    visible: checkbox(formData, "visible"),
  });
}

function musicTrackInput(formData: FormData) {
  const sourceType = stringValue(formData, "sourceType");
  const common = {
    title: stringValue(formData, "title"),
    artist: stringValue(formData, "artist"),
    album: stringValue(formData, "album"),
    durationSeconds: stringValue(formData, "durationSeconds"),
    coverMediaId: stringValue(formData, "coverMediaId"),
    lyrics: stringValue(formData, "lyrics"),
    note: stringValue(formData, "note"),
    featured: checkbox(formData, "featured"),
    favorite: checkbox(formData, "favorite"),
    status: stringValue(formData, "status") || "DRAFT",
    publishedAt: stringValue(formData, "publishedAt"),
  };

  return musicTrackInputSchema.parse(
    sourceType === "REMOTE"
      ? {
          ...common,
          sourceType,
          audioUrl: stringValue(formData, "audioUrl"),
          originalName: null,
          storedName: null,
          mimeType: null,
          size: null,
        }
      : {
          ...common,
          sourceType,
          audioUrl: stringValue(formData, "audioUrl"),
          originalName: stringValue(formData, "originalName"),
          storedName: stringValue(formData, "storedName"),
          mimeType: stringValue(formData, "mimeType"),
          size: stringValue(formData, "size"),
        },
  );
}

function playlistInput(formData: FormData) {
  return playlistInputSchema.parse({
    title: stringValue(formData, "title"),
    slug: stringValue(formData, "slug"),
    description: stringValue(formData, "description"),
    coverMediaId: stringValue(formData, "coverMediaId"),
    featured: checkbox(formData, "featured"),
    position: stringValue(formData, "position") || "0",
    status: stringValue(formData, "status") || "DRAFT",
    publishedAt: stringValue(formData, "publishedAt"),
    tracks: jsonValue(formData, "tracksJson"),
  });
}

function friendLinkInput(formData: FormData) {
  const tags = stringValue(formData, "tags")
    .split(/[,，\r\n]+/)
    .map((tag) => tag.trim())
    .filter(Boolean);

  return friendLinkInputSchema.parse({
    name: stringValue(formData, "name"),
    url: stringValue(formData, "url"),
    description: stringValue(formData, "description"),
    avatarUrl: stringValue(formData, "avatarUrl"),
    contact: stringValue(formData, "contact"),
    tags,
    featured: checkbox(formData, "featured"),
    position: stringValue(formData, "position") || "0",
    status: stringValue(formData, "status") || "DRAFT",
    publishedAt: stringValue(formData, "publishedAt"),
  });
}

export async function createMoment(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdmin();
  const input = momentInput(formData);
  const { media, ...data } = input;

  const moment = await db.$transaction(async (transaction) => {
    const created = await transaction.moment.create({
      data: {
        ...data,
        publishedAt: resolvePublishedAt(data),
      },
    });
    if (media.length) {
      await transaction.momentMedia.createMany({
        data: media.map((item) => ({ ...item, momentId: created.id })),
      });
    }
    return created;
  });

  logAdminWrite(actor.id, "moment", "create", moment.id);
  refreshMoments(moment.id);
  redirect(`/admin/moments/${moment.id}/edit?created=1`);
}

export async function updateMoment(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdmin();
  const id = requiredId(formData);
  const input = momentInput(formData);
  const { media, ...data } = input;

  await db.$transaction(async (transaction) => {
    const existing = await transaction.moment.findUniqueOrThrow({
      where: { id },
      select: { publishedAt: true },
    });
    await transaction.moment.update({
      where: { id },
      data: {
        ...data,
        publishedAt: resolvePublishedAt(data, existing.publishedAt),
      },
    });
    await transaction.momentMedia.deleteMany({ where: { momentId: id } });
    if (media.length) {
      await transaction.momentMedia.createMany({
        data: media.map((item) => ({ ...item, momentId: id })),
      });
    }
  });

  logAdminWrite(actor.id, "moment", "update", id);
  refreshMoments(id);
  redirect(`/admin/moments/${id}/edit?saved=1`);
}

export async function deleteMoment(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdmin();
  const id = requiredId(formData);
  await db.moment.delete({ where: { id } });
  logAdminWrite(actor.id, "moment", "delete", id);
  refreshMoments();
}

export async function moderateMomentComment(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdmin();
  const input = momentCommentModerationSchema.parse({
    id: stringValue(formData, "id"),
    status: stringValue(formData, "status"),
  });
  const comment = await db.momentComment.update({
    where: { id: input.id },
    data: { status: input.status },
    select: { id: true, momentId: true },
  });
  logAdminWrite(actor.id, "momentComment", "moderate", comment.id);
  refreshMoments(comment.momentId);
  revalidatePath("/admin/moments/comments");
}

export async function deleteMomentComment(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdmin();
  const id = requiredId(formData);
  const comment = await db.momentComment.delete({
    where: { id },
    select: { id: true, momentId: true },
  });
  logAdminWrite(actor.id, "momentComment", "delete", comment.id);
  refreshMoments(comment.momentId);
  revalidatePath("/admin/moments/comments");
}

export async function createPhotoAlbum(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdmin();
  const input = photoAlbumInput(formData);
  const album = await db.photoAlbum.create({
    data: {
      ...input,
      publishedAt: resolvePublishedAt(input),
    },
  });
  logAdminWrite(actor.id, "photoAlbum", "create", album.id);
  refreshPhotos({ albumIds: [album.id], slugs: [album.slug] });
  redirect(`/admin/albums/${album.id}/edit?created=1`);
}

export async function updatePhotoAlbum(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdmin();
  const id = requiredId(formData);
  const input = photoAlbumInput(formData);
  const existing = await db.photoAlbum.findUniqueOrThrow({
    where: { id },
    select: { publishedAt: true, slug: true },
  });
  const album = await db.photoAlbum.update({
    where: { id },
    data: {
      ...input,
      publishedAt: resolvePublishedAt(input, existing.publishedAt),
    },
  });
  logAdminWrite(actor.id, "photoAlbum", "update", album.id);
  refreshPhotos({
    albumIds: [album.id],
    slugs: [existing.slug, album.slug],
  });
  redirect(`/admin/albums/${album.id}/edit?saved=1`);
}

export async function deletePhotoAlbum(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdmin();
  const id = requiredId(formData);
  const album = await db.photoAlbum.delete({
    where: { id },
    select: { id: true, slug: true },
  });
  logAdminWrite(actor.id, "photoAlbum", "delete", album.id);
  refreshPhotos({ slugs: [album.slug] });
}

export async function createPhoto(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdmin();
  const { input, newAlbum } = photoInput(formData);
  const photo = await db.$transaction(async (transaction) => {
    const album = newAlbum
      ? await transaction.photoAlbum.create({
          data: {
            ...newAlbum,
            coverMediaId: input.mediaId,
            status: "DRAFT",
          },
          select: { id: true },
        })
      : null;
    return transaction.photo.create({
      data: {
        ...input,
        albumId: album?.id ?? input.albumId,
        publishedAt: resolvePublishedAt(input),
      },
      select: {
        id: true,
        albumId: true,
        album: { select: { slug: true } },
      },
    });
  });
  logAdminWrite(actor.id, "photo", "create", photo.id);
  refreshPhotos({
    albumIds: photo.albumId ? [photo.albumId] : [],
    photoIds: [photo.id],
    slugs: photo.album ? [photo.album.slug] : [],
  });
  redirect(`/admin/photos/${photo.id}/edit?created=1`);
}

export async function createAlbumPhotoDraft(
  value: unknown,
): Promise<AlbumPhotoDraftActionResult> {
  await assertSameOrigin();
  const actor = await requireAdmin();
  const parsed = albumPhotoDraftInputSchema.safeParse(value);
  if (!parsed.success) {
    return { ok: false, message: "照片参数无效，请刷新相册页面后重试。" };
  }

  try {
    const result = await db.$transaction(async (transaction) => {
      const album = await transaction.photoAlbum.findUnique({
        where: { id: parsed.data.albumId },
        select: { id: true, slug: true },
      });
      if (!album) throw new ReadableGardenActionError("相册不存在或已被删除。");

      const media = await transaction.media.findUnique({
        where: { id: parsed.data.mediaId },
        select: { alt: true, id: true },
      });
      if (!media) {
        throw new ReadableGardenActionError(
          "图片已上传，但媒体记录不存在，请在媒体库中确认后重试。",
        );
      }

      const lastPhoto = await transaction.photo.findFirst({
        where: { albumId: album.id },
        orderBy: [{ position: "desc" }, { createdAt: "desc" }],
        select: { position: true },
      });
      const photo = await transaction.photo.create({
        data: {
          albumId: album.id,
          mediaId: media.id,
          alt: media.alt,
          position: (lastPhoto?.position ?? -1) + 1,
          status: "DRAFT",
          publishedAt: null,
        },
        select: { id: true },
      });

      return { album, photo };
    });

    logAdminWrite(actor.id, "photo", "create", result.photo.id);
    refreshPhotos({
      albumIds: [result.album.id],
      photoIds: [result.photo.id],
      slugs: [result.album.slug],
    });
    return {
      ok: true,
      message: "图片已上传，并作为草稿加入相册。",
      photoId: result.photo.id,
    };
  } catch (error) {
    if (error instanceof ReadableGardenActionError) {
      return { ok: false, message: error.message };
    }
    if (databaseErrorCode(error) === "P2002") {
      return {
        ok: false,
        message: "这张媒体图片已经在当前相册中，无需重复添加。",
      };
    }
    console.error("album_photo_draft_create_failed", {
      actorId: actor.id,
      albumId: parsed.data.albumId,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return {
      ok: false,
      message: "图片已保留在媒体库，但创建相册照片草稿失败，请稍后重试。",
    };
  }
}

export async function moveAlbumPhoto(
  value: unknown,
): Promise<AlbumPhotoMoveActionResult> {
  await assertSameOrigin();
  const actor = await requireAdmin();
  const parsed = albumPhotoMoveInputSchema.safeParse(value);
  if (!parsed.success) {
    return { ok: false, message: "排序参数无效，请刷新相册页面后重试。" };
  }

  try {
    const result = await db.$transaction(async (transaction) => {
      const album = await transaction.photoAlbum.findUnique({
        where: { id: parsed.data.albumId },
        select: { id: true, slug: true },
      });
      if (!album) throw new ReadableGardenActionError("相册不存在或已被删除。");

      const photos = await transaction.photo.findMany({
        where: { albumId: album.id },
        orderBy: [
          { position: "asc" },
          { createdAt: "asc" },
          { id: "asc" },
        ],
        select: { id: true },
      });
      const currentIndex = photos.findIndex(
        (photo) => photo.id === parsed.data.photoId,
      );
      if (currentIndex < 0) {
        throw new ReadableGardenActionError("照片不属于当前相册或已被删除。");
      }

      const nextIndex =
        parsed.data.direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (nextIndex < 0 || nextIndex >= photos.length) {
        return {
          album,
          moved: false,
          order: photos.map((photo) => photo.id),
        };
      }

      const reordered = [...photos];
      [reordered[currentIndex], reordered[nextIndex]] = [
        reordered[nextIndex],
        reordered[currentIndex],
      ];
      for (const [position, photo] of reordered.entries()) {
        await transaction.photo.update({
          where: { id: photo.id },
          data: { position },
        });
      }

      return {
        album,
        moved: true,
        order: reordered.map((photo) => photo.id),
      };
    });

    if (result.moved) {
      logAdminWrite(actor.id, "photo", "update", parsed.data.photoId);
      refreshPhotos({
        albumIds: [result.album.id],
        photoIds: [parsed.data.photoId],
        slugs: [result.album.slug],
      });
    }
    return {
      ok: true,
      message: result.moved
        ? parsed.data.direction === "up"
          ? "照片已上移。"
          : "照片已下移。"
        : parsed.data.direction === "up"
          ? "这已经是第一张照片。"
          : "这已经是最后一张照片。",
      order: result.order,
    };
  } catch (error) {
    if (error instanceof ReadableGardenActionError) {
      return { ok: false, message: error.message };
    }
    console.error("album_photo_reorder_failed", {
      actorId: actor.id,
      albumId: parsed.data.albumId,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return { ok: false, message: "照片排序保存失败，请稍后重试。" };
  }
}

export async function updatePhoto(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdmin();
  const id = requiredId(formData);
  const { input, newAlbum } = photoInput(formData);
  const existing = await db.photo.findUniqueOrThrow({
    where: { id },
    select: {
      publishedAt: true,
      albumId: true,
      album: { select: { slug: true } },
    },
  });
  const photo = await db.$transaction(async (transaction) => {
    const album = newAlbum
      ? await transaction.photoAlbum.create({
          data: {
            ...newAlbum,
            coverMediaId: input.mediaId,
            status: "DRAFT",
          },
          select: { id: true },
        })
      : null;
    return transaction.photo.update({
      where: { id },
      data: {
        ...input,
        albumId: album?.id ?? input.albumId,
        publishedAt: resolvePublishedAt(input, existing.publishedAt),
      },
      select: {
        id: true,
        albumId: true,
        album: { select: { slug: true } },
      },
    });
  });
  logAdminWrite(actor.id, "photo", "update", photo.id);
  refreshPhotos({
    albumIds: [existing.albumId, photo.albumId].filter(
      (albumId): albumId is string => Boolean(albumId),
    ),
    photoIds: [photo.id],
    slugs: [existing.album?.slug, photo.album?.slug].filter(
      (slug): slug is string => Boolean(slug),
    ),
  });
  redirect(`/admin/photos/${photo.id}/edit?saved=1`);
}

export async function deletePhoto(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdmin();
  const id = requiredId(formData);
  const photo = await db.photo.delete({
    where: { id },
    select: {
      id: true,
      albumId: true,
      album: { select: { slug: true } },
    },
  });
  logAdminWrite(actor.id, "photo", "delete", photo.id);
  refreshPhotos({
    albumIds: photo.albumId ? [photo.albumId] : [],
    slugs: photo.album ? [photo.album.slug] : [],
  });
}

export async function createHeroSlide(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdmin();
  const input = heroSlideInput(formData);
  const slide = await db.heroSlide.create({ data: input });
  logAdminWrite(actor.id, "heroSlide", "create", slide.id);
  refreshHero(slide.id);
  redirect("/admin/hero?created=1");
}

export async function updateHeroSlide(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdmin();
  const id = requiredId(formData);
  const slide = await db.heroSlide.update({
    data: heroSlideInput(formData),
    where: { id },
  });
  logAdminWrite(actor.id, "heroSlide", "update", slide.id);
  refreshHero(slide.id);
  redirect("/admin/hero?saved=1");
}

export async function deleteHeroSlide(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdmin();
  const slide = await db.heroSlide.delete({
    select: { id: true },
    where: { id: requiredId(formData) },
  });
  logAdminWrite(actor.id, "heroSlide", "delete", slide.id);
  refreshHero();
}

export async function createMusicTrack(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdmin();
  const input = musicTrackInput(formData);
  await verifyMusicUpload(input);
  const track = await db.musicTrack
    .create({
      data: {
        ...input,
        publishedAt: resolvePublishedAt(input),
      },
    })
    .catch(async (error: unknown) => {
      if (input.sourceType === "UPLOAD") {
        await cleanupUnreferencedAudio(
          actor.id,
          "create",
          input.audioUrl,
        );
      }
      console.error("music_track_create_failed", {
        actorId: actor.id,
        code: databaseErrorCode(error) || "unknown",
      });
      throw readableMusicWriteError(error);
    });
  logAdminWrite(actor.id, "musicTrack", "create", track.id);
  refreshMusicTrack(track.id);
  redirect(`/admin/music/${track.id}/edit?created=1`);
}

export async function updateMusicTrack(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdmin();
  const id = requiredId(formData);
  const input = musicTrackInput(formData);
  const existing = await db.musicTrack.findUnique({
    where: { id },
    select: {
      publishedAt: true,
      sourceType: true,
      audioUrl: true,
    },
  });
  if (!existing) throw new Error("曲目不存在或已被删除，请返回音乐列表。");
  await verifyMusicUpload(input);
  const newUpload =
    input.sourceType === "UPLOAD" &&
    (existing.sourceType !== "UPLOAD" ||
      input.audioUrl !== existing.audioUrl);
  const track = await db.musicTrack
    .update({
      where: { id },
      data: {
        ...input,
        publishedAt: resolvePublishedAt(input, existing.publishedAt),
      },
    })
    .catch(async (error: unknown) => {
      if (newUpload && input.sourceType === "UPLOAD") {
        await cleanupUnreferencedAudio(
          actor.id,
          "update",
          input.audioUrl,
        );
      }
      console.error("music_track_update_failed", {
        actorId: actor.id,
        code: databaseErrorCode(error) || "unknown",
        id,
      });
      throw readableMusicWriteError(error);
    });
  logAdminWrite(actor.id, "musicTrack", "update", track.id);
  if (
    existing.sourceType === "UPLOAD" &&
    (track.sourceType !== "UPLOAD" || track.audioUrl !== existing.audioUrl)
  ) {
    try {
      await deleteStoredAudio(existing.audioUrl);
    } catch (error) {
      warnAudioCleanup(actor.id, "update", track.id, error);
    }
  }
  refreshMusicTrack(track.id);
  redirect(`/admin/music/${track.id}/edit?saved=1`);
}

export async function deleteMusicTrack(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdmin();
  const id = requiredId(formData);
  const track = await db.musicTrack
    .delete({
      where: { id },
      select: { id: true, sourceType: true, audioUrl: true },
    })
    .catch((error: unknown) => {
      throw readableMusicWriteError(error);
    });
  logAdminWrite(actor.id, "musicTrack", "delete", track.id);
  if (track.sourceType === "UPLOAD") {
    try {
      await deleteStoredAudio(track.audioUrl);
    } catch (error) {
      warnAudioCleanup(actor.id, "delete", track.id, error);
    }
  }
  refreshMusicTrack();
}

export async function createPlaylist(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdmin();
  const input = playlistInput(formData);
  const { tracks, ...data } = input;

  const playlist = await db.$transaction(async (transaction) => {
    const created = await transaction.playlist.create({
      data: {
        ...data,
        publishedAt: resolvePublishedAt(data),
      },
    });
    if (tracks.length) {
      await transaction.playlistTrack.createMany({
        data: tracks.map((track) => ({ ...track, playlistId: created.id })),
      });
    }
    return created;
  });

  logAdminWrite(actor.id, "playlist", "create", playlist.id);
  refreshPlaylist(playlist.id);
  redirect(`/admin/playlists/${playlist.id}/edit?created=1`);
}

export async function updatePlaylist(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdmin();
  const id = requiredId(formData);
  const input = playlistInput(formData);
  const { tracks, ...data } = input;

  const playlist = await db.$transaction(async (transaction) => {
    const existing = await transaction.playlist.findUniqueOrThrow({
      where: { id },
      select: { publishedAt: true },
    });
    const updated = await transaction.playlist.update({
      where: { id },
      data: {
        ...data,
        publishedAt: resolvePublishedAt(data, existing.publishedAt),
      },
    });
    await transaction.playlistTrack.deleteMany({ where: { playlistId: id } });
    if (tracks.length) {
      await transaction.playlistTrack.createMany({
        data: tracks.map((track) => ({ ...track, playlistId: id })),
      });
    }
    return updated;
  });

  logAdminWrite(actor.id, "playlist", "update", playlist.id);
  refreshPlaylist(playlist.id);
  redirect(`/admin/playlists/${playlist.id}/edit?saved=1`);
}

export async function deletePlaylist(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdmin();
  const id = requiredId(formData);
  await db.playlist.delete({ where: { id } });
  logAdminWrite(actor.id, "playlist", "delete", id);
  refreshPlaylist();
}

export async function moderateGuestbookMessage(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdmin();
  const input = guestbookModerationInputSchema.parse({
    id: stringValue(formData, "id"),
    status: stringValue(formData, "status"),
    pinned: checkbox(formData, "pinned"),
    replyContent: stringValue(formData, "replyContent"),
  });
  const message = await db.guestbookMessage.update({
    where: { id: input.id },
    data: {
      status: input.status,
      pinned: input.pinned,
      replyContent: input.replyContent,
      repliedAt: input.replyContent ? new Date() : null,
    },
  });
  logAdminWrite(actor.id, "guestbookMessage", "moderate", message.id);
  refreshGuestbook();
}

export async function deleteGuestbookMessage(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdmin();
  const id = requiredId(formData);
  await db.guestbookMessage.delete({ where: { id } });
  logAdminWrite(actor.id, "guestbookMessage", "delete", id);
  refreshGuestbook();
}

export async function createFriendLink(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdmin();
  const input = friendLinkInput(formData);
  const { tags, ...data } = input;
  const friend = await db.friendLink.create({
    data: {
      ...data,
      tagsJson: JSON.stringify(tags),
      publishedAt: resolvePublishedAt(data),
    },
  });
  logAdminWrite(actor.id, "friendLink", "create", friend.id);
  refreshFriends(friend.id);
  redirect(`/admin/friends/${friend.id}/edit?created=1`);
}

export async function updateFriendLink(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdmin();
  const id = requiredId(formData);
  const input = friendLinkInput(formData);
  const { tags, ...data } = input;
  const existing = await db.friendLink.findUniqueOrThrow({
    where: { id },
    select: { publishedAt: true },
  });
  const friend = await db.friendLink.update({
    where: { id },
    data: {
      ...data,
      tagsJson: JSON.stringify(tags),
      publishedAt: resolvePublishedAt(data, existing.publishedAt),
    },
  });
  logAdminWrite(actor.id, "friendLink", "update", friend.id);
  refreshFriends(friend.id);
  redirect(`/admin/friends/${friend.id}/edit?saved=1`);
}

export async function deleteFriendLink(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdmin();
  const id = requiredId(formData);
  await db.friendLink.delete({ where: { id } });
  logAdminWrite(actor.id, "friendLink", "delete", id);
  refreshFriends();
}
