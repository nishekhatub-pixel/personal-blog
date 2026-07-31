-- Keep photos when an album is deleted, and allow photos to live directly in
-- the public photo wall without an album.
ALTER TABLE "Photo" DROP CONSTRAINT "Photo_albumId_fkey";
ALTER TABLE "Photo" ALTER COLUMN "albumId" DROP NOT NULL;
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_albumId_fkey"
  FOREIGN KEY ("albumId") REFERENCES "PhotoAlbum"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Homepage hero slides reference the media library directly, independently of
-- photos and albums.
CREATE TABLE "HeroSlide" (
  "id" TEXT NOT NULL,
  "mediaId" TEXT NOT NULL,
  "alt" TEXT NOT NULL,
  "position" INTEGER NOT NULL DEFAULT 0,
  "visible" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HeroSlide_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HeroSlide_mediaId_key" ON "HeroSlide"("mediaId");
CREATE INDEX "HeroSlide_visible_position_idx" ON "HeroSlide"("visible", "position");

ALTER TABLE "HeroSlide" ADD CONSTRAINT "HeroSlide_mediaId_fkey"
  FOREIGN KEY ("mediaId") REFERENCES "Media"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
