import { GardenEditorHeader } from "@/components/admin/GardenEditorHeader";
import { MomentEditorForm } from "@/components/admin/MomentEditorForm";
import { db } from "@/lib/db";

export default async function NewMomentPage() {
  const mediaOptions = await db.media.findMany({
    orderBy: { createdAt: "desc" },
    select: { alt: true, id: true, originalName: true, url: true },
  });

  return (
    <>
      <GardenEditorHeader
        backHref="/admin/moments"
        backLabel="返回说说列表"
        description="短内容也要保留真实语境；媒体替代文本和发布时间同样需要准确。"
        eyebrow="MOMENT / NEW"
        title="新建说说"
      />
      <MomentEditorForm mediaOptions={mediaOptions} />
    </>
  );
}
