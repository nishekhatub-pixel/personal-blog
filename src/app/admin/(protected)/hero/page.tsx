import { AdminHeader } from "@/components/admin/AdminHeader";
import { HeroSlideManager } from "@/components/admin/HeroSlideManager";
import { db } from "@/lib/db";

export default async function AdminHeroPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; saved?: string }>;
}) {
  const [{ created, saved }, slides, media] = await Promise.all([
    searchParams,
    db.heroSlide.findMany({
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      select: {
        alt: true,
        id: true,
        mediaId: true,
        position: true,
        visible: true,
      },
    }),
    db.media.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        alt: true,
        id: true,
        originalName: true,
        url: true,
      },
    }),
  ]);

  return (
    <>
      <AdminHeader
        description="维护首页顶部的个人影像：直接引用媒体库，自动淡入淡出，不依赖照片墙或相册。"
        eyebrow="HOME / HERO"
        title="首页 Hero"
      />
      {created === "1" || saved === "1" ? (
        <p
          className="mb-8 border border-[color-mix(in_srgb,var(--success)_42%,var(--line))] bg-[color-mix(in_srgb,var(--success)_7%,var(--canvas))] px-4 py-3 text-sm text-[var(--success)]"
          role="status"
        >
          {created === "1" ? "Hero 图片已添加。" : "Hero 图片设置已保存。"}
        </p>
      ) : null}
      <HeroSlideManager initialMedia={media} slides={slides} />
    </>
  );
}
