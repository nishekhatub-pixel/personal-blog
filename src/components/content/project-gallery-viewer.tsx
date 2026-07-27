"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export function ProjectGalleryViewer({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const open = active !== null;

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActive(null);
      if (event.key === "ArrowLeft") setActive((value) => value === null ? null : (value - 1 + images.length) % images.length);
      if (event.key === "ArrowRight") setActive((value) => value === null ? null : (value + 1) % images.length);
      if (event.key === "Tab") {
        const controls = dialogRef.current?.querySelectorAll<HTMLElement>("button");
        if (!controls?.length) return;
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus();
    };
  }, [open, images.length]);

  if (!images.length) return null;

  return (
    <>
      <div className="grid gap-4 md:grid-cols-12">
        {images.map((src, index) => (
          <button
            type="button"
            key={`${src}-${index}`}
            className={`group relative overflow-hidden rounded-xl bg-[var(--surface-strong)] text-left ${
              index % 3 === 0 ? "aspect-[16/10] md:col-span-8" : "aspect-[4/3] md:col-span-4"
            }`}
            onClick={() => setActive(index)}
            aria-label={`查看 ${title} 项目图片 ${index + 1}`}
          >
            <Image src={src} alt={`${title} 项目界面 ${index + 1}`} fill sizes="(max-width: 768px) 100vw, 65vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.025]" />
          </button>
        ))}
      </div>

      {active !== null ? (
        <div ref={dialogRef} className="fixed inset-0 z-[60] grid place-items-center bg-[#0b0f0d]/95 p-4" role="dialog" aria-modal="true" aria-label={`${title} 图片预览`}>
          <button ref={closeRef} type="button" className="absolute right-4 top-4 grid size-11 place-items-center rounded-full bg-white/10 text-white" onClick={() => setActive(null)} aria-label="关闭图片预览">
            <X aria-hidden size={22} />
          </button>
          <button type="button" className="absolute left-4 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white" onClick={() => setActive((active - 1 + images.length) % images.length)} aria-label="上一张图片">
            <ChevronLeft aria-hidden size={24} />
          </button>
          <div className="relative h-[78dvh] w-[min(92vw,1200px)]">
            <Image src={images[active]} alt={`${title} 项目界面 ${active + 1}`} fill sizes="92vw" className="object-contain" priority />
          </div>
          <button type="button" className="absolute right-4 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white" onClick={() => setActive((active + 1) % images.length)} aria-label="下一张图片">
            <ChevronRight aria-hidden size={24} />
          </button>
          <p className="absolute bottom-5 font-mono text-xs text-white/70">{active + 1} / {images.length}</p>
        </div>
      ) : null}
    </>
  );
}
