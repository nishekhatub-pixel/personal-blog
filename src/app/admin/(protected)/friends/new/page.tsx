import { FriendEditorForm } from "@/components/admin/FriendEditorForm";
import { GardenEditorHeader } from "@/components/admin/GardenEditorHeader";

export default function NewFriendLinkPage() {
  return (
    <>
      <GardenEditorHeader
        backHref="/admin/friends"
        backLabel="返回友链列表"
        description="登记真实站点资料；联系方式只用于后台维护，不会公开。"
        eyebrow="FRIEND / NEW"
        title="添加友链"
      />
      <FriendEditorForm />
    </>
  );
}
