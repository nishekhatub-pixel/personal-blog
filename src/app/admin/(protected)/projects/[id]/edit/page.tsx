import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ProjectEditorForm } from "@/components/admin/ProjectEditorForm";
import { db } from "@/lib/db";

export default async function EditProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const [project, tags] = await Promise.all([
    db.project.findUnique({
      include: { tags: { select: { tagId: true } } },
      where: { id },
    }),
    db.tag.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!project) notFound();

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link className="inline-flex min-h-11 items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--ink)]" href="/admin/projects">
          <ArrowLeft aria-hidden="true" size={16} />
          返回项目列表
        </Link>
        {project.status === "PUBLISHED" ? (
          <Link className="inline-flex min-h-11 items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--ink)]" href={`/projects/${project.slug}`} target="_blank">
            查看公开案例
            <ExternalLink aria-hidden="true" size={15} />
          </Link>
        ) : null}
      </div>
      <AdminHeader
        description="每次修改都应让案例更接近真实过程，而不是只展示漂亮结果。"
        eyebrow="PROJECT / EDIT"
        title={project.title}
      />
      {query.created === "1" || query.saved === "1" ? (
        <p
          aria-live="polite"
          className="mb-7 border-l-2 border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] px-4 py-3 text-sm"
        >
          {query.created === "1" ? "项目已创建并安全保存。" : "项目修改已保存。"}
        </p>
      ) : null}
      <ProjectEditorForm project={project} tags={tags} />
    </>
  );
}
