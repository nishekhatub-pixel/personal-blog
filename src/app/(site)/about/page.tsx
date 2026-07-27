import {
  ArrowRight,
  BookOpenText,
  Code2,
  Dumbbell,
  Headphones,
  Keyboard,
  Mail,
  PencilRuler,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { OrbitingCircles } from "@/components/site/about/orbiting-circles";
import type { TimelineItem } from "@/components/content/content-types";
import { getSiteSettings, getTimelineEvents } from "@/lib/data";

export const metadata: Metadata = {
  title: "关于 R7",
  description: "认识软件技术专业学生 R7 的学习方式、技能边界、兴趣与当前目标。",
  alternates: { canonical: "/about" },
};
export const dynamic = "force-dynamic";

const skillGroups = [
  { title: "正在打基础", items: ["Java", "数据结构", "MySQL", "计算机网络"] },
  { title: "反复实践", items: ["JavaScript", "TypeScript", "React", "Next.js", "响应式网页"] },
  { title: "常用工具", items: ["Git", "Prisma", "Playwright", "VS Code", "AI Tools"] },
];

export default async function AboutPage() {
  const [timelineRows, settings] = await Promise.all([
    getTimelineEvents(),
    getSiteSettings(),
  ]);
  const timeline = timelineRows as TimelineItem[];

  return (
    <main id="main-content">
      <header className="px-[clamp(1rem,4vw,4rem)] py-[clamp(4rem,10vw,9rem)]">
        <div className="mx-auto grid max-w-[1280px] gap-12 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <p className="text-sm font-semibold text-[var(--accent)]">关于我</p>
            <h1 className="mt-5 text-[clamp(3.5rem,8vw,7.4rem)] font-black leading-[.91] tracking-[-.075em]">
              一边学习，
              <br />
              一边把东西做出来。
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-9 text-[var(--muted)]">
              我是 R7，一名软件技术专业学生。这里不包装一份“已经完成”的履历，而是如实记录 Java、JavaScript、MySQL、数据结构和前端学习怎样一点点进入真实项目。
            </p>
            {settings.nowText ? (
              <p className="mt-5 max-w-2xl border-l-2 border-[var(--accent)] pl-4 text-sm leading-7 text-[var(--muted)]">
                此刻：{settings.nowText}
              </p>
            ) : null}
            <Link href="/now" className="mt-8 inline-flex min-h-11 items-center gap-2 font-semibold text-[var(--accent)]">
              看我此刻在做什么 <ArrowRight aria-hidden size={18} />
            </Link>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-[var(--surface-strong)] lg:col-span-4 lg:col-start-9">
            <Image src="/images/r7-about-study.png" alt="R7 坐在电脑与钢琴之间学习和记录" fill priority sizes="(max-width: 1024px) 100vw, 34vw" className="object-cover" />
            <div className="absolute inset-x-0 bottom-0 bg-[#F3F1EA]/95 p-6 text-[#151816]">
              <p className="font-mono text-xs text-[#626B65]">SOFTWARE TECHNOLOGY STUDENT</p>
              <p className="mt-2 font-semibold">R7 · 数字花园持续维护中</p>
            </div>
          </div>
        </div>
      </header>

      <section className="border-y border-[var(--line)] px-[clamp(1rem,4vw,4rem)] py-[clamp(5rem,10vw,9rem)]" aria-labelledby="journey-heading">
        <div className="mx-auto max-w-[1180px]">
          <h2 id="journey-heading" className="text-[clamp(2.5rem,5vw,4.7rem)] font-semibold tracking-[-.06em]">我的学习回路</h2>
          <div className="mt-14 grid gap-0 md:grid-cols-4">
            {[
              ["阅读", "先建立词汇和问题地图，不急着记住全部结论。"],
              ["练习", "用足够小的例子确认理解，主动制造边界情况。"],
              ["构建", "把零散知识放进真实项目，接受完整约束。"],
              ["复盘", "记录为什么这样选，以及下一次怎样更清楚。"],
            ].map(([title, description], index) => (
              <article key={title} className="relative border-l border-[var(--line)] py-5 pl-5 pr-6 md:min-h-64">
                <span className="font-mono text-xs text-[var(--accent)]">{String(index + 1).padStart(2, "0")}</span>
                <h3 className="mt-10 text-3xl font-semibold tracking-[-.05em]">{title}</h3>
                <p className="mt-4 leading-7 text-[var(--muted)]">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-[clamp(1rem,4vw,4rem)] py-[clamp(5rem,11vw,10rem)]" aria-labelledby="skills-heading">
        <div className="mx-auto grid max-w-[1280px] gap-12 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-3">
            <Keyboard className="text-[var(--accent)]" aria-hidden size={32} strokeWidth={1.5} />
            <h2 id="skills-heading" className="mt-6 text-[clamp(2.5rem,5vw,4.5rem)] font-semibold leading-none tracking-[-.06em]">
              技能与
              <br />
              工具边界
            </h2>
            <p className="mt-6 leading-7 text-[var(--muted)]">不展示虚构熟练度，只区分我和这些知识相处的方式。</p>
          </div>
          <div className="lg:col-span-5 lg:col-start-4">
            {skillGroups.map((group) => (
              <div key={group.title} className="grid gap-4 border-b border-[var(--line)] py-7 sm:grid-cols-3">
                <h3 className="font-semibold text-[var(--accent)]">{group.title}</h3>
                <p className="leading-7 sm:col-span-2">{group.items.join(" · ")}</p>
              </div>
            ))}
          </div>
          <div className="lg:col-span-4">
            <OrbitingCircles />
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--line)] px-[clamp(1rem,4vw,4rem)] py-[clamp(5rem,10vw,9rem)]" aria-labelledby="projects-about">
        <div className="mx-auto max-w-[1280px]">
          <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-6">
              <Code2 aria-hidden="true" className="text-[var(--accent)]" size={30} strokeWidth={1.5} />
              <h2 id="projects-about" className="mt-5 text-[clamp(2.5rem,5vw,4.5rem)] font-semibold tracking-[-.06em]">
                项目是学习留下的证据
              </h2>
            </div>
            <p className="max-w-2xl leading-8 text-[var(--muted)] lg:col-span-5 lg:col-start-8">
              我做过 PHP + MySQL 博客练习，也在构建 Java 图书管理系统；R7 Digital Garden 则把内容、数据库、权限、上传、测试和部署放进同一个长期维护的项目。
            </p>
          </div>
          <div className="mt-12 grid border-l border-t border-[var(--line)] md:grid-cols-3">
            {[
              ["PHP + MySQL 博客", "理解页面、表单和数据库怎样组成最早的完整内容系统。"],
              ["Java 图书管理系统", "练习面向对象、数据建模和清晰的业务状态。"],
              ["R7 Digital Garden", "持续整合 Next.js、Prisma、SQLite/MySQL 与自动化测试。"],
            ].map(([title, description]) => (
              <article className="border-b border-r border-[var(--line)] p-6 md:min-h-56" key={title}>
                <h3 className="text-2xl font-semibold tracking-[-.04em]">{title}</h3>
                <p className="mt-5 leading-7 text-[var(--muted)]">{description}</p>
              </article>
            ))}
          </div>
          <Link href="/projects" className="mt-8 inline-flex min-h-11 items-center gap-2 font-semibold text-[var(--accent)]">
            查看完整项目记录 <ArrowRight aria-hidden size={18} />
          </Link>
        </div>
      </section>

      <section className="bg-[var(--surface-strong)] px-[clamp(1rem,4vw,4rem)] py-[clamp(5rem,10vw,9rem)]" aria-labelledby="interests-about">
        <div className="mx-auto max-w-[1280px]">
          <h2 id="interests-about" className="text-[clamp(2.5rem,5vw,4.5rem)] font-semibold tracking-[-.06em]">代码之外</h2>
          <div className="mt-12 space-y-3">
            <details className="group rounded-xl bg-[var(--canvas)] p-6 open:pb-8 md:p-8">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5">
                <span className="flex items-center gap-4 text-3xl font-semibold tracking-[-.045em]"><Headphones aria-hidden size={28} strokeWidth={1.5} /> 音乐与钢琴</span>
                <span className="font-mono text-sm text-[var(--accent)] group-open:hidden">展开</span>
                <span className="hidden font-mono text-sm text-[var(--accent)] group-open:inline">收起</span>
              </summary>
              <p className="mt-7 max-w-3xl text-lg leading-8 text-[var(--muted)]">我喜欢钢琴、唱歌和认真听歌。音乐让我重新理解节奏、重复和细微变化；练琴与调试代码很像，重要的不只是最终正确，也包括辨认错误发生在哪一拍。</p>
            </details>
            <details className="group rounded-xl bg-[var(--canvas)] p-6 open:pb-8 md:p-8">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5">
                <span className="flex items-center gap-4 text-3xl font-semibold tracking-[-.045em]"><Dumbbell aria-hidden size={28} strokeWidth={1.5} /> 运动与恢复</span>
                <span className="font-mono text-sm text-[var(--accent)] group-open:hidden">展开</span>
                <span className="hidden font-mono text-sm text-[var(--accent)] group-open:inline">收起</span>
              </summary>
              <p className="mt-7 max-w-3xl text-lg leading-8 text-[var(--muted)]">篮球、羽毛球、乒乓球和台球让我从屏幕抽离，把注意力和精力重新放回身体，再以更清楚的状态面对问题。</p>
            </details>
            <details className="group rounded-xl bg-[var(--canvas)] p-6 open:pb-8 md:p-8">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5">
                <span className="flex items-center gap-4 text-3xl font-semibold tracking-[-.045em]"><BookOpenText aria-hidden size={28} strokeWidth={1.5} /> 阅读与生活</span>
                <span className="font-mono text-sm text-[var(--accent)] group-open:hidden">展开</span>
                <span className="hidden font-mono text-sm text-[var(--accent)] group-open:inline">收起</span>
              </summary>
              <p className="mt-7 max-w-3xl text-lg leading-8 text-[var(--muted)]">阅读、照片和短记录保存那些不适合写成长文章的片段。它们让这座花园不仅有技术结论，也有一个学生真实经过的日常。</p>
            </details>
          </div>
        </div>
      </section>

      <section className="bg-[var(--surface)] px-[clamp(1rem,4vw,4rem)] py-[clamp(4rem,8vw,7rem)]" aria-labelledby="site-technology">
        <div className="mx-auto grid max-w-[1180px] gap-8 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h2 id="site-technology" className="text-3xl font-semibold tracking-[-.05em]">这座花园怎样运行</h2>
            <p className="mt-4 leading-7 text-[var(--muted)]">技术选择服务于长期写作、真实数据和可维护性。</p>
          </div>
          <dl className="grid gap-0 border-l border-t border-[var(--line)] sm:grid-cols-2 lg:col-span-7 lg:col-start-6">
            {[
              ["界面", "Next.js 16 · React 19 · Tailwind CSS 4"],
              ["数据", "Prisma 6 · SQLite 本地 · MySQL 8 生产"],
              ["内容", "Markdown · 媒体处理 · RSS · Sitemap"],
              ["质量", "Vitest · Playwright · axe · 响应式截图"],
            ].map(([term, detail]) => (
              <div className="border-b border-r border-[var(--line)] p-5" key={term}>
                <dt className="text-xs font-semibold text-[var(--accent)]">{term}</dt>
                <dd className="mt-2 text-sm leading-6 text-[var(--muted)]">{detail}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="px-[clamp(1rem,4vw,4rem)] py-[clamp(5rem,11vw,10rem)]" aria-labelledby="goals-heading">
        <div className="mx-auto max-w-[1280px]">
          <div className="grid gap-8 lg:grid-cols-12">
            <h2 id="goals-heading" className="text-[clamp(2.5rem,5vw,4.5rem)] font-semibold leading-none tracking-[-.06em] lg:col-span-5">现在想做好的事</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
              {[
                "完成一个从数据到界面的全栈作品",
                "把测试和可访问性放进日常开发",
                "持续写清楚技术选择背后的理由",
                "参与一次真实的开源协作",
              ].map((goal, index) => (
                <article key={goal} className={`rounded-xl p-6 ${index === 0 ? "bg-[var(--accent)] text-[var(--accent-ink)] sm:col-span-2" : "border border-[var(--line)]"}`}>
                  <PencilRuler aria-hidden size={22} strokeWidth={1.5} />
                  <h3 className="mt-8 text-2xl font-semibold tracking-[-.04em]">{goal}</h3>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {timeline.length ? (
        <section className="border-t border-[var(--line)] px-[clamp(1rem,4vw,4rem)] py-16">
          <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-5">
            <p className="font-semibold">想从时间线继续了解？</p>
            <Link href="/now" className="inline-flex min-h-11 items-center gap-2 text-[var(--accent)] font-semibold">查看当前状态 <ArrowRight aria-hidden size={18} /></Link>
          </div>
        </section>
      ) : null}

      <section className="bg-[var(--accent-soft)] px-[clamp(1rem,4vw,4rem)] py-[clamp(4rem,8vw,7rem)]">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-7 md:flex-row md:items-center md:justify-between">
          <div>
            <Mail className="text-[var(--accent)]" aria-hidden size={28} strokeWidth={1.5} />
            <h2 className="mt-5 text-4xl font-semibold tracking-[-.055em]">如果你也在认真构建，欢迎来聊。</h2>
          </div>
          <Link href="/contact" className="inline-flex min-h-12 shrink-0 items-center rounded-full bg-[var(--accent)] px-6 font-semibold text-[var(--accent-ink)]">
            联系 R7
          </Link>
        </div>
      </section>
    </main>
  );
}
