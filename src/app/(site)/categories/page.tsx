import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getCategories } from "@/lib/data";
import { EmptyState } from "@/components/content/empty-state";
import type { Taxonomy } from "@/components/content/content-types";
import { PageIntro } from "@/components/site/page-intro";

export const metadata: Metadata = {
  title: "文章分类",
  description: "按主题浏览 R7 的技术文章、学习复盘与生活记录。",
  alternates: { canonical: "/categories" },
};
export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = (await getCategories()) as Taxonomy[];

  return (
    <main id="main-content">
      <PageIntro
        eyebrow="主题索引"
        title="文章分类"
        description="每个分类是一条较长的学习线索，不把文章切成过细的碎片。"
      />
      <div className="mx-auto max-w-[1180px] px-[var(--page-gutter)] pb-[clamp(5rem,10vw,9rem)]">
        {categories.length ? (
          <ol className="grid gap-5 md:grid-cols-2">
            {categories.map((category, index) => (
              <li key={category.slug} className={index % 3 === 0 ? "md:col-span-2" : ""}>
                <Link
                  href={`/blog?category=${category.slug}`}
                  className="garden-card group grid min-h-48 grid-cols-[1fr_auto] content-between p-6 md:p-7"
                >
                  <div>
                    <p className="font-mono text-xs text-[var(--muted)]">{category._count?.posts || 0} 篇文章</p>
                    <h2 className="mt-3 text-[clamp(2rem,4vw,4rem)] font-semibold tracking-[-.06em] group-hover:text-[var(--accent)]">{category.name}</h2>
                    {category.description ? <p className="mt-4 max-w-2xl leading-7 text-[var(--muted)]">{category.description}</p> : null}
                  </div>
                  <ArrowUpRight aria-hidden size={22} strokeWidth={1.7} />
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <div><EmptyState title="还没有分类" description="发布文章并分配分类后，这里会形成清晰索引。" /></div>
        )}
      </div>
    </main>
  );
}
