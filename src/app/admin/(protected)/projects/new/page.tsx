import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ProjectEditorForm } from "@/components/admin/ProjectEditorForm";
import { db } from "@/lib/db";

export default async function NewProjectPage() {
  const tags = await db.tag.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <>
      <Link className="mb-6 inline-flex min-h-11 items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--ink)]" href="/admin/projects">
        <ArrowLeft aria-hidden="true" size={16} />
        返回项目列表
      </Link>
      <AdminHeader
        description="从问题和目标开始，记录技术取舍、实施证据与最终复盘。"
        eyebrow="PROJECT / NEW"
        title="新增项目"
      />
      <ProjectEditorForm tags={tags} />
    </>
  );
}
