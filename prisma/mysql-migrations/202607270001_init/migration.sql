-- MySQL 8.0+ initial schema. Run through Prisma with schema.mysql.prisma.
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE `User` (
  `id` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `passwordHash` VARCHAR(255) NOT NULL,
  `role` ENUM('ADMIN','EDITOR') NOT NULL DEFAULT 'ADMIN',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `User_email_key` (`email`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Session` (
  `id` VARCHAR(191) NOT NULL,
  `tokenHash` VARCHAR(64) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `lastSeenAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `ipHash` VARCHAR(64) NULL,
  `userAgent` VARCHAR(512) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Session_tokenHash_key` (`tokenHash`),
  INDEX `Session_userId_idx` (`userId`),
  INDEX `Session_expiresAt_idx` (`expiresAt`),
  CONSTRAINT `Session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `LoginAttempt` (
  `id` VARCHAR(191) NOT NULL,
  `key` VARCHAR(191) NOT NULL,
  `succeeded` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `LoginAttempt_key_createdAt_idx` (`key`, `createdAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Category` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(80) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `description` VARCHAR(500) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Category_name_key` (`name`),
  UNIQUE INDEX `Category_slug_key` (`slug`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Tag` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(80) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Tag_name_key` (`name`),
  UNIQUE INDEX `Tag_slug_key` (`slug`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Post` (
  `id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(220) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `excerpt` VARCHAR(500) NOT NULL,
  `content` LONGTEXT NOT NULL,
  `coverImage` VARCHAR(500) NULL,
  `coverAlt` VARCHAR(255) NULL,
  `status` ENUM('DRAFT','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  `featured` BOOLEAN NOT NULL DEFAULT false,
  `readingMinutes` INTEGER NOT NULL DEFAULT 5,
  `viewCount` INTEGER NOT NULL DEFAULT 0,
  `seoTitle` VARCHAR(220) NULL,
  `seoDescription` VARCHAR(500) NULL,
  `categoryId` VARCHAR(191) NOT NULL,
  `publishedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Post_slug_key` (`slug`),
  INDEX `Post_status_publishedAt_idx` (`status`, `publishedAt`),
  INDEX `Post_categoryId_idx` (`categoryId`),
  INDEX `Post_featured_idx` (`featured`),
  CONSTRAINT `Post_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `PostTag` (
  `postId` VARCHAR(191) NOT NULL,
  `tagId` VARCHAR(191) NOT NULL,
  PRIMARY KEY (`postId`, `tagId`),
  INDEX `PostTag_tagId_idx` (`tagId`),
  CONSTRAINT `PostTag_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `PostTag_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `Tag` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Project` (
  `id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(220) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `summary` VARCHAR(500) NOT NULL,
  `body` LONGTEXT NOT NULL,
  `coverImage` VARCHAR(500) NULL,
  `coverAlt` VARCHAR(255) NULL,
  `galleryJson` LONGTEXT NOT NULL,
  `technologyJson` TEXT NOT NULL,
  `demoUrl` VARCHAR(500) NULL,
  `sourceUrl` VARCHAR(500) NULL,
  `status` ENUM('DRAFT','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  `featured` BOOLEAN NOT NULL DEFAULT false,
  `seoTitle` VARCHAR(220) NULL,
  `seoDescription` VARCHAR(500) NULL,
  `publishedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Project_slug_key` (`slug`),
  INDEX `Project_status_publishedAt_idx` (`status`, `publishedAt`),
  INDEX `Project_featured_idx` (`featured`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ProjectTag` (
  `projectId` VARCHAR(191) NOT NULL,
  `tagId` VARCHAR(191) NOT NULL,
  PRIMARY KEY (`projectId`, `tagId`),
  INDEX `ProjectTag_tagId_idx` (`tagId`),
  CONSTRAINT `ProjectTag_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ProjectTag_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `Tag` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Media` (
  `id` VARCHAR(191) NOT NULL,
  `originalName` VARCHAR(255) NOT NULL,
  `storedName` VARCHAR(191) NOT NULL,
  `mimeType` VARCHAR(80) NOT NULL,
  `size` INTEGER NOT NULL,
  `width` INTEGER NULL,
  `height` INTEGER NULL,
  `alt` VARCHAR(255) NOT NULL,
  `url` VARCHAR(500) NOT NULL,
  `variantsJson` TEXT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Media_storedName_key` (`storedName`),
  UNIQUE INDEX `Media_url_key` (`url`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Comment` (
  `id` VARCHAR(191) NOT NULL,
  `postId` VARCHAR(191) NOT NULL,
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
  INDEX `Comment_postId_status_createdAt_idx` (`postId`, `status`, `createdAt`),
  INDEX `Comment_parentId_idx` (`parentId`),
  INDEX `Comment_ipHash_createdAt_idx` (`ipHash`, `createdAt`),
  CONSTRAINT `Comment_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Comment_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Comment` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `TimelineEvent` (
  `id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(160) NOT NULL,
  `description` VARCHAR(600) NOT NULL,
  `dateLabel` VARCHAR(80) NULL,
  `phase` VARCHAR(80) NOT NULL,
  `position` INTEGER NOT NULL DEFAULT 0,
  `visible` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `TimelineEvent_visible_position_idx` (`visible`, `position`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `SiteSetting` (
  `id` VARCHAR(191) NOT NULL,
  `key` VARCHAR(191) NOT NULL,
  `value` LONGTEXT NOT NULL,
  `group` VARCHAR(80) NOT NULL DEFAULT 'general',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `SiteSetting_key_key` (`key`),
  INDEX `SiteSetting_group_idx` (`group`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ContactMessage` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `subject` VARCHAR(220) NOT NULL,
  `message` TEXT NOT NULL,
  `status` ENUM('NEW','READ','ARCHIVED') NOT NULL DEFAULT 'NEW',
  `ipHash` VARCHAR(64) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `ContactMessage_status_createdAt_idx` (`status`, `createdAt`),
  INDEX `ContactMessage_ipHash_createdAt_idx` (`ipHash`, `createdAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Subscriber` (
  `id` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `status` ENUM('ACTIVE','UNSUBSCRIBED') NOT NULL DEFAULT 'ACTIVE',
  `ipHash` VARCHAR(64) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Subscriber_email_key` (`email`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `PageView` (
  `id` VARCHAR(191) NOT NULL,
  `path` VARCHAR(500) NOT NULL,
  `visitorHash` VARCHAR(64) NULL,
  `postId` VARCHAR(191) NULL,
  `projectId` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `PageView_path_createdAt_idx` (`path`, `createdAt`),
  INDEX `PageView_postId_createdAt_idx` (`postId`, `createdAt`),
  INDEX `PageView_projectId_createdAt_idx` (`projectId`, `createdAt`),
  INDEX `PageView_visitorHash_createdAt_idx` (`visitorHash`, `createdAt`),
  CONSTRAINT `PageView_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `PageView_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
