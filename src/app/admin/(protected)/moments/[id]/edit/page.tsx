import { notFound } from "next/navigation";
import { GardenEditorHeader } from "@/components/admin/GardenEditorHeader";
import { MomentEditorForm } from "@/components/admin/MomentEditorForm";
import { db } from "@/lib/db";

export default async function EditMomentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [moment, mediaOptions] = await Promise.all([
    db.moment.findUnique({
      include: {
        media: {
          orderBy: { position: "asc" },
          select: {
            alt: true,
            caption: true,
            mediaId: true,
            position: true,
          },
        },
      },
      where: { id },
    }),
    db.media.findMany({
      orderBy: { createdAt: "desc" },
      select: { alt: true, id: true, originalName: true, url: true },
    }),
  ]);
  if (!moment) notFound();

  return (
    <>
      <GardenEditorHeader
        backHref="/admin/moments"
        backLabel="返回说说列表"
        created={query.created === "1"}
        description="编辑内容、媒体与发布状态；读者评论在说说列表的审核视图处理。"
        eyebrow="MOMENT / EDIT"
        saved={query.saved === "1"}
        title={`编辑说说 · ${moment.content.slice(0, 24)}`}
      />
      <MomentEditorForm
        mediaOptions={mediaOptions}
        moment={{
          content: moment.content,
          id: moment.id,
          media: moment.media.map((item) => ({
            alt: item.alt,
            caption: item.caption ?? "",
            mediaId: item.mediaId,
            position: item.position,
          })),
          mood: moment.mood,
          pinned: moment.pinned,
          publishedAt: moment.publishedAt?.toISOString() ?? null,
          status: moment.status,
          weather: moment.weather,
        }}
      />
    </>
  );
}
