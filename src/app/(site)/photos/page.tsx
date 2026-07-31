import { Camera, Images } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Pagination } from "@/components/content/pagination";
import { PetalField } from "@/components/site/atmosphere/petal-field";
import { PageIntro } from "@/components/site/page-intro";
import {
  PhotoLightbox,
  type LightboxPhoto,
} from "@/components/site/photos/photo-lightbox";
import {
  getPublishedPhotoAlbums,
  getPublishedPhotos,
} from "@/lib/garden-data";

export const metadata: Metadata = {
  title: "照片墙",
  description: "R7 的照片墙，直接浏览日常画面、拍摄时间与相册记录。",
  alternates: { canonical: "/photos" },
};
export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function pageNumber(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? "1", 10);
  return Number.isFinite(parsed) ? Math.max(1, parsed) : 1;
}

function formatDate(value: Date | null) {
  return value ? dateFormatter.format(value) : null;
}

export default async function PhotosPage({
  searchParams,
}: {
  searchParams: Promise<{
    album?: string | string[];
    page?: string | string[];
  }>;
}) {
  const query = await searchParams;
  const album = Array.isArray(query.album) ? query.album[0] : query.album;
  const [photos, albums] = await Promise.all([
    getPublishedPhotos({
      album,
      page: pageNumber(query.page),
      pageSize: 18,
    }),
    getPublishedPhotoAlbums({ pageSize: 50 }),
  ]);
  const lightboxPhotos: LightboxPhoto[] = photos.items.map((photo) => ({
    albumLabel: photo.album?.title ?? null,
    alt: photo.alt || photo.media.alt,
    caption: photo.caption,
    dateLabel: formatDate(photo.takenAt ?? photo.publishedAt),
    height: photo.media.height ?? 1200,
    id: photo.id,
    location: photo.location,
    url: photo.media.url,
    width: photo.media.width ?? 1600,
  }));
  const activeAlbum = albums.items.find((item) => item.slug === album);

  return (
    <main id="main-content">
      <PetalField className="opacity-35" seed="r7-photos" />
      <PageIntro
        eyebrow="PHOTO NOTES"
        title="照片墙"
        description="不必先翻相册。沿着光线、日期和地点，直接浏览每一张真实照片。"
        actions={
          <p className="font-mono text-sm text-[var(--muted)]">
            {photos.total} 张照片
            {activeAlbum ? ` · ${activeAlbum.title}` : " · 全部相册"}
          </p>
        }
      />

      <section
        aria-labelledby="photo-filter-heading"
        className="px-[var(--page-gutter)] pb-[clamp(5rem,10vw,9rem)]"
      >
        <div className="mx-auto max-w-[var(--content-max)]">
          <div className="mb-8 border-y border-[var(--line)] py-4">
            <h2 className="sr-only" id="photo-filter-heading">
              按相册筛选照片
            </h2>
            <nav
              aria-label="照片相册筛选"
              className="flex max-w-full gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]"
            >
              <Link
                aria-current={!album ? "page" : undefined}
                className={[
                  "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm transition-colors",
                  !album
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--ink)]"
                    : "border-[var(--line)] text-[var(--muted)] hover:border-[var(--muted)] hover:text-[var(--ink)]",
                ].join(" ")}
                href="/photos"
              >
                <Camera aria-hidden size={15} />
                全部照片
              </Link>
              {albums.items.map((item) => (
                <Link
                  aria-current={album === item.slug ? "page" : undefined}
                  className={[
                    "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm transition-colors",
                    album === item.slug
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--ink)]"
                      : "border-[var(--line)] text-[var(--muted)] hover:border-[var(--muted)] hover:text-[var(--ink)]",
                  ].join(" ")}
                  href={`/photos?album=${encodeURIComponent(item.slug)}`}
                  key={item.id}
                >
                  <Images aria-hidden size={15} />
                  {item.title}
                </Link>
              ))}
            </nav>
          </div>

          {lightboxPhotos.length ? (
            <>
              <PhotoLightbox photos={lightboxPhotos} />
              <Pagination
                page={photos.page}
                searchParams={{ album }}
                totalPages={photos.totalPages}
              />
            </>
          ) : (
            <div className="garden-panel grid min-h-[26rem] place-items-center px-6 text-center">
              <div className="grid max-w-xl justify-items-center">
                <span className="grid size-16 place-items-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                  <Images aria-hidden size={29} strokeWidth={1.4} />
                </span>
                <h2 className="mt-6 text-[clamp(2rem,4vw,3.2rem)] font-semibold tracking-[-.05em]">
                  这里还没有公开照片
                </h2>
                <p className="mt-4 max-w-[44ch] leading-8 text-[var(--muted)]">
                  {activeAlbum
                    ? "这个相册还在整理，可以切换到全部照片继续浏览。"
                    : "等第一张真实照片发布后，照片墙会从这里开始生长。"}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
