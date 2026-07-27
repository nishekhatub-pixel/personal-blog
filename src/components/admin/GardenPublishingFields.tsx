type GardenPublishingFieldsProps = {
  featured?: boolean;
  pinned?: boolean;
  position?: number;
  publishedAt?: Date | string | null;
  showFeatured?: boolean;
  showPinned?: boolean;
  showPosition?: boolean;
  status?: string;
};

function dateTimeValue(value?: Date | string | null) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function GardenPublishingFields({
  featured = false,
  pinned = false,
  position = 0,
  publishedAt,
  showFeatured = false,
  showPinned = false,
  showPosition = true,
  status = "DRAFT",
}: GardenPublishingFieldsProps) {
  return (
    <fieldset className="grid gap-5 border-t border-[var(--line)] pt-6">
      <legend className="px-2 text-sm font-semibold">发布与排序</legend>
      <label className="grid gap-2 text-sm">
        <span>状态</span>
        <select
          className="min-h-11 border border-[var(--line)] bg-[var(--canvas)] px-3 outline-none focus:border-[var(--accent)]"
          defaultValue={status}
          name="status"
        >
          <option value="DRAFT">草稿</option>
          <option value="PUBLISHED">发布</option>
          <option value="ARCHIVED">归档</option>
        </select>
      </label>
      <label className="grid gap-2 text-sm">
        <span>发布时间</span>
        <input
          className="min-h-11 border border-[var(--line)] bg-transparent px-3 outline-none focus:border-[var(--accent)]"
          defaultValue={dateTimeValue(publishedAt)}
          name="publishedAt"
          type="datetime-local"
        />
        <span className="text-xs leading-5 text-[var(--muted)]">
          留空时，首次发布由服务端记录当前时间。
        </span>
      </label>
      {showPosition ? (
        <label className="grid gap-2 text-sm">
          <span>排序值</span>
          <input
            className="min-h-11 border border-[var(--line)] bg-transparent px-3 font-mono outline-none focus:border-[var(--accent)]"
            defaultValue={position}
            min={0}
            name="position"
            type="number"
          />
        </label>
      ) : null}
      {showFeatured ? (
        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input
            className="size-4 accent-[var(--accent)]"
            defaultChecked={featured}
            name="featured"
            type="checkbox"
            value="true"
          />
          标记为推荐内容
        </label>
      ) : null}
      {showPinned ? (
        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input
            className="size-4 accent-[var(--accent)]"
            defaultChecked={pinned}
            name="pinned"
            type="checkbox"
            value="true"
          />
          置顶展示
        </label>
      ) : null}
    </fieldset>
  );
}
