import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

const albumInclude = {
  coverMedia: true,
  _count: { select: { photos: { where: { status: "PUBLISHED" } } } },
} satisfies Prisma.PhotoAlbumInclude;

const photoInclude = {
  album: { select: { id: true, slug: true, title: true } },
  media: true,
} satisfies Prisma.PhotoInclude;

const momentInclude = {
  media: { include: { media: true }, orderBy: { position: "asc" } },
  _count: {
    select: {
      comments: { where: { status: "APPROVED" } },
      reactions: true,
    },
  },
} satisfies Prisma.MomentInclude;

const musicInclude = {
  coverMedia: true,
} satisfies Prisma.MusicTrackInclude;

const playlistInclude = {
  coverMedia: true,
  tracks: {
    include: { track: { include: musicInclude } },
    orderBy: { position: "asc" },
  },
} satisfies Prisma.PlaylistInclude;

export type PublicPhotoAlbum = Prisma.PhotoAlbumGetPayload<{ include: typeof albumInclude }>;
export type PublicPhoto = Prisma.PhotoGetPayload<{ include: typeof photoInclude }>;
export type PublicMoment = Prisma.MomentGetPayload<{ include: typeof momentInclude }>;
export type PublicMusicTrack = Prisma.MusicTrackGetPayload<{ include: typeof musicInclude }>;
export type PublicPlaylist = Prisma.PlaylistGetPayload<{ include: typeof playlistInclude }>;

type PageQuery = {
  page?: number;
  pageSize?: number;
};

export type AlbumQuery = PageQuery & {
  featured?: boolean;
  city?: string;
};

export type PhotoQuery = PageQuery & {
  album?: string;
};

export type MomentQuery = PageQuery & {
  pinned?: boolean;
};

export type MusicQuery = PageQuery & {
  featured?: boolean;
  favorite?: boolean;
};

function pageValues(page = 1, pageSize = 12) {
  const safePage = Number.isFinite(page) ? Math.max(1, Math.trunc(page)) : 1;
  const safePageSize = Number.isFinite(pageSize) ? Math.min(50, Math.max(1, Math.trunc(pageSize))) : 12;
  return { page: safePage, pageSize: safePageSize, skip: (safePage - 1) * safePageSize };
}

