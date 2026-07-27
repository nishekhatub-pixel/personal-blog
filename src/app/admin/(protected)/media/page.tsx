import type { Prisma } from "@prisma/client";
import { ImageIcon, Trash2 } from "lucide-react";
import Image from "next/image";
import { deleteMedia } from "@/actions/media-admin";
import { ConfirmButton, SearchField } from "@/components/admin/AdminControls";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { CopyMediaUrl } from "@/components/admin/CopyMediaUrl";
import { MediaUploader } from "@/components/admin/MediaUploader";
import { Pagination } from "@/components/admin/Pagination";
import { db } from "@/lib/db";

const PAGE_SIZE = 12;
const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function humanSize(size: number) {
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

export default async function AdminMediaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const parsedPage = Number(typeof params.page === "string" ? params.page : "1");
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1;
  const where: Prisma.MediaWhereInput = q
    ? {
        OR: [
          { originalName: { contains: q } },
          { alt: { contains: q } },
          { storedName: { contains: q } },
        ],
      }
    : {};
  const [media, count] = await Promise.all([
    db.media.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      where,
    }),
    db.media.count({ where }),
  ]);
  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <>
      <AdminHeader
        description="上传会验证真实文件类型、限制体积，并生成适配不同屏幕的图片版本。"
        eyebrow="ASSETS / MEDIA"
        title="媒体库"
      />

      <MediaUploader />

      <section className="mt-12" aria-labelledby="media-library">
        <div className="mb-5 flex flex-col gap-4 border-b border-[var(--line)] pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[11px] text-[var(--accent)]">{count} FILES</p>
            <h2 className="mt-1 text-xl font-semibold" id="media-library">已上传图片</h2>
          </div>
          <form className="flex min-w-0 gap-2 sm:w-96" method="get">
            <SearchField defaultValue={q} placeholder="搜索文件名或替代文本" />
            <button className="min-h-11 border border-[var(--line)] px-4 text-sm" type="submit">搜索</button>
          </form>
        </div>

        {media.length ? (
          <ul className="grid border-l border-t border-[var(--line)] sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {media.map((item) => (
              <li className="min-w-0 border-b border-r border-[var(--line)]" key={item.id}>
                <div className="relative aspect-[4/3] overflow-hidden bg-[color-mix(in_srgb,var(--ink)_5%,transparent)]">
                  <Image
                    alt={item.alt}
                    className="object-cover transition-transform duration-500 hover:scale-[1.025]"
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                    src={item.url}
                  />
                </div>
                <div className="p-4">
                  <p className="truncate text-sm font-medium" title={item.originalName}>
                    {item.originalName}
                  </p>
                  <p className="mt-1 line-clamp-2 min-h-10 text-xs leading-5 text-[var(--muted)]">
                    {item.alt || "缺少替代文本"}
                  </p>
                  <p className="mt-3 font-mono text-[10px] uppercase text-[var(--muted)]">
                    {item.width && item.height ? `${item.width}×${item.height} · ` : ""}
                    {humanSize(item.size)} · {dateFormatter.format(item.createdAt)}
                  </p>
                  <div className="mt-3 flex items-center justify-between border-t border-[var(--line)] pt-2">
                    <CopyMediaUrl url={item.url} />
                    <form action={deleteMedia}>
                      <input name="id" type="hidden" value={item.id} />
                      <ConfirmButton message={`确定删除“${item.originalName}”及所有响应式版本？若内容仍引用它，页面图片会失效。`}>
                        <span className="sr-only">删除 {item.originalName}</span>
                        <Trash2 aria-hidden="true" size={15} />
                      </ConfirmButton>
                    </form>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="grid min-h-64 place-items-center border-y border-[var(--line)] text-center">
            <div>
              <ImageIcon aria-hidden="true" className="mx-auto mb-4 text-[var(--muted)]" size={30} strokeWidth={1.3} />
              <p className="font-medium">没有匹配的图片</p>
              <p className="mt-2 text-sm text-[var(--muted)]">上传第一张图片，或调整搜索条件。</p>
            </div>
          </div>
        )}
        <Pagination page={Math.min(page, pageCount)} pageCount={pageCount} searchParams={{ q }} />
      </section>
    </>
  );
}
