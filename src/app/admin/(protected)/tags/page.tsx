import type { Prisma } from "@prisma/client";
import { Hash, Trash2 } from "lucide-react";
import { createTag, deleteTag, updateTag } from "@/actions/admin";
import {
  ConfirmButton,
  SearchField,
  SubmitButton,
} from "@/components/admin/AdminControls";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Pagination } from "@/components/admin/Pagination";
import { db } from "@/lib/db";

const PAGE_SIZE = 18;

export default async function AdminTagsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const parsedPage = Number(typeof params.page === "string" ? params.page : "1");
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1;
  const where: Prisma.TagWhereInput = q
    ? { OR: [{ name: { contains: q } }, { slug: { contains: q } }] }
    : {};
  const [tags, count] = await Promise.all([
    db.tag.findMany({
      include: {
        _count: { select: { posts: true, projects: true } },
      },
      orderBy: { name: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      where,
    }),
    db.tag.count({ where }),
  ]);
  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <>
      <AdminHeader
        description="标签跨越文章与项目，适合表达技术、主题和长期兴趣。保持颗粒度一致。"
        eyebrow="TAXONOMY / TAGS"
        title="标签"
      />

      <section className="border-y border-[var(--line)] py-6" aria-labelledby="create-tag">
        <h2 className="mb-4 text-sm font-semibold" id="create-tag">快速创建</h2>
        <form action={createTag} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <label>
            <span className="sr-only">标签名称</span>
            <input className="min-h-11 w-full border border-[var(--line)] bg-transparent px-3 text-sm outline-none focus:border-[var(--accent)]" name="name" placeholder="标签名称" required />
          </label>
          <label>
            <span className="sr-only">标签 slug</span>
            <input className="min-h-11 w-full border border-[var(--line)] bg-transparent px-3 font-mono text-sm outline-none focus:border-[var(--accent)]" name="slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="tag-slug" required />
          </label>
          <SubmitButton pendingLabel="创建中…">创建标签</SubmitButton>
        </form>
      </section>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[11px] text-[var(--accent)]">{count} TOTAL</p>
          <h2 className="mt-1 text-xl font-semibold">标签索引</h2>
        </div>
        <form className="flex min-w-0 gap-2 sm:w-80" method="get">
          <SearchField defaultValue={q} placeholder="搜索标签" />
          <button className="min-h-11 border border-[var(--line)] px-4 text-sm" type="submit">搜索</button>
        </form>
      </div>

      {tags.length ? (
        <ul className="mt-5 grid border-l border-t border-[var(--line)] sm:grid-cols-2 xl:grid-cols-3">
          {tags.map((tag) => (
            <li className="min-w-0 border-b border-r border-[var(--line)] p-5" key={tag.id}>
              <div className="flex items-start gap-3">
                <Hash aria-hidden="true" className="mt-0.5 text-[var(--accent)]" size={17} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{tag.name}</p>
                  <p className="mt-1 truncate font-mono text-[11px] text-[var(--muted)]">/{tag.slug}</p>
                  <p className="mt-3 text-xs text-[var(--muted)]">
                    {tag._count.posts} 文章 · {tag._count.projects} 项目
                  </p>
                </div>
              </div>
              <details className="mt-4 border-t border-[var(--line)] pt-3">
                <summary className="cursor-pointer text-xs text-[var(--accent)]">编辑标签</summary>
                <form action={updateTag} className="mt-3 grid gap-2">
                  <input name="id" type="hidden" value={tag.id} />
                  <input aria-label="标签名称" className="min-h-10 border border-[var(--line)] bg-transparent px-3 text-sm" defaultValue={tag.name} name="name" required />
                  <input aria-label="标签 slug" className="min-h-10 border border-[var(--line)] bg-transparent px-3 font-mono text-sm" defaultValue={tag.slug} name="slug" required />
                  <SubmitButton pendingLabel="保存中…">保存</SubmitButton>
                </form>
              </details>
              <form action={deleteTag} className="mt-2 text-right">
                <input name="id" type="hidden" value={tag.id} />
                <ConfirmButton message={`确定删除标签“${tag.name}”？文章和项目本身不会被删除。`}>
                  <span className="inline-flex items-center gap-2">
                    <Trash2 aria-hidden="true" size={14} />
                    删除
                  </span>
                </ConfirmButton>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 border-y border-[var(--line)] py-12 text-center text-sm text-[var(--muted)]">
          没有匹配的标签。
        </p>
      )}
      <Pagination page={Math.min(page, pageCount)} pageCount={pageCount} searchParams={{ q }} />
    </>
  );
}
