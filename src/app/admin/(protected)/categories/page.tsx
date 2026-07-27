import type { Prisma } from "@prisma/client";
import { Edit3, FolderTree, Trash2 } from "lucide-react";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/actions/admin";
import {
  ConfirmButton,
  SearchField,
  SubmitButton,
} from "@/components/admin/AdminControls";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Pagination } from "@/components/admin/Pagination";
import { db } from "@/lib/db";

const PAGE_SIZE = 12;

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const parsedPage = Number(typeof params.page === "string" ? params.page : "1");
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1;
  const where: Prisma.CategoryWhereInput = q
    ? {
        OR: [
          { name: { contains: q } },
          { slug: { contains: q } },
          { description: { contains: q } },
        ],
      }
    : {};
  const [categories, count] = await Promise.all([
    db.category.findMany({
      include: { _count: { select: { posts: true } } },
      orderBy: { name: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      where,
    }),
    db.category.count({ where }),
  ]);
  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <>
      <AdminHeader
        description="分类定义内容的主干。一个文章只能属于一个分类，因此命名要稳定、清晰且互斥。"
        eyebrow="TAXONOMY / CATEGORIES"
        title="分类"
      />

      <div className="grid gap-12 xl:grid-cols-[21rem_minmax(0,1fr)]">
        <section aria-labelledby="create-category">
          <div className="border-t-2 border-[var(--ink)] pt-5 xl:sticky xl:top-24">
            <h2 className="text-lg font-semibold" id="create-category">
              新建分类
            </h2>
            <form action={createCategory} className="mt-6 grid gap-4">
              <label className="grid gap-2 text-sm">
                <span>名称</span>
                <input
                  className="min-h-11 border border-[var(--line)] bg-transparent px-3 outline-none focus:border-[var(--accent)]"
                  maxLength={40}
                  name="name"
                  required
                />
              </label>
              <label className="grid gap-2 text-sm">
                <span>Slug</span>
                <input
                  className="min-h-11 border border-[var(--line)] bg-transparent px-3 font-mono outline-none focus:border-[var(--accent)]"
                  name="slug"
                  pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                  required
                />
              </label>
              <label className="grid gap-2 text-sm">
                <span>描述</span>
                <textarea
                  className="min-h-28 border border-[var(--line)] bg-transparent p-3 leading-6 outline-none focus:border-[var(--accent)]"
                  maxLength={180}
                  name="description"
                />
              </label>
              <SubmitButton pendingLabel="正在创建…">创建分类</SubmitButton>
            </form>
          </div>
        </section>

        <section aria-labelledby="category-list">
          <div className="mb-5 flex flex-col gap-4 border-b border-[var(--line)] pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-[11px] text-[var(--accent)]">{count} TOTAL</p>
              <h2 className="mt-1 text-xl font-semibold" id="category-list">
                分类列表
              </h2>
            </div>
            <form className="flex min-w-0 gap-2 sm:w-80" method="get">
              <SearchField defaultValue={q} placeholder="搜索分类" />
              <button className="min-h-11 border border-[var(--line)] px-4 text-sm" type="submit">
                搜索
              </button>
            </form>
          </div>

          {categories.length ? (
            <ol className="divide-y divide-[var(--line)]">
              {categories.map((category) => (
                <li className="py-5" key={category.id}>
                  <div className="flex items-start gap-4">
                    <FolderTree aria-hidden="true" className="mt-1 shrink-0 text-[var(--accent)]" size={18} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-3">
                        <h3 className="text-sm font-semibold">{category.name}</h3>
                        <span className="font-mono text-[11px] text-[var(--muted)]">
                          {category._count.posts} POSTS
                        </span>
                      </div>
                      <p className="mt-1 font-mono text-[11px] text-[var(--muted)]">/{category.slug}</p>
                      {category.description ? (
                        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{category.description}</p>
                      ) : null}
                      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
                        <details className="min-w-0 flex-1">
                          <summary className="inline-flex min-h-10 cursor-pointer items-center gap-2 text-sm text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]">
                            <Edit3 aria-hidden="true" size={15} />
                            编辑
                          </summary>
                          <form action={updateCategory} className="mt-3 grid gap-3 border-l border-[var(--line)] pl-4 sm:grid-cols-2">
                            <input name="id" type="hidden" value={category.id} />
                            <label className="grid gap-1 text-xs">
                              名称
                              <input className="min-h-10 border border-[var(--line)] bg-transparent px-3" defaultValue={category.name} name="name" required />
                            </label>
                            <label className="grid gap-1 text-xs">
                              Slug
                              <input className="min-h-10 border border-[var(--line)] bg-transparent px-3 font-mono" defaultValue={category.slug} name="slug" required />
                            </label>
                            <label className="grid gap-1 text-xs sm:col-span-2">
                              描述
                              <textarea className="min-h-20 border border-[var(--line)] bg-transparent p-3" defaultValue={category.description ?? ""} name="description" />
                            </label>
                            <SubmitButton className="sm:col-start-2" pendingLabel="保存中…">保存分类</SubmitButton>
                          </form>
                        </details>
                        {category._count.posts ? (
                          <span className="inline-flex min-h-10 items-center text-xs text-[var(--muted)]">
                            迁移文章后可删除
                          </span>
                        ) : (
                          <form action={deleteCategory}>
                            <input name="id" type="hidden" value={category.id} />
                            <ConfirmButton message={`确定删除分类“${category.name}”？`}>
                              <span className="inline-flex items-center gap-2">
                                <Trash2 aria-hidden="true" size={15} />
                                删除
                              </span>
                            </ConfirmButton>
                          </form>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="border-y border-[var(--line)] py-12 text-center text-sm text-[var(--muted)]">
              没有匹配的分类。
            </p>
          )}
          <Pagination page={Math.min(page, pageCount)} pageCount={pageCount} searchParams={{ q }} />
        </section>
      </div>
    </>
  );
}
