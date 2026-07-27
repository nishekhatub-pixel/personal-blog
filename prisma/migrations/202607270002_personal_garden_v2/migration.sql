-- Personal Garden V2: albums, moments, music, guestbook, and friend links.
-- This migration only creates new tables and indexes. Existing content is unchanged.

CREATE TABLE "PhotoAlbum" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "coverMediaId" TEXT,
    "recordDate" DATETIME,
    "city" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PhotoAlbum_coverMediaId_fkey" FOREIGN KEY ("coverMediaId") REFERENCES "Media" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "Photo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "albumId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "caption" TEXT,
    "takenAt" DATETIME,
    "location" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Photo_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "PhotoAlbum" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Photo_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "Moment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "mood" TEXT,
    "weather" TEXT,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "MomentMedia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "momentId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "caption" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MomentMedia_momentId_fkey" FOREIGN KEY ("momentId") REFERENCES "Moment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MomentMedia_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "MomentComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "momentId" TEXT NOT NULL,
    "parentId" TEXT,
    "authorName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "ipHash" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MomentComment_momentId_fkey" FOREIGN KEY ("momentId") REFERENCES "Moment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MomentComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "MomentComment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "MomentReaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "momentId" TEXT NOT NULL,
    "visitorHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MomentReaction_momentId_fkey" FOREIGN KEY ("momentId") REFERENCES "Moment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "MusicTrack" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "artist" TEXT,
    "album" TEXT,
    "sourceType" TEXT NOT NULL,
    "audioUrl" TEXT NOT NULL,
    "originalName" TEXT,
    "storedName" TEXT,
    "mimeType" TEXT,
    "size" INTEGER,
    "durationSeconds" INTEGER,
    "coverMediaId" TEXT,
    "lyrics" TEXT,
    "note" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MusicTrack_coverMediaId_fkey" FOREIGN KEY ("coverMediaId") REFERENCES "Media" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "Playlist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "coverMediaId" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Playlist_coverMediaId_fkey" FOREIGN KEY ("coverMediaId") REFERENCES "Media" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "PlaylistTrack" (
    "playlistId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlaylistTrack_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PlaylistTrack_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "MusicTrack" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY ("playlistId", "trackId")
);

CREATE TABLE "GuestbookMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nickname" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "website" TEXT,
    "colorKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "replyContent" TEXT,
    "repliedAt" DATETIME,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "FriendLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "contact" TEXT,
    "tagsJson" TEXT NOT NULL DEFAULT '[]',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "PhotoAlbum_slug_key" ON "PhotoAlbum"("slug");
CREATE INDEX "PhotoAlbum_status_featured_position_publishedAt_idx" ON "PhotoAlbum"("status", "featured", "position", "publishedAt");
CREATE INDEX "PhotoAlbum_coverMediaId_idx" ON "PhotoAlbum"("coverMediaId");
CREATE INDEX "PhotoAlbum_recordDate_idx" ON "PhotoAlbum"("recordDate");

CREATE UNIQUE INDEX "Photo_albumId_mediaId_key" ON "Photo"("albumId", "mediaId");
CREATE INDEX "Photo_albumId_status_position_publishedAt_idx" ON "Photo"("albumId", "status", "position", "publishedAt");
CREATE INDEX "Photo_mediaId_idx" ON "Photo"("mediaId");
CREATE INDEX "Photo_takenAt_idx" ON "Photo"("takenAt");

CREATE INDEX "Moment_status_pinned_publishedAt_idx" ON "Moment"("status", "pinned", "publishedAt");
CREATE INDEX "Moment_createdAt_idx" ON "Moment"("createdAt");

CREATE UNIQUE INDEX "MomentMedia_momentId_mediaId_key" ON "MomentMedia"("momentId", "mediaId");
CREATE INDEX "MomentMedia_momentId_position_idx" ON "MomentMedia"("momentId", "position");
CREATE INDEX "MomentMedia_mediaId_idx" ON "MomentMedia"("mediaId");

CREATE INDEX "MomentComment_momentId_status_createdAt_idx" ON "MomentComment"("momentId", "status", "createdAt");
CREATE INDEX "MomentComment_parentId_idx" ON "MomentComment"("parentId");
CREATE INDEX "MomentComment_ipHash_createdAt_idx" ON "MomentComment"("ipHash", "createdAt");

CREATE UNIQUE INDEX "MomentReaction_momentId_visitorHash_key" ON "MomentReaction"("momentId", "visitorHash");
CREATE INDEX "MomentReaction_momentId_createdAt_idx" ON "MomentReaction"("momentId", "createdAt");
CREATE INDEX "MomentReaction_visitorHash_createdAt_idx" ON "MomentReaction"("visitorHash", "createdAt");

CREATE UNIQUE INDEX "MusicTrack_audioUrl_key" ON "MusicTrack"("audioUrl");
CREATE UNIQUE INDEX "MusicTrack_storedName_key" ON "MusicTrack"("storedName");
CREATE INDEX "MusicTrack_status_featured_favorite_publishedAt_idx" ON "MusicTrack"("status", "featured", "favorite", "publishedAt");
CREATE INDEX "MusicTrack_sourceType_idx" ON "MusicTrack"("sourceType");
CREATE INDEX "MusicTrack_coverMediaId_idx" ON "MusicTrack"("coverMediaId");

CREATE UNIQUE INDEX "Playlist_slug_key" ON "Playlist"("slug");
CREATE INDEX "Playlist_status_featured_position_publishedAt_idx" ON "Playlist"("status", "featured", "position", "publishedAt");
CREATE INDEX "Playlist_coverMediaId_idx" ON "Playlist"("coverMediaId");

CREATE UNIQUE INDEX "PlaylistTrack_playlistId_position_key" ON "PlaylistTrack"("playlistId", "position");
CREATE INDEX "PlaylistTrack_trackId_idx" ON "PlaylistTrack"("trackId");

CREATE INDEX "GuestbookMessage_status_pinned_createdAt_idx" ON "GuestbookMessage"("status", "pinned", "createdAt");
CREATE INDEX "GuestbookMessage_ipHash_createdAt_idx" ON "GuestbookMessage"("ipHash", "createdAt");

CREATE UNIQUE INDEX "FriendLink_url_key" ON "FriendLink"("url");
CREATE INDEX "FriendLink_status_featured_position_publishedAt_idx" ON "FriendLink"("status", "featured", "position", "publishedAt");
