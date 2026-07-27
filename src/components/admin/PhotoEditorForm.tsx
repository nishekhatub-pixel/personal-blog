import {
  createPhoto,
  updatePhoto,
} from "@/actions/garden-admin";
import { SubmitButton } from "@/components/admin/AdminControls";
import { GardenPublishingFields } from "@/components/admin/GardenPublishingFields";

type PhotoRecord = {
  albumId: string;
  alt: string;
  caption: string | null;
  id: string;
  location: string | null;
  mediaId: string;
  position: number;
  publishedAt: Date | string | null;
  status: string;
  takenAt: Date | string | null;
};

type NamedOption = {
  id: string;
  name: string;
};

type MediaOption = {
  alt: string;
  id: string;
  originalName: string;
};

function dateTimeValue(value?: Date | string | null) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function PhotoEditorForm({
  albums,
  mediaOptions,
  photo,
}: {
  albums: NamedOption[];
  mediaOptions: MediaOption[];
  photo?: PhotoRecord;
}) {
  return (
    <form action={photo ? updatePhoto : createPhoto} className="grid gap-8">
      {photo ? <input name="id" type="hidden" value={photo.id} /> : null}
      <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="grid gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span>所属相册</span>
              <select
                className="min-h-11 border border-[var(--line)] bg-[var(--canvas)] px-3 outline-none focus:border-[var(--accent)]"
                defaultValue={photo?.albumId ?? ""}
                name="albumId"
                required
              >
                <option disabled value="">
                  选择相册
                </option>
                {albums.map((album) => (
                  <option key={album.id} value={album.id}>
                    {album.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm">
              <span>媒体文件</span>
              <select
                className="min-h-11 border border-[var(--line)] bg-[var(--canvas)] px-3 outline-none focus:border-[var(--accent)]"
                defaultValue={photo?.mediaId ?? ""}
                name="mediaId"
                required
              >
                <option disabled value="">
                  从媒体库选择
                </option>
                {mediaOptions.map((media) => (
                  <option key={media.id} value={media.id}>
                    {media.originalName} · {media.alt}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="grid gap-2 text-sm">
            <span>替代文本</span>
            <input
              className="min-h-11 border border-[var(--line)] bg-transparent px-3 outline-none focus:border-[var(--accent)]"
              defaultValue={photo?.alt}
              maxLength={255}
              name="alt"
              placeholder="描述照片里真正可见的内容"
              required
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span>照片说明</span>
            <textarea
              className="min-h-36 resize-y border border-[var(--line)] bg-transparent p-3 leading-7 outline-none focus:border-[var(--accent)]"
              defaultValue={photo?.caption ?? ""}
              maxLength={5000}
              name="caption"
            />
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span>拍摄时间</span>
              <input
                className="min-h-11 border border-[var(--line)] bg-transparent px-3 outline-none focus:border-[var(--accent)]"
                defaultValue={dateTimeValue(photo?.takenAt)}
                name="takenAt"
                type="datetime-local"
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span>地点</span>
              <input
                className="min-h-11 border border-[var(--line)] bg-transparent px-3 outline-none focus:border-[var(--accent)]"
                defaultValue={photo?.location ?? ""}
                maxLength={255}
                name="location"
              />
            </label>
          </div>
        </div>
        <aside>
          <GardenPublishingFields
            position={photo?.position}
            publishedAt={photo?.publishedAt}
            status={photo?.status}
          />
        </aside>
      </div>

      <div className="sticky bottom-20 z-20 flex flex-wrap items-center justify-between gap-4 border border-[var(--line)] bg-[color-mix(in_srgb,var(--canvas)_94%,transparent)] p-4 backdrop-blur-md lg:bottom-4">
        <p className="text-xs text-[var(--muted)]">
          保存只建立照片记录，不会复制或删除媒体库原文件。
        </p>
        <SubmitButton pendingLabel="正在保存照片…">
          {photo ? "保存修改" : "添加照片"}
        </SubmitButton>
      </div>
    </form>
  );
}
