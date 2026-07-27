import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { PostEditorForm } from "@/components/admin/PostEditorForm";
import { db } from "@/lib/db";

export default async function EditPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const [post, categories, tags] = await Promise.all([
    db.post.findUnique({
      include: { tags: { select: { tagId: true } } },
      where: { id },
    }),
    db.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.tag.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!post) notFound();

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          className="inline-flex min-h-11 items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          href="/admin/posts"
        >
          <ArrowLeft aria-hidden="true" size={16} />
          返回文章列表
        </Link>
        {post.status === "PUBLISHED" ? (
          <Link
            className="inline-flex min-h-11 items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            href={`/blog/${post.slug}`}
            target="_blank"
          >
            查看已发布页面
            <ExternalLink aria-hidden="true" size={15} />
          </Link>
        ) : null}
      </div>
      <AdminHeader
        description="实时预览正文，保存前确认状态、分类、标签与搜索引擎信息。"
        eyebrow="POST / EDIT"
        title={post.title}
      />
      {query.created === "1" || query.saved === "1" ? (
        <p
          aria-live="polite"
          className="mb-7 border-l-2 border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] px-4 py-3 text-sm"
        >
          {query.created === "1" ? "文章已创建并安全保存。" : "文章修改已保存。"}
        </p>
      ) : null}
      <PostEditorForm categories={categories} post={post} tags={tags} />
    </>
  );
}
