import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { PostEditorForm } from "@/components/admin/PostEditorForm";
import { db } from "@/lib/db";

export default async function CreatePostPage() {
  const [categories, mediaOptions, tags] = await Promise.all([
    db.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.media.findMany({
      orderBy: { createdAt: "desc" },
      select: { alt: true, id: true, originalName: true, url: true },
    }),
    db.tag.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <>
      <Link
        className="mb-6 inline-flex min-h-11 items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        href="/admin/posts"
      >
        <ArrowLeft aria-hidden="true" size={16} />
        返回文章列表
      </Link>
      <AdminHeader
        description="先保存为草稿也没关系。标题、摘要、替代文本与正文都需要真实完整。"
        eyebrow="POST / NEW"
        title="新建文章"
      />
      {categories.length ? (
        <PostEditorForm
          categories={categories}
          mediaOptions={mediaOptions}
          tags={tags}
        />
      ) : (
        <div className="border-y border-[var(--line)] py-10">
          <p className="text-sm leading-7 text-[var(--muted)]">
            创建文章前至少需要一个分类。
          </p>
          <Link className="mt-4 inline-flex min-h-11 items-center text-sm text-[var(--accent)]" href="/admin/categories">
            去创建分类
          </Link>
        </div>
      )}
    </>
  );
}
