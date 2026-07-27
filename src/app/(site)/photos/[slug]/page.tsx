import { ArrowLeft, CalendarDays, Images, MapPin } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PetalField } from "@/components/site/atmosphere/petal-field";
import {
  PhotoLightbox,
  type LightboxPhoto,
} from "@/components/site/photos/photo-lightbox";
import { getPhotoAlbumBySlug } from "@/lib/garden-data";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(value);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const album = await getPhotoAlbumBySlug(slug);
  if (!album) return { title: "相册未找到" };
  return {
    title: album.title,
    description:
      album.description ||
      `${album.title}，R7 照片墙中的公开相册，共 ${album.photos.length} 张照片。`,
    alternates: { canonical: `/photos/${album.slug}` },
  };
}

export default async function PhotoAlbumPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const album = await getPhotoAlbumBySlug(slug);
  if (!album) notFound();

  const recordDate = formatDate(album.recordDate ?? album.publishedAt);
  const photos: LightboxPhoto[] = album.photos.map((photo) => ({
    id: photo.id,
    url: photo.media.url,
    width: photo.media.width ?? 1600,
    height: photo.media.height ?? 1200,
    alt: photo.alt || photo.media.alt,
    caption: photo.caption,
    dateLabel: formatDate(photo.takenAt ?? photo.publishedAt),
    location: photo.location,
  }));

  return (
    <main id="main-content">
      <PetalField className="opacity-25" seed={`r7-album-${album.slug}`} />
      <header className="px-[var(--page-gutter)] pb-12 pt-[clamp(3rem,7vw,6rem)]">
        <div className="mx-auto max-w-[var(--content-max)]">
          <Link
            href="/photos"
            className="inline-flex min-h-11 items-center gap-2 font-semibold text-[var(--muted)] hover:text-[var(--accent)]"
          >
            <ArrowLeft aria-hidden size={18} />
            返回照片墙
          </Link>
          <h1 className="mt-6 max-w-5xl text-[clamp(2.8rem,6vw,5.6rem)] font-black leading-[.94] tracking-[-.065em]">
            {album.title}
          </h1>
          {album.description ? (
            <p className="mt-6 max-w-[66ch] text-lg leading-8 text-[var(--muted)]">
              {album.description}
            </p>
          ) : null}
          <dl className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm text-[var(--muted)]">
            <div className="flex items-center gap-2">
              <Images aria-hidden size={17} />
              <dt className="sr-only">照片数量</dt>
              <dd>{photos.length} 张照片</dd>
            </div>
            {recordDate ? (
              <div className="flex items-center gap-2">
                <CalendarDays aria-hidden size={17} />
                <dt className="sr-only">记录日期</dt>
                <dd>{recordDate}</dd>
              </div>
            ) : null}
            {album.city ? (
              <div className="flex items-center gap-2">
                <MapPin aria-hidden size={17} />
                <dt className="sr-only">城市</dt>
                <dd>{album.city}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      </header>

      <section
        className="px-[var(--page-gutter)] pb-[clamp(5rem,10vw,9rem)]"
        aria-labelledby="album-photos-heading"
      >
        <div className="mx-auto max-w-[var(--content-max)]">
          <h2 id="album-photos-heading" className="sr-only">
            相册照片
          </h2>
          {photos.length ? (
            <PhotoLightbox photos={photos} />
          ) : (
            <div className="grid min-h-80 place-items-center rounded-[var(--radius-panel,1.125rem)] border border-[var(--line)] bg-[var(--surface)] px-6 text-center">
              <div className="max-w-lg">
                <Images
                  aria-hidden
                  className="mx-auto text-[var(--accent)]"
                  size={32}
                  strokeWidth={1.4}
                />
                <h2 className="mt-5 text-3xl font-semibold tracking-[-.045em]">
                  这本相册还没有公开照片
                </h2>
                <p className="mt-4 leading-7 text-[var(--muted)]">
                  相册信息已经发布，照片会在整理完成后出现在这里。
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
