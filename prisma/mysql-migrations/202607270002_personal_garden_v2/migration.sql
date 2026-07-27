-- MySQL 8.0+ Personal Garden V2 migration.
-- Creates only new business tables and preserves all existing rows.
SET NAMES utf8mb4;

CREATE TABLE `PhotoAlbum` (
  `id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(160) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `coverMediaId` VARCHAR(191) NULL,
  `recordDate` DATETIME(3) NULL,
  `city` VARCHAR(120) NULL,
  `featured` BOOLEAN NOT NULL DEFAULT false,
  `position` INTEGER NOT NULL DEFAULT 0,
  `status` ENUM('DRAFT','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  `publishedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `PhotoAlbum_slug_key` (`slug`),
  INDEX `PhotoAlbum_status_featured_position_publishedAt_idx` (`status`, `featured`, `position`, `publishedAt`),
  INDEX `PhotoAlbum_coverMediaId_idx` (`coverMediaId`),
  INDEX `PhotoAlbum_recordDate_idx` (`recordDate`),
  CONSTRAINT `PhotoAlbum_coverMediaId_fkey` FOREIGN KEY (`coverMediaId`) REFERENCES `Media` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Photo` (
  `id` VARCHAR(191) NOT NULL,
  `albumId` VARCHAR(191) NOT NULL,
  `mediaId` VARCHAR(191) NOT NULL,
  `alt` VARCHAR(255) NOT NULL,
  `caption` TEXT NULL,
  `takenAt` DATETIME(3) NULL,
  `location` VARCHAR(255) NULL,
  `position` INTEGER NOT NULL DEFAULT 0,
  `status` ENUM('DRAFT','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  `publishedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Photo_albumId_mediaId_key` (`albumId`, `mediaId`),
  INDEX `Photo_albumId_status_position_publishedAt_idx` (`albumId`, `status`, `position`, `publishedAt`),
  INDEX `Photo_mediaId_idx` (`mediaId`),
  INDEX `Photo_takenAt_idx` (`takenAt`),
  CONSTRAINT `Photo_albumId_fkey` FOREIGN KEY (`albumId`) REFERENCES `PhotoAlbum` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Photo_mediaId_fkey` FOREIGN KEY (`mediaId`) REFERENCES `Media` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Moment` (
  `id` VARCHAR(191) NOT NULL,
  `content` TEXT NOT NULL,
  `mood` VARCHAR(80) NULL,
  `weather` VARCHAR(120) NULL,
  `pinned` BOOLEAN NOT NULL DEFAULT false,
  `status` ENUM('DRAFT','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  `publishedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `Moment_status_pinned_publishedAt_idx` (`status`, `pinned`, `publishedAt`),
  INDEX `Moment_createdAt_idx` (`createdAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `MomentMedia` (
  `id` VARCHAR(191) NOT NULL,
  `momentId` VARCHAR(191) NOT NULL,
  `mediaId` VARCHAR(191) NOT NULL,
  `alt` VARCHAR(255) NOT NULL,
  `caption` VARCHAR(500) NULL,
  `position` INTEGER NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `MomentMedia_momentId_mediaId_key` (`momentId`, `mediaId`),
  INDEX `MomentMedia_momentId_position_idx` (`momentId`, `position`),
  INDEX `MomentMedia_mediaId_idx` (`mediaId`),
  CONSTRAINT `MomentMedia_momentId_fkey` FOREIGN KEY (`momentId`) REFERENCES `Moment` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `MomentMedia_mediaId_fkey` FOREIGN KEY (`mediaId`) REFERENCES `Media` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `MomentComment` (
  `id` VARCHAR(191) NOT NULL,
  `momentId` VARCHAR(191) NOT NULL,
  `parentId` VARCHAR(191) NULL,
  `authorName` VARCHAR(100) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `content` TEXT NOT NULL,
  `status` ENUM('PENDING','APPROVED','HIDDEN','SPAM') NOT NULL DEFAULT 'PENDING',
  `ipHash` VARCHAR(64) NULL,
  `userAgent` VARCHAR(512) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `MomentComment_momentId_status_createdAt_idx` (`momentId`, `status`, `createdAt`),
  INDEX `MomentComment_parentId_idx` (`parentId`),
  INDEX `MomentComment_ipHash_createdAt_idx` (`ipHash`, `createdAt`),
  CONSTRAINT `MomentComment_momentId_fkey` FOREIGN KEY (`momentId`) REFERENCES `Moment` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `MomentComment_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `MomentComment` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `MomentReaction` (
  `id` VARCHAR(191) NOT NULL,
  `momentId` VARCHAR(191) NOT NULL,
  `visitorHash` VARCHAR(64) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `MomentReaction_momentId_visitorHash_key` (`momentId`, `visitorHash`),
  INDEX `MomentReaction_momentId_createdAt_idx` (`momentId`, `createdAt`),
  INDEX `MomentReaction_visitorHash_createdAt_idx` (`visitorHash`, `createdAt`),
  CONSTRAINT `MomentReaction_momentId_fkey` FOREIGN KEY (`momentId`) REFERENCES `Moment` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `MusicTrack` (
  `id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(220) NOT NULL,
  `artist` VARCHAR(160) NULL,
  `album` VARCHAR(160) NULL,
  `sourceType` ENUM('UPLOAD','REMOTE') NOT NULL,
  `audioUrl` VARCHAR(500) NOT NULL,
  `originalName` VARCHAR(255) NULL,
  `storedName` VARCHAR(191) NULL,
  `mimeType` VARCHAR(80) NULL,
  `size` INTEGER NULL,
  `durationSeconds` INTEGER NULL,
  `coverMediaId` VARCHAR(191) NULL,
  `lyrics` LONGTEXT NULL,
  `note` TEXT NULL,
  `featured` BOOLEAN NOT NULL DEFAULT false,
  `favorite` BOOLEAN NOT NULL DEFAULT false,
  `status` ENUM('DRAFT','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  `publishedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `MusicTrack_audioUrl_key` (`audioUrl`),
  UNIQUE INDEX `MusicTrack_storedName_key` (`storedName`),
  INDEX `MusicTrack_status_featured_favorite_publishedAt_idx` (`status`, `featured`, `favorite`, `publishedAt`),
  INDEX `MusicTrack_sourceType_idx` (`sourceType`),
  INDEX `MusicTrack_coverMediaId_idx` (`coverMediaId`),
  CONSTRAINT `MusicTrack_coverMediaId_fkey` FOREIGN KEY (`coverMediaId`) REFERENCES `Media` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Playlist` (
  `id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(180) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `coverMediaId` VARCHAR(191) NULL,
  `featured` BOOLEAN NOT NULL DEFAULT false,
  `position` INTEGER NOT NULL DEFAULT 0,
  `status` ENUM('DRAFT','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  `publishedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Playlist_slug_key` (`slug`),
  INDEX `Playlist_status_featured_position_publishedAt_idx` (`status`, `featured`, `position`, `publishedAt`),
  INDEX `Playlist_coverMediaId_idx` (`coverMediaId`),
  CONSTRAINT `Playlist_coverMediaId_fkey` FOREIGN KEY (`coverMediaId`) REFERENCES `Media` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `PlaylistTrack` (
  `playlistId` VARCHAR(191) NOT NULL,
  `trackId` VARCHAR(191) NOT NULL,
  `position` INTEGER NOT NULL DEFAULT 0,
  `note` VARCHAR(500) NULL,
  `addedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`playlistId`, `trackId`),
  UNIQUE INDEX `PlaylistTrack_playlistId_position_key` (`playlistId`, `position`),
  INDEX `PlaylistTrack_trackId_idx` (`trackId`),
  CONSTRAINT `PlaylistTrack_playlistId_fkey` FOREIGN KEY (`playlistId`) REFERENCES `Playlist` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `PlaylistTrack_trackId_fkey` FOREIGN KEY (`trackId`) REFERENCES `MusicTrack` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `GuestbookMessage` (
  `id` VARCHAR(191) NOT NULL,
  `nickname` VARCHAR(80) NOT NULL,
  `content` TEXT NOT NULL,
  `website` VARCHAR(500) NULL,
  `colorKey` VARCHAR(32) NOT NULL,
  `status` ENUM('PENDING','APPROVED','HIDDEN','SPAM') NOT NULL DEFAULT 'PENDING',
  `pinned` BOOLEAN NOT NULL DEFAULT false,
  `replyContent` TEXT NULL,
  `repliedAt` DATETIME(3) NULL,
  `ipHash` VARCHAR(64) NULL,
  `userAgent` VARCHAR(512) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `GuestbookMessage_status_pinned_createdAt_idx` (`status`, `pinned`, `createdAt`),
  INDEX `GuestbookMessage_ipHash_createdAt_idx` (`ipHash`, `createdAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `FriendLink` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `url` VARCHAR(500) NOT NULL,
  `description` VARCHAR(500) NOT NULL,
  `avatarUrl` VARCHAR(500) NULL,
  `contact` VARCHAR(255) NULL,
  `tagsJson` TEXT NOT NULL DEFAULT ('[]'),
  `featured` BOOLEAN NOT NULL DEFAULT false,
  `position` INTEGER NOT NULL DEFAULT 0,
  `status` ENUM('DRAFT','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  `publishedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `FriendLink_url_key` (`url`),
  INDEX `FriendLink_status_featured_position_publishedAt_idx` (`status`, `featured`, `position`, `publishedAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
