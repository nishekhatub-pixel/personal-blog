"use client";

import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

export type HomeHeroSlide = {
  alt: string;
  id: string;
  src: string;
};

const fallbackSlides: HomeHeroSlide[] = [
  {
    id: "study",
    alt: "午后阳光照进书桌，键盘、学习笔记、耳机和绿植安静地摆在一起",
    src: "/images/home-carousel-study-v2.webp",
  },
  {
    id: "piano",
    alt: "傍晚的钢琴角落，谱架、茶杯与暖灯陪伴一次安静的练习",
    src: "/images/home-carousel-piano-v2.webp",
  },
  {
    id: "court",
    alt: "雨后夕阳里的校园球场，篮球与羽毛球拍留在场边",
    src: "/images/home-carousel-court-v2.webp",
  },
];

const rotationInterval = 7_000;

export function PhotoCarousel({ slides = fallbackSlides }: { slides?: HomeHeroSlide[] }) {
  const resolvedSlides = slides.length ? slides : fallbackSlides;
  const [activeIndex, setActiveIndex] = useState(0);
  const [manualPaused, setManualPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const selectSlide = useCallback(
    (index: number) => {
      setActiveIndex((index + resolvedSlides.length) % resolvedSlides.length);
    },
    [resolvedSlides.length],
  );

  useEffect(() => {
    if (
      resolvedSlides.length < 2 ||
      manualPaused ||
      interacting ||
      reducedMotion
    ) {
      return;
    }
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % resolvedSlides.length);
    }, rotationInterval);
    return () => window.clearInterval(timer);
  }, [interacting, manualPaused, reducedMotion, resolvedSlides.length]);

  return (
    <section
      aria-label="R7 的生活照片"
      aria-roledescription="carousel"
      className="home-photo-carousel"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setInteracting(false);
        }
      }}
      onFocus={() => setInteracting(true)}
      onMouseEnter={() => setInteracting(true)}
      onMouseLeave={() => setInteracting(false)}
    >
      <div className="home-photo-carousel__viewport">
        {resolvedSlides.map((slide, index) => (
          <figure
            aria-hidden={index !== activeIndex}
            className="home-photo-carousel__slide"
            data-active={index === activeIndex ? "true" : undefined}
            key={slide.id}
          >
            <Image
              alt={slide.alt}
              className="home-photo-carousel__image"
              fill
              priority={index === 0}
              sizes="(max-width: 768px) 100vw, 1500px"
              src={slide.src}
            />
          </figure>
        ))}

        {resolvedSlides.length > 1 ? (
          <div
            aria-label={`第 ${activeIndex + 1} 张，共 ${resolvedSlides.length} 张`}
            className="home-photo-carousel__actions"
          >
            <button
              aria-label="上一张照片"
              className="home-photo-carousel__arrow"
              onClick={() => selectSlide(activeIndex - 1)}
              type="button"
            >
              <ChevronLeft aria-hidden size={19} strokeWidth={1.8} />
            </button>
            <button
              aria-label={
                reducedMotion
                  ? "已根据系统设置停止自动轮播"
                  : manualPaused
                    ? "继续轮播"
                    : "暂停轮播"
              }
              className="home-photo-carousel__pause"
              disabled={reducedMotion}
              onClick={() => setManualPaused((current) => !current)}
              type="button"
            >
              {manualPaused || reducedMotion ? (
                <Play aria-hidden fill="currentColor" size={14} />
              ) : (
                <Pause aria-hidden fill="currentColor" size={14} />
              )}
            </button>
            <button
              aria-label="下一张照片"
              className="home-photo-carousel__arrow"
              onClick={() => selectSlide(activeIndex + 1)}
              type="button"
            >
              <ChevronRight aria-hidden size={19} strokeWidth={1.8} />
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
