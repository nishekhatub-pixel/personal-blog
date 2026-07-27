import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";

type GardenEditorHeaderProps = {
  backHref: string;
  backLabel: string;
  created?: boolean;
  description: string;
  eyebrow: string;
  publicHref?: string;
  saved?: boolean;
  title: string;
};

export function GardenEditorHeader({
  backHref,
  backLabel,
  created = false,
  description,
  eyebrow,
  publicHref,
  saved = false,
  title,
}: GardenEditorHeaderProps) {
  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          className="inline-flex min-h-11 items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          href={backHref}
        >
          <ArrowLeft aria-hidden="true" size={16} />
          {backLabel}
        </Link>
        {publicHref ? (
          <Link
            className="inline-flex min-h-11 items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            href={publicHref}
            target="_blank"
          >
            查看公开页面
            <ExternalLink aria-hidden="true" size={15} />
          </Link>
        ) : null}
      </div>
      <AdminHeader
        description={description}
        eyebrow={eyebrow}
        title={title}
      />
      {created || saved ? (
        <p
          aria-live="polite"
          className="mb-7 border-l-2 border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] px-4 py-3 text-sm"
        >
          {created ? "内容已创建并安全保存。" : "修改已保存。"}
        </p>
      ) : null}
    </>
  );
}
