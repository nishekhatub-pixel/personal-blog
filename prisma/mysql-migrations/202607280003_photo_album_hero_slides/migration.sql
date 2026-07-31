-- Keep photos when an album is deleted, and allow standalone photo-wall items.
ALTER TABLE `Photo` DROP FOREIGN KEY `Photo_albumId_fkey`;
ALTER TABLE `Photo` MODIFY `albumId` VARCHAR(191) NULL;
ALTER TABLE `Photo` ADD CONSTRAINT `Photo_albumId_fkey`
  FOREIGN KEY (`albumId`) REFERENCES `PhotoAlbum`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE `HeroSlide` (
  `id` VARCHAR(191) NOT NULL,
  `mediaId` VARCHAR(191) NOT NULL,
  `alt` VARCHAR(255) NOT NULL,
  `position` INTEGER NOT NULL DEFAULT 0,
  `visible` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `HeroSlide_mediaId_key` (`mediaId`),
  INDEX `HeroSlide_visible_position_idx` (`visible`, `position`),
  CONSTRAINT `HeroSlide_mediaId_fkey` FOREIGN KEY (`mediaId`) REFERENCES `Media`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
