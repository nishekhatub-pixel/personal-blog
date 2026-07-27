import {
  createPhotoAlbum,
  updatePhotoAlbum,
} from "@/actions/garden-admin";
import { SubmitButton } from "@/components/admin/AdminControls";
import { GardenPublishingFields } from "@/components/admin/GardenPublishingFields";

type AlbumRecord = {
  city: string | null;
  coverMediaId: string | null;
  description: string | null;
  featured: boolean;
  id: string;
  position: number;
  publishedAt: Date | string | null;
  recordDate: Date | string | null;
  slug: string;
  status: string;
  title: string;
};

type MediaOption = {
  alt: string;
  id: string;
  originalName: string;
};

function dateValue(value?: Date | string | null) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

export function AlbumEditorForm({
  album,
  mediaOptions,
}: {
  album?: AlbumRecord;
  mediaOptions: MediaOption[];
}) {
  return (
    <form action={album ? updatePhotoAlbum : createPhotoAlbum} className="grid gap-8">
      {album ? <input name="id" type="hidden" value={album.id} /> : null}

      <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="grid gap-5">
          <label className="grid gap-2 text-sm">
            <span>相册名称</span>
            <input
              className="min-h-13 border-b border-[var(--line)] bg-transparent text-2xl font-semibold tracking-[-0.03em] outline-none focus:border-[var(--accent)]"
              defaultValue={album?.title}
              maxLength={160}
              name="title"
              placeholder="一段真实而清楚的相册名称"
              required
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span>Slug</span>
            <input
              className="min-h-11 border border-[var(--line)] bg-transparent px-3 font-mono outline-none focus:border-[var(--accent)]"
              defaultValue={album?.slug}
              name="slug"
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              placeholder="album-slug"
              required
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span>相册说明</span>
            <textarea
              className="min-h-40 resize-y border border-[var(--line)] bg-transparent p-3 leading-7 outline-none focus:border-[var(--accent)]"
              defaultValue={album?.description ?? ""}
              maxLength={5000}
              name="description"
            />
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span>记录日期</span>
              <input
                className="min-h-11 border border-[var(--line)] bg-transparent px-3 outline-none focus:border-[var(--accent)]"
                defaultValue={dateValue(album?.recordDate)}
                name="recordDate"
                type="date"
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span>城市或区域</span>
              <input
                className="min-h-11 border border-[var(--line)] bg-transparent px-3 outline-none focus:border-[var(--accent)]"
                defaultValue={album?.city ?? ""}
                maxLength={120}
                name="city"
              />
            </label>
          </div>
          <label className="grid gap-2 text-sm">
            <span>封面媒体</span>
            <select
              className="min-h-11 border border-[var(--line)] bg-[var(--canvas)] px-3 outline-none focus:border-[var(--accent)]"
              defaultValue={album?.coverMediaId ?? ""}
              name="coverMediaId"
            >
              <option value="">不设置封面</option>
              {mediaOptions.map((media) => (
                <option key={media.id} value={media.id}>
                  {media.originalName} · {media.alt}
                </option>
              ))}
            </select>
          </label>
        </div>
        <aside>
          <GardenPublishingFields
            featured={album?.featured}
            position={album?.position}
            publishedAt={album?.publishedAt}
            showFeatured
            status={album?.status}
          />
        </aside>
      </div>

      <div className="sticky bottom-20 z-20 flex flex-wrap items-center justify-between gap-4 border border-[var(--line)] bg-[color-mix(in_srgb,var(--canvas)_94%,transparent)] p-4 backdrop-blur-md lg:bottom-4">
        <p className="text-xs text-[var(--muted)]">
          相册可以先保持为空；添加照片后再选择封面和发布。
        </p>
        <SubmitButton pendingLabel="正在保存相册…">
          {album ? "保存修改" : "创建相册"}
        </SubmitButton>
      </div>
    </form>
  );
}