function pagedResult<T>(items: T[], total: number, page: number, pageSize: number) {
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

const publishedWindow = () => ({
  status: "PUBLISHED" as const,
  publishedAt: { lte: new Date() },
});

export function publicPhotoWhere(now = new Date()): Prisma.PhotoWhereInput {
  const published = {
    status: "PUBLISHED" as const,
    publishedAt: { lte: now },
  };
  return {
    ...published,
    OR: [
      { albumId: null },
      { album: { is: published } },
    ],
  };
}

function publicAlbumInclude(now = new Date()) {
  return {
    ...albumInclude,
    _count: { select: { photos: { where: { status: "PUBLISHED" as const, publishedAt: { lte: now } } } } },
  };
}

function publicPlaylistInclude(now = new Date()) {
  return {
    ...playlistInclude,
    tracks: {
      ...playlistInclude.tracks,
      where: { track: { status: "PUBLISHED" as const, publishedAt: { lte: now } } },
    },
  };
}

export async function getPublishedPhotoAlbums(params: AlbumQuery = {}) {
  const { page, pageSize, skip } = pageValues(params.page, params.pageSize);
  const where: Prisma.PhotoAlbumWhereInput = {
    ...publishedWindow(),
    ...(typeof params.featured === "boolean" ? { featured: params.featured } : {}),
    ...(params.city?.trim() ? { city: params.city.trim().slice(0, 120) } : {}),
  };
  const [items, total] = await db.$transaction([
    db.photoAlbum.findMany({
      where,
      include: publicAlbumInclude(),
      orderBy: [{ featured: "desc" }, { position: "asc" }, { recordDate: "desc" }, { publishedAt: "desc" }],
      skip,
      take: pageSize,
    }),
    db.photoAlbum.count({ where }),
  ]);
  return pagedResult(items, total, page, pageSize);
}

export function getPhotoAlbumBySlug(slug: string) {
  return db.photoAlbum.findFirst({
    where: { slug, ...publishedWindow() },
    include: {
      coverMedia: true,
      photos: {
        where: publishedWindow(),
        include: { media: true },
        orderBy: [{ position: "asc" }, { takenAt: "desc" }, { createdAt: "desc" }],
      },
    },
  });
}

export async function getPublishedPhotos(params: PhotoQuery = {}) {
  const { page, pageSize, skip } = pageValues(params.page, params.pageSize);
  const now = new Date();
  const albumSlug = params.album?.trim().slice(0, 191);
  const where: Prisma.PhotoWhereInput = albumSlug
    ? {
        ...publishedWindow(),
        album: {
          is: {
            slug: albumSlug,
            ...publishedWindow(),
          },
        },
      }
    : publicPhotoWhere(now);
  const [items, total] = await db.$transaction([
    db.photo.findMany({
      include: photoInclude,
      orderBy: [
        { position: "asc" },
        { takenAt: "desc" },
        { publishedAt: "desc" },
        { createdAt: "desc" },
      ],
      skip,
      take: pageSize,
      where,
    }),
    db.photo.count({ where }),
  ]);
  return pagedResult(items, total, page, pageSize);
}

export async function getPublishedMoments(params: MomentQuery = {}) {
  const { page, pageSize, skip } = pageValues(params.page, params.pageSize);
  const where: Prisma.MomentWhereInput = {
    ...publishedWindow(),
    ...(typeof params.pinned === "boolean" ? { pinned: params.pinned } : {}),
  };
  const [items, total] = await db.$transaction([
    db.moment.findMany({
      where,
      include: momentInclude,
      orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
      skip,
      take: pageSize,
    }),
    db.moment.count({ where }),
  ]);
  return pagedResult(items, total, page, pageSize);
}

export function getMomentById(id: string) {
  return db.moment.findFirst({
    where: { id, ...publishedWindow() },
    include: {
      ...momentInclude,
      comments: {
        where: { status: "APPROVED", parentId: null },
        select: {
          id: true,
          authorName: true,
          content: true,
          createdAt: true,
          replies: {
            where: { status: "APPROVED" },
            select: { id: true, authorName: true, content: true, createdAt: true },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function getPublishedMusicTracks(params: MusicQuery = {}) {
  const { page, pageSize, skip } = pageValues(params.page, params.pageSize);
  const where: Prisma.MusicTrackWhereInput = {
    ...publishedWindow(),
    ...(typeof params.featured === "boolean" ? { featured: params.featured } : {}),
    ...(typeof params.favorite === "boolean" ? { favorite: params.favorite } : {}),
  };
  const [items, total] = await db.$transaction([
    db.musicTrack.findMany({
      where,
      include: musicInclude,
      orderBy: [{ featured: "desc" }, { favorite: "desc" }, { publishedAt: "desc" }],
      skip,
      take: pageSize,
    }),
    db.musicTrack.count({ where }),
  ]);
  return pagedResult(items, total, page, pageSize);
}

export function getMusicTrackById(id: string) {
  return db.musicTrack.findFirst({
    where: { id, ...publishedWindow() },
    include: musicInclude,
  });
}

export async function getPublishedPlaylists(params: PageQuery = {}) {
  const { page, pageSize, skip } = pageValues(params.page, params.pageSize);
  const where: Prisma.PlaylistWhereInput = publishedWindow();
  const [items, total] = await db.$transaction([
    db.playlist.findMany({
      where,
      include: publicPlaylistInclude(),
      orderBy: [{ featured: "desc" }, { position: "asc" }, { publishedAt: "desc" }],
      skip,
      take: pageSize,
    }),
    db.playlist.count({ where }),
  ]);
  return pagedResult(items, total, page, pageSize);
}

export function getPlaylistBySlug(slug: string) {
  return db.playlist.findFirst({
    where: { slug, ...publishedWindow() },
    include: publicPlaylistInclude(),
  });
}

export async function getApprovedGuestbookMessages(params: PageQuery = {}) {
  const { page, pageSize, skip } = pageValues(params.page, params.pageSize);
  const where: Prisma.GuestbookMessageWhereInput = { status: "APPROVED" };
  const [items, total] = await db.$transaction([
    db.guestbookMessage.findMany({
      where,
      select: {
        id: true,
        nickname: true,
        content: true,
        website: true,
        colorKey: true,
        pinned: true,
        replyContent: true,
        repliedAt: true,
        createdAt: true,
      },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      skip,
      take: pageSize,
    }),
    db.guestbookMessage.count({ where }),
  ]);
  return pagedResult(items, total, page, pageSize);
}

export async function getPublishedFriendLinks() {
  const links = await db.friendLink.findMany({
    where: publishedWindow(),
    select: {
      id: true,
      name: true,
      url: true,
      description: true,
      avatarUrl: true,
      tagsJson: true,
      featured: true,
      position: true,
      publishedAt: true,
      createdAt: true,
    },
    orderBy: [{ featured: "desc" }, { position: "asc" }, { name: "asc" }],
  });
  return links.map(({ tagsJson, ...link }) => {
    let tags: string[] = [];
    try {
      const parsed = JSON.parse(tagsJson);
      tags = Array.isArray(parsed) ? parsed.filter((tag): tag is string => typeof tag === "string").slice(0, 20) : [];
    } catch {
      tags = [];
    }
    return { ...link, tags };
  });
}

export async function getGardenHomepageStats() {
  const now = new Date();
  const published = { status: "PUBLISHED" as const, publishedAt: { lte: now } };
  const [posts, projects, albums, photos, moments, musicTracks, playlists, guestbookMessages, friendLinks] =
    await db.$transaction([
      db.post.count({ where: published }),
      db.project.count({ where: published }),
      db.photoAlbum.count({ where: published }),
      db.photo.count({ where: publicPhotoWhere(now) }),
      db.moment.count({ where: published }),
      db.musicTrack.count({ where: published }),
      db.playlist.count({ where: published }),
      db.guestbookMessage.count({ where: { status: "APPROVED" } }),
      db.friendLink.count({ where: published }),
    ]);
  return { posts, projects, albums, photos, moments, musicTracks, playlists, guestbookMessages, friendLinks };
}

export type GardenMixedItem =
  | { kind: "post"; id: string; title: string; summary: string; href: string; publishedAt: Date }
  | { kind: "project"; id: string; title: string; summary: string; href: string; publishedAt: Date }
  | { kind: "moment"; id: string; title: string; summary: string; href: string; publishedAt: Date }
  | { kind: "photo"; id: string; title: string; summary: string; href: string; publishedAt: Date }
  | { kind: "music"; id: string; title: string; summary: string; href: string; publishedAt: Date };

export async function getGardenMixedContent(limit = 12): Promise<GardenMixedItem[]> {
  const take = Math.min(30, Math.max(1, Math.trunc(limit)));
  const now = new Date();
  const published = { status: "PUBLISHED" as const, publishedAt: { lte: now } };
  const [posts, projects, moments, photos, tracks] = await Promise.all([
    db.post.findMany({
      where: published,
      select: { id: true, title: true, slug: true, excerpt: true, publishedAt: true, createdAt: true },
      orderBy: { publishedAt: "desc" },
      take,
    }),
    db.project.findMany({
      where: published,
      select: { id: true, title: true, slug: true, summary: true, publishedAt: true, createdAt: true },
      orderBy: { publishedAt: "desc" },
      take,
    }),
    db.moment.findMany({
      where: published,
      select: { id: true, content: true, publishedAt: true, createdAt: true },
      orderBy: { publishedAt: "desc" },
      take,
    }),
    db.photo.findMany({
      where: publicPhotoWhere(now),
      select: {
        id: true,
        alt: true,
        caption: true,
        takenAt: true,
        publishedAt: true,
        createdAt: true,
        album: { select: { slug: true, title: true, status: true } },
      },
      orderBy: { publishedAt: "desc" },
      take,
    }),
    db.musicTrack.findMany({
      where: published,
      select: { id: true, title: true, artist: true, publishedAt: true, createdAt: true },
      orderBy: { publishedAt: "desc" },
      take,
    }),
  ]);

  const items: GardenMixedItem[] = [
    ...posts.map((post) => ({
      kind: "post" as const,
      id: post.id,
      title: post.title,
      summary: post.excerpt,
      href: `/blog/${post.slug}`,
      publishedAt: post.publishedAt ?? post.createdAt,
    })),
    ...projects.map((project) => ({
      kind: "project" as const,
      id: project.id,
      title: project.title,
      summary: project.summary,
      href: `/projects/${project.slug}`,
      publishedAt: project.publishedAt ?? project.createdAt,
    })),
    ...moments.map((moment) => ({
      kind: "moment" as const,
      id: moment.id,
      title: "说说",
      summary: moment.content,
      href: `/moments#moment-${moment.id}`,
      publishedAt: moment.publishedAt ?? moment.createdAt,
    })),
    ...photos.map((photo) => ({
        kind: "photo" as const,
        id: photo.id,
        title: photo.album?.title ?? "照片墙",
        summary: photo.caption ?? photo.alt,
        href: photo.album
          ? `/photos?album=${encodeURIComponent(photo.album.slug)}#photo-${photo.id}`
          : `/photos#photo-${photo.id}`,
        publishedAt: photo.takenAt ?? photo.publishedAt ?? photo.createdAt,
      })),
    ...tracks.map((track) => ({
      kind: "music" as const,
      id: track.id,
      title: track.title,
      summary: track.artist ?? "音乐收藏",
      href: `/music#track-${track.id}`,
      publishedAt: track.publishedAt ?? track.createdAt,
    })),
  ];
  return items.sort((left, right) => right.publishedAt.getTime() - left.publishedAt.getTime()).slice(0, take);
}

function dateParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    key: `${parts.year}-${parts.month}-${parts.day}`,
  };
}

function validatedTimeZone(value: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
    return value;
  } catch {
    return "Asia/Shanghai";
  }
}

export type CalendarMarker = {
  date: string;
  count: number;
  types: Array<"post" | "project" | "moment" | "photo">;
  labels: string[];
};

export async function getCurrentMonthCalendarMarkers(input: {
  year?: number;
  month?: number;
  timeZone?: string;
} = {}): Promise<CalendarMarker[]> {
  const timeZone = validatedTimeZone(input.timeZone ?? "Asia/Shanghai");
  const current = dateParts(new Date(), timeZone);
  const year = Number.isInteger(input.year) ? Math.min(9999, Math.max(1970, input.year!)) : current.year;
  const month = Number.isInteger(input.month) ? Math.min(12, Math.max(1, input.month!)) : current.month;
  const queryStart = new Date(Date.UTC(year, month - 1, 1) - 48 * 60 * 60 * 1000);
  const queryEnd = new Date(Date.UTC(year, month, 1) + 48 * 60 * 60 * 1000);
  const datePrefix = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-`;

  const [posts, moments, projects, photos] = await Promise.all([
    db.post.findMany({
      where: { status: "PUBLISHED", publishedAt: { gte: queryStart, lt: queryEnd } },
      select: { title: true, publishedAt: true },
    }),
    db.moment.findMany({
      where: { status: "PUBLISHED", publishedAt: { gte: queryStart, lt: queryEnd } },
      select: { content: true, publishedAt: true },
    }),
    db.project.findMany({
      where: {
        status: "PUBLISHED",
        publishedAt: { lte: new Date() },
        updatedAt: { gte: queryStart, lt: queryEnd },
      },
      select: { title: true, updatedAt: true },
    }),
    db.photo.findMany({
      where: {
        status: "PUBLISHED",
        AND: [
          {
            OR: [
              { albumId: null },
              {
                album: {
                  is: {
                    status: "PUBLISHED",
                    publishedAt: { lte: new Date() },
                  },
                },
              },
            ],
          },
          {
            OR: [
              { takenAt: { gte: queryStart, lt: queryEnd } },
              { takenAt: null, publishedAt: { gte: queryStart, lt: queryEnd } },
            ],
          },
        ],
      },
      select: { alt: true, takenAt: true, publishedAt: true },
    }),
  ]);

  const markers = new Map<string, { count: number; types: Set<CalendarMarker["types"][number]>; labels: string[] }>();
  const add = (date: Date | null, type: CalendarMarker["types"][number], label: string) => {
    if (!date) return;
    const key = dateParts(date, timeZone).key;
    if (!key.startsWith(datePrefix)) return;
    const marker = markers.get(key) ?? { count: 0, types: new Set(), labels: [] };
    marker.count += 1;
    marker.types.add(type);
    if (marker.labels.length < 4) marker.labels.push(label.slice(0, 80));
    markers.set(key, marker);
  };

  posts.forEach((post) => add(post.publishedAt, "post", post.title));
  projects.forEach((project) => add(project.updatedAt, "project", project.title));
  moments.forEach((moment) => add(moment.publishedAt, "moment", moment.content));
  photos.forEach((photo) => add(photo.takenAt ?? photo.publishedAt, "photo", photo.alt));

  return Array.from(markers, ([date, marker]) => ({
    date,
    count: marker.count,
    types: Array.from(marker.types),
    labels: marker.labels,
  })).sort((left, right) => left.date.localeCompare(right.date));
}

export async function getGardenAdminStats() {
  const [
    albums,
    photos,
    moments,
    musicTracks,
    playlists,
    guestbookMessages,
    friendLinks,
    pendingMomentComments,
    pendingGuestbookMessages,
    uploadedAudio,
    remoteAudio,
  ] = await db.$transaction([
    db.photoAlbum.count(),
    db.photo.count(),
    db.moment.count(),
    db.musicTrack.count(),
    db.playlist.count(),
    db.guestbookMessage.count(),
    db.friendLink.count(),
    db.momentComment.count({ where: { status: "PENDING" } }),
    db.guestbookMessage.count({ where: { status: "PENDING" } }),
    db.musicTrack.count({ where: { sourceType: "UPLOAD" } }),
    db.musicTrack.count({ where: { sourceType: "REMOTE" } }),
  ]);
  return {
    content: { albums, photos, moments, musicTracks, playlists, guestbookMessages, friendLinks },
    moderation: {
      momentComments: pendingMomentComments,
      guestbookMessages: pendingGuestbookMessages,
      total: pendingMomentComments + pendingGuestbookMessages,
    },
    audio: { uploaded: uploadedAudio, remote: remoteAudio },
  };
}

export const getGardenAdminOverview = getGardenAdminStats;
