"use client";

import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

const slides = [
  {
    alt: "午后阳光照进书桌，键盘、学习笔记、耳机和绿植安静地摆在一起",
    src: "/images/home-carousel-study-v2.webp",
  },
  {
    alt: "傍晚的钢琴角落，谱架、茶杯与暖灯陪伴一次安静的练习",
    src: "/images/home-carousel-piano-v2.webp",
  },
  {
    alt: "雨后夕阳里的校园球场，篮球与羽毛球拍留在场边",
    src: "/images/home-carousel-court-v2.webp",
  },
] as const;

const rotationInterval = 7_000;

export function PhotoCarousel() {
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

  const selectSlide = useCallback((index: number) => {
    setActiveIndex((index + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    if (manualPaused || interacting || reducedMotion) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, rotationInterval);
    return () => window.clearInterval(timer);
  }, [interacting, manualPaused, reducedMotion]);

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
        {slides.map((slide, index) => (
          <figure
            aria-hidden={index !== activeIndex}
            className="home-photo-carousel__slide"
            data-active={index === activeIndex ? "true" : undefined}
            key={slide.src}
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

        <div className="home-photo-carousel__controls">
          <button
            aria-label="上一张照片"
            className="home-photo-carousel__arrow"
            onClick={() => selectSlide(activeIndex - 1)}
            type="button"
          >
            <ChevronLeft aria-hidden="true" size={20} strokeWidth={1.8} />
          </button>

          <div aria-label="选择照片" className="home-photo-carousel__dots">
            {slides.map((slide, index) => (
              <button
                aria-label={`查看第 ${index + 1} 张照片`}
                aria-pressed={index === activeIndex}
                className="home-photo-carousel__dot"
                data-active={index === activeIndex ? "true" : undefined}
                key={slide.src}
                onClick={() => selectSlide(index)}
                type="button"
              />
            ))}
          </div>

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
              <Play aria-hidden="true" size={15} fill="currentColor" />
            ) : (
              <Pause aria-hidden="true" size={15} fill="currentColor" />
            )}
          </button>

          <button
            aria-label="下一张照片"
            className="home-photo-carousel__arrow"
            onClick={() => selectSlide(activeIndex + 1)}
            type="button"
          >
            <ChevronRight aria-hidden="true" size={20} strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </section>
  );
}
