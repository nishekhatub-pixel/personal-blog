import { ArrowUpRight, CalendarDays, Images, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { PublicPhotoAlbum } from "@/lib/garden-data";

function formatDate(value: Date | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(value);
}

export function AlbumCard({
  album,
  featured = false,
}: {
  album: PublicPhotoAlbum;
  featured?: boolean;
}) {
  const date = formatDate(album.recordDate ?? album.publishedAt);

  return (
    <article className="group h-full overflow-hidden rounded-[var(--radius-panel,1.125rem)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow)]">
      <Link
        href={`/photos/${album.slug}`}
        className="flex h-full min-h-11 flex-col focus-visible:outline-offset-[-3px]"
        aria-label={`查看相册：${album.title}`}
      >
        {album.coverMedia ? (
          <div
            className={`relative overflow-hidden bg-[var(--surface-strong)] ${
              featured ? "aspect-[16/9]" : "aspect-[4/3]"
            }`}
          >
            <Image
              src={album.coverMedia.url}
              alt={album.coverMedia.alt || `${album.title}封面`}
              fill
              sizes={
                featured
                  ? "(max-width: 768px) 100vw, (max-width: 1280px) 66vw, 58vw"
                  : "(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 34vw"
              }
              className="object-cover transition-transform duration-500 group-hover:scale-[1.025]"
            />
          </div>
        ) : (
          <div
            className={`grid place-items-center bg-[var(--surface-strong)] ${
              featured ? "aspect-[16/9]" : "aspect-[4/3]"
            }`}
          >
            <div className="grid justify-items-center gap-3 text-[var(--muted)]">
              <Images aria-hidden size={32} strokeWidth={1.4} />
              <span className="text-sm">暂未设置封面</span>
            </div>
          </div>
        )}

        <div className="flex flex-1 flex-col p-5 md:p-6">
          <div className="flex items-start justify-between gap-5">
            <div>
              {album.featured ? (
                <p className="mb-2 text-sm font-semibold text-[var(--accent)]">精选相册</p>
              ) : null}
              <h2 className="text-[clamp(1.45rem,2.4vw,2rem)] font-semibold tracking-[-.045em]">
                {album.title}
              </h2>
            </div>
            <ArrowUpRight
              aria-hidden
              className="mt-1 shrink-0 text-[var(--accent)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              size={21}
              strokeWidth={1.6}
            />
          </div>

          {album.description ? (
            <p className="mt-3 line-clamp-2 max-w-[62ch] text-[var(--muted)]">
              {album.description}
            </p>
          ) : null}

          <dl className="mt-auto flex flex-wrap gap-x-5 gap-y-2 pt-6 text-sm text-[var(--muted)]">
            <div className="flex items-center gap-2">
              <Images aria-hidden size={16} strokeWidth={1.6} />
              <dt className="sr-only">照片数量</dt>
              <dd>{album._count.photos} 张</dd>
            </div>
            {date ? (
              <div className="flex items-center gap-2">
                <CalendarDays aria-hidden size={16} strokeWidth={1.6} />
                <dt className="sr-only">记录日期</dt>
                <dd>{date}</dd>
              </div>
            ) : null}
            {album.city ? (
              <div className="flex items-center gap-2">
                <MapPin aria-hidden size={16} strokeWidth={1.6} />
                <dt className="sr-only">城市</dt>
                <dd>{album.city}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      </Link>
    </article>
  );
}
