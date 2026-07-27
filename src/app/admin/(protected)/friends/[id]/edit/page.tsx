import { notFound } from "next/navigation";
import { FriendEditorForm } from "@/components/admin/FriendEditorForm";
import { GardenEditorHeader } from "@/components/admin/GardenEditorHeader";
import { db } from "@/lib/db";

export default async function EditFriendLinkPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const friend = await db.friendLink.findUnique({ where: { id } });
  if (!friend) notFound();

  return (
    <>
      <GardenEditorHeader
        backHref="/admin/friends"
        backLabel="返回友链列表"
        created={query.created === "1"}
        description="校对站点公开资料、排序和发布状态；联系方式只在这个后台表单中维护。"
        eyebrow="FRIEND / EDIT"
        saved={query.saved === "1"}
        title={friend.name}
      />
      <FriendEditorForm friend={friend} />
    </>
  );
}
