import {
  ArrowUpRight,
  FilePenLine,
  FolderKanban,
  MessageSquareText,
  ScanSearch,
} from "lucide-react";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { db } from "@/lib/db";
import { getGardenAdminStats } from "@/lib/garden-data";

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function AdminDashboardPage() {
  const [
    postCount,
    publishedPostCount,
    projectCount,
    pendingCommentCount,
    mediaCount,
    totalViews,
    recentPosts,
    recentComments,
    gardenStats,
  ] = await Promise.all([
    db.post.count(),
    db.post.count({ where: { status: "PUBLISHED" } }),
    db.project.count(),
    db.comment.count({ where: { status: "PENDING" } }),
    db.media.count(),
    db.pageView.count(),
    db.post.findMany({
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, status: true, updatedAt: true },
      take: 5,
    }),
    db.comment.findMany({
      include: { post: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    getGardenAdminStats(),
  ]);

  const metrics = [
    {
      label: "文章",
      value: postCount,
      note: `${publishedPostCount} 篇已发布`,
      href: "/admin/posts",
    },
    {
      label: "项目",
      value: projectCount,
      note: "完整案例与实验",
      href: "/admin/projects",
    },
    {
      label: "待审核",
      value: pendingCommentCount,
      note: "需要你的判断",
      href: "/admin/comments?status=PENDING",
    },
    {
      label: "总浏览",
      value: totalViews,
      note: `${mediaCount} 个媒体文件`,
      href: "/admin/media",
    },
  ];
  const gardenMetrics = [
    { href: "/admin/moments", label: "说说", value: gardenStats.content.moments },
    { href: "/admin/albums", label: "相册", value: gardenStats.content.albums },
    { href: "/admin/photos", label: "照片", value: gardenStats.content.photos },
    { href: "/admin/music", label: "音乐", value: gardenStats.content.musicTracks },
    { href: "/admin/playlists", label: "歌单", value: gardenStats.content.playlists },
    { href: "/admin/guestbook", label: "留言", value: gardenStats.content.guestbookMessages },
    { href: "/admin/friends", label: "友链", value: gardenStats.content.friendLinks },
  ];

  return (
    <>
      <AdminHeader
        action={{ href: "/admin/posts/create", label: "写新文章" }}
        description="从真实内容与互动数据出发，决定今天最值得推进的一件事。"
        eyebrow="CONTROL ROOM"
        title="早上好，R7"
      />

      <section aria-labelledby="metrics-title">
        <h2 className="sr-only" id="metrics-title">
          内容指标
        </h2>
        <div className="grid border-y border-[var(--line)] sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric, index) => (
            <Link
              className={[
                "group min-h-40 p-5 transition-colors hover:bg-[color-mix(in_srgb,var(--ink)_3%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)]",
                index > 0 ? "border-t border-[var(--line)] sm:border-l" : "",
                index === 2 ? "sm:border-l-0 xl:border-l" : "",
                index > 1 ? "xl:border-t-0" : "sm:border-t-0",
              ].join(" ")}
              href={metric.href}
              key={metric.label}
            >
              <span className="flex items-center justify-between text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                {metric.label}
                <ArrowUpRight
                  aria-hidden="true"
                  className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  size={15}
                />
              </span>
              <strong className="mt-5 block font-mono text-5xl font-medium tracking-[-0.06em]">
                {metric.value.toLocaleString("zh-CN")}
              </strong>
              <span className="mt-3 block text-xs text-[var(--muted)]">
                {metric.note}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12" aria-labelledby="garden-metrics-title">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-[var(--line)] pb-4">
          <div>
            <p className="font-mono text-[11px] text-[var(--success)]">GARDEN V2</p>
            <h2 className="mt-1 text-xl font-semibold" id="garden-metrics-title">
              花园内容
            </h2>
          </div>
          <div className="flex flex-wrap gap-4 text-xs">
            <Link
              className="min-h-11 border border-[var(--line)] px-3 py-3 text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--ink)]"
              href="/admin/moments?view=comments&status=PENDING"
            >
              说说评论待审
              <strong className="ml-2 font-mono text-[var(--accent)]">
                {gardenStats.moderation.momentComments}
              </strong>
            </Link>
            <Link
              className="min-h-11 border border-[var(--line)] px-3 py-3 text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--ink)]"
              href="/admin/guestbook?status=PENDING"
            >
              留言待审
              <strong className="ml-2 font-mono text-[var(--accent)]">
                {gardenStats.moderation.guestbookMessages}
              </strong>
            </Link>
          </div>
        </div>
        <div className="grid border-l border-t border-[var(--line)] sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {gardenMetrics.map((metric) => (
            <Link
              className="group min-h-28 border-b border-r border-[var(--line)] p-4 transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_6%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)]"
              href={metric.href}
              key={metric.href}
            >
              <span className="flex items-center justify-between text-xs text-[var(--muted)]">
                {metric.label}
                <ArrowUpRight aria-hidden="true" size={14} />
              </span>
              <strong className="mt-4 block font-mono text-3xl tracking-[-0.05em]">
                {metric.value.toLocaleString("zh-CN")}
              </strong>
            </Link>
          ))}
        </div>
        <p className="mt-3 text-right font-mono text-[10px] text-[var(--muted)]">
          AUDIO · {gardenStats.audio.uploaded} UPLOAD / {gardenStats.audio.remote} REMOTE ·{" "}
          PENDING {gardenStats.moderation.total}
        </p>
      </section>

      <div className="mt-12 grid gap-12 xl:grid-cols-[1.15fr_0.85fr]">
        <section aria-labelledby="recent-posts">
          <div className="mb-5 flex items-end justify-between border-b border-[var(--line)] pb-4">
            <div>
              <p className="font-mono text-[11px] text-[var(--success)]">01</p>
              <h2 className="mt-1 text-xl font-semibold" id="recent-posts">
                最近编辑
              </h2>
            </div>
            <Link className="text-xs text-[var(--muted)] hover:text-[var(--ink)]" href="/admin/posts">
              查看全部
            </Link>
          </div>
          {recentPosts.length ? (
            <ol className="divide-y divide-[var(--line)]">
              {recentPosts.map((post) => (
                <li key={post.id}>
                  <Link
                    className="group grid min-h-20 grid-cols-[1fr_auto] items-center gap-5 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                    href={`/admin/posts/${post.id}/edit`}
                  >
                    <span>
                      <span className="line-clamp-1 text-sm font-medium group-hover:text-[var(--accent)]">
                        {post.title}
                      </span>
                      <span className="mt-1 block font-mono text-[11px] text-[var(--muted)]">
                        {post.status} · {dateFormatter.format(post.updatedAt)}
                      </span>
                    </span>
                    <FilePenLine aria-hidden="true" className="text-[var(--muted)]" size={17} />
                  </Link>
                </li>
              ))}
            </ol>
          ) : (
            <p className="py-10 text-sm text-[var(--muted)]">
              还没有文章。先写下第一篇生长记录。
            </p>
          )}
        </section>

        <section aria-labelledby="recent-comments">
          <div className="mb-5 flex items-end justify-between border-b border-[var(--line)] pb-4">
            <div>
              <p className="font-mono text-[11px] text-[var(--success)]">02</p>
              <h2 className="mt-1 text-xl font-semibold" id="recent-comments">
                最新回应
              </h2>
            </div>
            <Link className="text-xs text-[var(--muted)] hover:text-[var(--ink)]" href="/admin/comments">
              去审核
            </Link>
          </div>
          {recentComments.length ? (
            <ol className="divide-y divide-[var(--line)]">
              {recentComments.map((comment) => (
                <li className="py-4" key={comment.id}>
                  <div className="flex items-start gap-3">
                    <MessageSquareText
                      aria-hidden="true"
                      className="mt-1 shrink-0 text-[var(--accent)]"
                      size={16}
                    />
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm leading-6">{comment.content}</p>
                      <p className="mt-1 truncate text-xs text-[var(--muted)]">
                        {comment.authorName} · {comment.post.title}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="py-10 text-sm text-[var(--muted)]">暂时没有读者评论。</p>
          )}
        </section>
      </div>

      <section className="mt-14 border-t border-[var(--line)] pt-7" aria-label="快捷操作">
        <div className="grid gap-px bg-[var(--line)] md:grid-cols-3">
          {[
            { href: "/admin/posts/create", label: "起草文章", icon: FilePenLine },
            { href: "/admin/projects/new", label: "新增项目", icon: FolderKanban },
            { href: "/admin/settings", label: "检查站点信息", icon: ScanSearch },
          ].map(({ href, label, icon: Icon }) => (
            <Link
              className="flex min-h-20 items-center justify-between bg-[var(--canvas)] px-5 text-sm transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_7%,var(--canvas))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)]"
              href={href}
              key={href}
            >
              {label}
              <Icon aria-hidden="true" size={18} strokeWidth={1.6} />
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
