"use client";

import Image from "next/image";
import { useState } from "react";
import {
  createHeroSlide,
  deleteHeroSlide,
  updateHeroSlide,
} from "@/actions/garden-admin";
import { ConfirmButton, SubmitButton } from "@/components/admin/AdminControls";
import { GardenActionForm } from "@/components/admin/GardenActionForm";
import {
  MediaUploader,
  type UploadedMedia,
} from "@/components/admin/MediaUploader";

type MediaOption = {
  alt: string;
  id: string;
  originalName: string;
  url: string;
};

type HeroSlideRecord = {
  alt: string;
  id: string;
  mediaId: string;
  position: number;
  visible: boolean;
};

export function HeroSlideManager({
  initialMedia,
  slides,
}: {
  initialMedia: MediaOption[];
  slides: HeroSlideRecord[];
}) {
  const [media, setMedia] = useState(initialMedia);
  const [newMediaId, setNewMediaId] = useState("");
  const [newAlt, setNewAlt] = useState("");

  const handleUploaded = (uploaded: UploadedMedia) => {
    setMedia((current) => [
      uploaded,
      ...current.filter((item) => item.id !== uploaded.id),
    ]);
    setNewMediaId(uploaded.id);
    setNewAlt(uploaded.alt);
  };

  return (
    <div className="grid gap-12">
      <section aria-labelledby="new-hero-heading">
        <div className="mb-5 border-b border-[var(--line)] pb-4">
          <p className="font-mono text-[11px] text-[var(--accent)]">HERO / NEW</p>
          <h2 className="mt-1 text-xl font-semibold" id="new-hero-heading">
            添加首页图片
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            可以先上传本地图片，也可以直接选择媒体库。图片只会建立 Hero 引用，不会自动加入照片墙或相册。
          </p>
        </div>

        <MediaUploader
          onUploaded={handleUploaded}
          refreshAfterUpload={false}
        />

        <form
          action={createHeroSlide}
          className="mt-6 grid gap-5 border-y border-[var(--line)] py-6 md:grid-cols-2"
        >
          <label className="grid gap-2 text-sm md:col-span-2">
            <span>媒体库图片</span>
            <select
              className="min-h-11 w-full border border-[var(--line)] bg-[var(--canvas)] px-3 outline-none focus:border-[var(--accent)]"
              name="mediaId"
              onChange={(event) => {
                const id = event.target.value;
                setNewMediaId(id);
                const selected = media.find((item) => item.id === id);
                if (selected) setNewAlt(selected.alt);
              }}
              required
              value={newMediaId}
            >
              <option disabled value="">
                选择一张图片
              </option>
              {media.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.originalName} · {item.alt}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm">
            <span>替代文本</span>
            <input
              className="min-h-11 border border-[var(--line)] bg-transparent px-3 outline-none focus:border-[var(--accent)]"
              maxLength={255}
              name="alt"
              onChange={(event) => setNewAlt(event.target.value)}
              required
              value={newAlt}
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span>排序</span>
            <input
              className="min-h-11 border border-[var(--line)] bg-transparent px-3 font-mono outline-none focus:border-[var(--accent)]"
              defaultValue={slides.length}
              min={0}
              name="position"
              type="number"
            />
          </label>
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input
              className="size-5 accent-[var(--accent)]"
              defaultChecked
              name="visible"
              type="checkbox"
              value="true"
            />
            在首页显示
          </label>
          <div className="flex justify-start md:justify-end">
            <SubmitButton pendingLabel="正在添加…">添加 Hero 图片</SubmitButton>
          </div>
        </form>
      </section>

      <section aria-labelledby="hero-list-heading">
        <div className="mb-5 flex items-end justify-between border-b border-[var(--line)] pb-4">
          <div>
            <p className="font-mono text-[11px] text-[var(--accent)]">
              {slides.length} SLIDES
            </p>
            <h2 className="mt-1 text-xl font-semibold" id="hero-list-heading">
              当前 Hero 图片
            </h2>
          </div>
        </div>

        {slides.length ? (
          <ul className="grid gap-6 lg:grid-cols-2">
            {slides.map((slide) => {
              const selected = media.find((item) => item.id === slide.mediaId);
              return (
                <li
                  className="min-w-0 overflow-hidden border border-[var(--line)]"
                  id={`hero-slide-${slide.id}`}
                  key={slide.id}
                >
                  <div className="relative aspect-[16/8] bg-[var(--surface-strong)]">
                    {selected ? (
                      <Image
                        alt={slide.alt}
                        className="object-cover"
                        fill
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        src={selected.url}
                      />
                    ) : null}
                  </div>
                  <form action={updateHeroSlide} className="grid gap-4 p-4">
                    <input name="id" type="hidden" value={slide.id} />
                    <label className="grid gap-2 text-sm">
                      <span>媒体图片</span>
                      <select
                        className="min-h-11 w-full border border-[var(--line)] bg-[var(--canvas)] px-3"
                        defaultValue={slide.mediaId}
                        name="mediaId"
                        required
                      >
                        {media.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.originalName} · {item.alt}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-2 text-sm">
                      <span>替代文本</span>
                      <input
                        className="min-h-11 border border-[var(--line)] bg-transparent px-3"
                        defaultValue={slide.alt}
                        maxLength={255}
                        name="alt"
                        required
                      />
                    </label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="grid gap-2 text-sm">
                        <span>排序</span>
                        <input
                          className="min-h-11 border border-[var(--line)] bg-transparent px-3 font-mono"
                          defaultValue={slide.position}
                          min={0}
                          name="position"
                          type="number"
                        />
                      </label>
                      <label className="flex min-h-11 items-center gap-3 self-end text-sm">
                        <input
                          className="size-5 accent-[var(--accent)]"
                          defaultChecked={slide.visible}
                          name="visible"
                          type="checkbox"
                          value="true"
                        />
                        在首页显示
                      </label>
                    </div>
                    <div className="flex justify-end">
                      <SubmitButton pendingLabel="正在保存…">保存修改</SubmitButton>
                    </div>
                  </form>
                  <GardenActionForm
                    action={deleteHeroSlide}
                    className="border-t border-[var(--line)] p-4"
                    successMessage="Hero 图片已移除。"
                  >
                    <input name="id" type="hidden" value={slide.id} />
                    <ConfirmButton message="确定从首页 Hero 移除这张图片？媒体库原文件不会被删除。">
                      移除 Hero 引用
                    </ConfirmButton>
                  </GardenActionForm>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="grid min-h-56 place-items-center border-y border-[var(--line)] px-6 text-center">
            <div>
              <p className="font-medium">还没有后台管理的 Hero 图片</p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                首页暂时继续使用项目内置的三张暖色照片。
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
