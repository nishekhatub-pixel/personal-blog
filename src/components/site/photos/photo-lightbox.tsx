"use client";

import { ArrowLeft, ArrowRight, CalendarDays, MapPin, X } from "lucide-react";
import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";

export type LightboxPhoto = {
  id: string;
  url: string;
  width: number;
  height: number;
  alt: string;
  caption: string | null;
  dateLabel: string | null;
  location: string | null;
};

export function PhotoLightbox({ photos }: { photos: LightboxPhoto[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const isOpen = activeIndex !== null;

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setActiveIndex(null);
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setActiveIndex((current) =>
          current === null ? 0 : (current - 1 + photos.length) % photos.length,
        );
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setActiveIndex((current) =>
          current === null ? 0 : (current + 1) % photos.length,
        );
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      triggerRef.current?.focus();
    };
  }, [isOpen, photos.length]);

  const openPhoto = (
    index: number,
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    triggerRef.current = event.currentTarget;
    setActiveIndex(index);
  };

  const activePhoto = activeIndex === null ? null : photos[activeIndex];

  return (
    <>
      <ol className="columns-1 gap-5 sm:columns-2 lg:columns-3">
        {photos.map((photo, index) => (
          <li
            id={`photo-${photo.id}`}
            key={photo.id}
            className="mb-5 break-inside-avoid overflow-hidden rounded-[var(--radius-media,.75rem)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow)]"
          >
            <button
              type="button"
              onClick={(event) => openPhoto(index, event)}
              className="group block min-h-11 w-full cursor-zoom-in overflow-hidden bg-[var(--surface-strong)] text-left"
              aria-label={`查看大图：${photo.alt}`}
            >
              <Image
                src={photo.url}
                width={photo.width}
                height={photo.height}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 34vw"
                alt={photo.alt}
                priority={index < 2}
                className="h-auto w-full transition-transform duration-500 group-hover:scale-[1.015]"
              />
            </button>
            <div className="p-4">
              {photo.caption ? (
                <p className="leading-7">{photo.caption}</p>
              ) : (
                <p className="leading-7 text-[var(--muted)]">{photo.alt}</p>
              )}
              {photo.dateLabel || photo.location ? (
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[var(--muted)]">
                  {photo.dateLabel ? (
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays aria-hidden size={15} />
                      {photo.dateLabel}
                    </span>
                  ) : null}
                  {photo.location ? (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin aria-hidden size={15} />
                      {photo.location}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
          </li>
        ))}
      </ol>

      {activePhoto ? (
        <div
          className="fixed inset-0 z-[80] grid overflow-y-auto bg-[rgba(24,18,13,.86)] p-3 backdrop-blur-sm md:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setActiveIndex(null);
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="photo-dialog-title"
            className="relative m-auto flex max-h-[calc(100dvh-1.5rem)] w-full max-w-6xl flex-col overflow-hidden rounded-[var(--radius-panel,1.125rem)] bg-[var(--surface)] text-[var(--ink)] shadow-2xl md:max-h-[calc(100dvh-3rem)]"
          >
            <div className="flex min-h-14 items-center justify-between gap-4 border-b border-[var(--line)] px-4">
              <p className="font-mono text-sm text-[var(--muted)]" aria-live="polite">
                {activeIndex! + 1} / {photos.length}
              </p>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setActiveIndex(null)}
                className="inline-flex size-11 items-center justify-center rounded-full border border-[var(--line)] hover:bg-[var(--surface-strong)]"
                aria-label="关闭照片灯箱"
              >
                <X aria-hidden size={22} />
              </button>
            </div>

            <div className="relative flex min-h-0 flex-1 items-center justify-center bg-[var(--surface-strong)] p-3 md:p-6">
              <Image
                key={activePhoto.id}
                src={activePhoto.url}
                width={activePhoto.width}
                height={activePhoto.height}
                sizes="100vw"
                alt={activePhoto.alt}
                className="max-h-[68dvh] w-auto max-w-full object-contain"
                priority
              />
              {photos.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveIndex(
                        (activeIndex! - 1 + photos.length) % photos.length,
                      )
                    }
                    className="absolute left-2 inline-flex size-12 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow)] md:left-5"
                    aria-label="上一张照片"
                  >
                    <ArrowLeft aria-hidden size={22} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveIndex((activeIndex! + 1) % photos.length)
                    }
                    className="absolute right-2 inline-flex size-12 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow)] md:right-5"
                    aria-label="下一张照片"
                  >
                    <ArrowRight aria-hidden size={22} />
                  </button>
                </>
              ) : null}
            </div>

            <div className="max-h-40 overflow-y-auto border-t border-[var(--line)] p-4 md:px-6">
              <h2 id="photo-dialog-title" className="text-lg font-semibold">
                {activePhoto.alt}
              </h2>
              {activePhoto.caption ? (
                <p className="mt-2 text-[var(--muted)]">{activePhoto.caption}</p>
              ) : null}
              {activePhoto.dateLabel || activePhoto.location ? (
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {[activePhoto.dateLabel, activePhoto.location]
                    .filter(Boolean)
                    .join(" / ")}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
