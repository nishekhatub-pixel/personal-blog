import { Images } from "lucide-react";
import type { Metadata } from "next";
import { Pagination } from "@/components/content/pagination";
import { PetalField } from "@/components/site/atmosphere/petal-field";
import { AlbumCard } from "@/components/site/photos/album-card";
import { getPublishedPhotoAlbums } from "@/lib/garden-data";

export const metadata: Metadata = {
  title: "照片墙",
  description: "R7 的照片相册，保存日常画面，也保存画面背后的时间。",
  alternates: { canonical: "/photos" },
};
export const dynamic = "force-dynamic";

function pageNumber(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? "1", 10);
  return Number.isFinite(parsed) ? Math.max(1, parsed) : 1;
}

export default async function PhotosPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const query = await searchParams;
  const albums = await getPublishedPhotoAlbums({
    page: pageNumber(query.page),
    pageSize: 9,
  });

  return (
    <main id="main-content">
      <PetalField className="opacity-35" seed="r7-photos" />
      <header className="px-[var(--page-gutter)] pb-12 pt-[clamp(3.5rem,8vw,7rem)]">
        <div className="mx-auto max-w-[var(--content-max)]">
          <p className="mb-4 text-sm font-semibold text-[var(--accent)]">
            真实相册
          </p>
          <h1 className="max-w-4xl text-[clamp(3rem,7vw,6rem)] font-black leading-[.92] tracking-[-.07em]">
            照片墙
          </h1>
          <div className="mt-6 flex flex-wrap items-end justify-between gap-5">
            <p className="max-w-[58ch] text-lg leading-8 text-[var(--muted)]">
              保存日常照片，也保留照片背后的时间。每一本相册只展示真实发布的内容。
            </p>
            <p className="font-mono text-sm text-[var(--muted)]">
              {albums.total} 本公开相册
            </p>
          </div>
        </div>
      </header>

      <section
        className="px-[var(--page-gutter)] pb-[clamp(5rem,10vw,9rem)]"
        aria-labelledby="album-list-heading"
      >
        <div className="mx-auto max-w-[var(--content-max)]">
          <h2 id="album-list-heading" className="sr-only">
            相册列表
          </h2>
          {albums.items.length ? (
            <>
              <div className="grid gap-[var(--garden-gap,1.25rem)] md:grid-cols-2 xl:grid-cols-12">
                {albums.items.map((album, index) => {
                  const featured = album.featured && index === 0;
                  const span = featured
                    ? "md:col-span-2 xl:col-span-7"
                    : index % 4 === 1
                      ? "xl:col-span-5"
                      : index % 4 === 2
                        ? "xl:col-span-4"
                        : "xl:col-span-6";
                  return (
                    <div key={album.id} className={span}>
                      <AlbumCard album={album} featured={featured} />
                    </div>
                  );
                })}
              </div>
              <Pagination page={albums.page} totalPages={albums.totalPages} />
            </>
          ) : (
            <div className="relative isolate grid min-h-[26rem] place-items-center overflow-hidden rounded-[var(--radius-panel,1.125rem)] border border-[var(--line)] bg-[var(--surface)] px-6 text-center shadow-[var(--shadow)]">
              <div className="grid max-w-xl justify-items-center">
                <span className="grid size-16 place-items-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                  <Images aria-hidden size={29} strokeWidth={1.4} />
                </span>
                <h2 className="mt-6 text-[clamp(2rem,4vw,3.2rem)] font-semibold tracking-[-.05em]">
                  第一组照片还在整理
                </h2>
                <p className="mt-4 max-w-[44ch] leading-8 text-[var(--muted)]">
                  这里不会用示意图片填满版面。等真实相册发布后，它会从这里开始生长。
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
