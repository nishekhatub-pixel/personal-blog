import { ArrowRight, CalendarDays, CircleDotDashed } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getFeaturedPosts, getFeaturedProjects, getSiteSettings } from "@/lib/data";
import type { PublicPost, PublicProject } from "@/components/content/content-types";

export const metadata: Metadata = {
  title: "此刻",
  description: "R7 当前正在学习、构建、阅读与调整的事情。",
  alternates: { canonical: "/now" },
};
export const dynamic = "force-dynamic";

export default async function NowPage() {
  const [settings, posts, projects] = await Promise.all([
    getSiteSettings(),
    getFeaturedPosts(),
    getFeaturedProjects(),
  ]);
  const post = (posts as PublicPost[])[0];
  const project = (projects as PublicProject[])[0];

  return (
    <main id="main-content" className="px-[clamp(1rem,4vw,4rem)] py-[clamp(4rem,10vw,9rem)]">
      <div className="mx-auto max-w-[1180px]">
        <header className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <p className="flex items-center gap-2 text-sm font-semibold text-[var(--success)]"><CircleDotDashed aria-hidden size={18} /> 当前状态</p>
            <h1 className="mt-5 text-[clamp(3.8rem,10vw,8.5rem)] font-black leading-[.85] tracking-[-.08em]">此刻</h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[var(--muted)]">这不是任务看板，而是一张短期切片。它会诚实地变化，也允许某些事情暂时没有进展。</p>
          </div>
          <p className="flex items-center gap-2 font-mono text-xs text-[var(--muted)] lg:col-span-3 lg:col-start-10">
            <CalendarDays aria-hidden size={16} /> 最近更新：本月
          </p>
        </header>

        <div className="mt-20 grid gap-4 md:grid-cols-12">
          <section className="rounded-xl bg-[var(--accent)] p-7 text-[var(--accent-ink)] md:col-span-7 md:min-h-80 md:p-10" aria-labelledby="now-focus">
            <p className="font-mono text-xs opacity-70">FOCUS</p>
            <h2 id="now-focus" className="mt-16 text-[clamp(2.3rem,5vw,4.5rem)] font-semibold leading-[1.02] tracking-[-.06em]">
              {settings.nowText || "把一个完整想法，做成可以被真正使用的作品。"}
            </h2>
          </section>
          <section className="rounded-xl border border-[var(--line)] p-7 md:col-span-5 md:p-9" aria-labelledby="now-learning">
            <p className="font-mono text-xs text-[var(--success)]">LEARNING</p>
            <h2 id="now-learning" className="mt-14 text-3xl font-semibold tracking-[-.05em]">正在补齐的基础</h2>
            <p className="mt-5 leading-8 text-[var(--muted)]">数据库建模、服务端边界、自动化测试，以及怎样让界面更易访问。</p>
          </section>
          <section className="rounded-xl border border-[var(--line)] p-7 md:col-span-4 md:p-9" aria-labelledby="now-rhythm">
            <p className="font-mono text-xs text-[var(--success)]">RHYTHM</p>
            <h2 id="now-rhythm" className="mt-12 text-3xl font-semibold tracking-[-.05em]">保持节奏</h2>
            <p className="mt-5 leading-8 text-[var(--muted)]">每周安排固定的阅读、构建、练琴和运动时间，让注意力不过度依赖情绪。</p>
          </section>
          <section className="rounded-xl bg-[var(--surface-strong)] p-7 md:col-span-8 md:p-9" aria-labelledby="now-output">
            <p className="font-mono text-xs text-[var(--success)]">RECENT OUTPUT</p>
            <h2 id="now-output" className="mt-12 text-3xl font-semibold tracking-[-.05em]">最近留下的结果</h2>
            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              {post ? (
                <Link href={`/blog/${post.slug}`} className="group border-l-2 border-[var(--accent)] pl-4">
                  <span className="text-xs text-[var(--muted)]">文章</span>
                  <strong className="mt-2 block group-hover:text-[var(--success)]">{post.title}</strong>
                </Link>
              ) : <p className="text-[var(--muted)]">文章正在整理。</p>}
              {project ? (
                <Link href={`/projects/${project.slug}`} className="group border-l-2 border-[var(--accent)] pl-4">
                  <span className="text-xs text-[var(--muted)]">项目</span>
                  <strong className="mt-2 block group-hover:text-[var(--success)]">{project.title}</strong>
                </Link>
              ) : <p className="text-[var(--muted)]">项目正在归档。</p>}
            </div>
          </section>
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-between gap-5 border-t border-[var(--line)] pt-7">
          <p className="text-[var(--muted)]">想了解长期轨迹，可以从关于页继续。</p>
          <Link href="/about" className="inline-flex items-center gap-2 font-semibold text-[var(--success)]">关于我的学习方式 <ArrowRight aria-hidden size={18} /></Link>
        </div>
      </div>
    </main>
  );
}
