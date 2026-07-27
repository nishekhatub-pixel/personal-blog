import { ArrowLeft, ExternalLink, Github, Layers3 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectBySlug } from "@/lib/data";
import { parseStringArray, type PublicProject, unwrapTags } from "@/components/content/content-types";
import { MarkdownArticle } from "@/components/content/markdown-article";
import { MediaFrame } from "@/components/content/media-frame";
import { ProjectGalleryViewer } from "@/components/content/project-gallery-viewer";
import { ArchitectureBeam } from "@/components/site/projects/architecture-beam";

type PageProps = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic";

function architectureFromTechnologies(technologies: string[]) {
  const normalized = new Map(
    technologies.map((technology) => [technology.toLocaleLowerCase("en-US"), technology]),
  );
  const tier = (candidates: string[]) =>
    candidates
      .map((candidate) => normalized.get(candidate.toLocaleLowerCase("en-US")))
      .filter((technology): technology is string => Boolean(technology));
  const interfaceLayer = tier(["Next.js", "React", "PHP", "Java"]);
  const serviceLayer = tier(["Node.js", "Prisma"]);
  const dataLayer = tier(["SQLite", "MySQL"]);
  return [interfaceLayer, serviceLayer, dataLayer]
    .filter((items) => items.length > 0)
    .map((items) => items.join(" / "));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const row = await getProjectBySlug(slug);
  if (!row) return { title: "项目不存在" };
  const project = row as PublicProject;
  return {
    title: project.seoTitle || project.title,
    description: project.seoDescription || project.summary,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: {
      type: "article",
      title: project.seoTitle || project.title,
      description: project.seoDescription || project.summary,
      images: project.coverImage ? [{ url: project.coverImage, alt: project.coverAlt || project.title }] : undefined,
    },
  };
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const row = await getProjectBySlug(slug);
  if (!row) notFound();
  const project = row as PublicProject;
  const technologies = parseStringArray(project.technologyJson);
  const architecture = architectureFromTechnologies(technologies);
  const gallery = parseStringArray(project.galleryJson);
  const tags = unwrapTags(project.tags);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: project.summary,
    image: project.coverImage || undefined,
    author: { "@type": "Person", name: "R7" },
    inLanguage: "zh-CN",
  };

  return (
    <main id="main-content">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <header className="px-[clamp(1rem,4vw,4rem)] pb-12 pt-[clamp(3rem,8vw,7rem)]">
        <div className="mx-auto max-w-[1400px]">
          <Link href="/projects" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted)] hover:text-[var(--ink)]">
            <ArrowLeft aria-hidden size={17} /> 返回项目
          </Link>
          <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <p className="font-mono text-sm text-[var(--success)]">PROJECT CASE</p>
              <h1 className="mt-5 text-[clamp(3.3rem,8vw,7.5rem)] font-black leading-[.88] tracking-[-.075em]">{project.title}</h1>
            </div>
            <div className="lg:col-span-4">
              <p className="text-lg leading-8 text-[var(--muted)]">{project.summary}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                {project.demoUrl ? (
                  <a href={project.demoUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--accent)] px-5 font-semibold text-[var(--accent-ink)]">
                    查看演示 <ExternalLink aria-hidden size={17} />
                  </a>
                ) : null}
                {project.sourceUrl ? (
                  <a href={project.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--line)] px-5 font-semibold">
                    查看源码 <Github aria-hidden size={17} />
                  </a>
                ) : null}
              </div>
            </div>
          </div>
          <MediaFrame src={project.coverImage} alt={project.coverAlt} title={project.title} ratio="wide" priority className="mt-12" />
        </div>
      </header>

      <section className="border-y border-[var(--line)] px-[clamp(1rem,4vw,4rem)] py-8" aria-label="项目技术信息">
        <div className="mx-auto grid max-w-[1280px] gap-7 md:grid-cols-12">
          <div className="md:col-span-3">
            <p className="text-xs font-semibold text-[var(--muted)]">技术栈</p>
            <p className="mt-2 font-mono text-sm">{technologies.length ? technologies.join(" / ") : "详见项目正文"}</p>
          </div>
          <div className="md:col-span-3">
            <p className="text-xs font-semibold text-[var(--muted)]">主题</p>
            <p className="mt-2 text-sm">{tags.length ? tags.map((tag) => tag.name).join(" · ") : "独立构建"}</p>
          </div>
          <div className="md:col-span-6">
            <p className="text-xs font-semibold text-[var(--muted)]">记录方式</p>
            <p className="mt-2 text-sm">背景与目标、实现取舍、界面证据、结果与复盘</p>
          </div>
        </div>
      </section>

      <section className="px-[clamp(1rem,4vw,4rem)] py-[clamp(5rem,10vw,9rem)]" aria-labelledby="project-process">
        <div className="mx-auto grid max-w-[1180px] gap-12 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <Layers3 className="text-[var(--success)]" aria-hidden size={30} strokeWidth={1.5} />
            <h2 id="project-process" className="mt-5 text-3xl font-semibold tracking-[-.05em]">从问题到实现</h2>
            <p className="mt-4 leading-7 text-[var(--muted)]">按真实决策顺序展开，不把技术名词当作结果。</p>
          </div>
          <div className="space-y-10 lg:col-span-8 lg:col-start-5">
            {architecture.length >= 3 ? (
              <ArchitectureBeam steps={architecture} />
            ) : null}
            <MarkdownArticle markdown={project.body || "项目正文正在整理。"} />
          </div>
        </div>
      </section>

      {gallery.length ? (
        <section className="bg-[var(--surface-strong)] px-[clamp(1rem,4vw,4rem)] py-[clamp(5rem,10vw,9rem)]" aria-labelledby="project-gallery">
          <div className="mx-auto max-w-[1400px]">
            <h2 id="project-gallery" className="mb-10 text-[clamp(2.4rem,5vw,4.5rem)] font-semibold tracking-[-.06em]">界面证据</h2>
            <ProjectGalleryViewer images={gallery} title={project.title} />
          </div>
        </section>
      ) : null}

      <section className="bg-[var(--accent)] px-[clamp(1rem,4vw,4rem)] py-[clamp(4rem,8vw,7rem)] text-[var(--accent-ink)]">
        <div className="mx-auto grid max-w-[1180px] gap-8 lg:grid-cols-12">
          <h2 className="text-[clamp(2.5rem,5vw,4.5rem)] font-semibold leading-none tracking-[-.06em] lg:col-span-6">完成不是终点，复盘才让经验留下。</h2>
          <div className="lg:col-span-5 lg:col-start-8">
            <p className="text-lg leading-8 opacity-80">这个案例保留了当时的能力边界与判断。后续迭代会继续记录变化，而不会把旧问题悄悄抹掉。</p>
            <Link href="/projects" className="mt-7 inline-flex min-h-11 items-center rounded-full bg-white px-5 font-semibold text-[#087E69]">
              继续看其他项目
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
