import {
  createFriendLink,
  updateFriendLink,
} from "@/actions/garden-admin";
import { SubmitButton } from "@/components/admin/AdminControls";
import { GardenPublishingFields } from "@/components/admin/GardenPublishingFields";

type FriendRecord = {
  avatarUrl: string | null;
  contact: string | null;
  description: string;
  featured: boolean;
  id: string;
  name: string;
  position: number;
  publishedAt: Date | string | null;
  status: string;
  tagsJson: string;
  url: string;
};

function tagsValue(raw?: string) {
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string").join("\n")
      : "";
  } catch {
    return "";
  }
}

export function FriendEditorForm({ friend }: { friend?: FriendRecord }) {
  return (
    <form action={friend ? updateFriendLink : createFriendLink} className="grid gap-8">
      {friend ? <input name="id" type="hidden" value={friend.id} /> : null}
      <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="grid gap-5">
          <label className="grid gap-2 text-sm">
            <span>站点名称</span>
            <input
              className="min-h-13 border-b border-[var(--line)] bg-transparent text-2xl font-semibold outline-none focus:border-[var(--accent)]"
              defaultValue={friend?.name}
              maxLength={120}
              name="name"
              required
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span>站点 URL</span>
            <input
              className="min-h-11 border border-[var(--line)] bg-transparent px-3 font-mono text-sm outline-none focus:border-[var(--accent)]"
              defaultValue={friend?.url}
              name="url"
              placeholder="https://"
              required
              type="url"
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span>公开描述</span>
            <textarea
              className="min-h-32 resize-y border border-[var(--line)] bg-transparent p-3 leading-7 outline-none focus:border-[var(--accent)]"
              defaultValue={friend?.description}
              maxLength={500}
              name="description"
              required
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span>头像 URL</span>
            <input
              className="min-h-11 border border-[var(--line)] bg-transparent px-3 font-mono text-sm outline-none focus:border-[var(--accent)]"
              defaultValue={friend?.avatarUrl ?? ""}
              name="avatarUrl"
              placeholder="https://"
              type="url"
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span>标签（逗号或换行分隔）</span>
            <textarea
              className="min-h-28 resize-y border border-[var(--line)] bg-transparent p-3"
              defaultValue={tagsValue(friend?.tagsJson)}
              name="tags"
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span>后台联系方式</span>
            <input
              className="min-h-11 border border-[var(--line)] bg-transparent px-3 outline-none focus:border-[var(--accent)]"
              defaultValue={friend?.contact ?? ""}
              maxLength={255}
              name="contact"
            />
            <span className="text-xs text-[var(--muted)]">
              仅供后台维护，不应输出到公开友链页面。
            </span>
          </label>
        </div>
        <aside>
          <GardenPublishingFields
            featured={friend?.featured}
            position={friend?.position}
            publishedAt={friend?.publishedAt}
            showFeatured
            status={friend?.status}
          />
        </aside>
      </div>

      <div className="sticky bottom-20 z-20 flex flex-wrap items-center justify-between gap-4 border border-[var(--line)] bg-[color-mix(in_srgb,var(--canvas)_94%,transparent)] p-4 backdrop-blur-md lg:bottom-4">
        <p className="text-xs text-[var(--muted)]">
          发布前检查网址、描述和头像来源；联系方式仅留在后台。
        </p>
        <SubmitButton pendingLabel="正在保存友链…">
          {friend ? "保存修改" : "创建友链"}
        </SubmitButton>
      </div>
    </form>
  );
}
