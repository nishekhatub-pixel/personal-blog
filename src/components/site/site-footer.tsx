import { ArrowUpRight, Rss } from "lucide-react";
import Link from "next/link";

const linkGroups = [
  {
    label: "内容",
    links: [
      { href: "/blog", label: "文章" },
      { href: "/projects", label: "项目" },
      { href: "/archive", label: "归档" },
      { href: "/categories", label: "分类" },
      { href: "/tags", label: "标签" },
    ],
  },
  {
    label: "花园",
    links: [
      { href: "/photos", label: "照片墙" },
      { href: "/music", label: "音乐" },
      { href: "/moments", label: "说说" },
      { href: "/guestbook", label: "留言墙" },
      { href: "/friends", label: "友链" },
    ],
  },
  {
    label: "站点",
    links: [
      { href: "/about", label: "关于" },
      { href: "/now", label: "此刻" },
      { href: "/search", label: "搜索" },
      { href: "/contact", label: "联系" },
    ],
  },
] as const;

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function runningDays(value: string) {
  if (!value) return null;
  const launch = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(launch.getTime())) return null;
  return Math.max(
    0,
    Math.floor((Date.now() - launch.getTime()) / 86_400_000) + 1,
  );
}

export function SiteFooter({
  latestUpdateIso,
  pageViews,
  siteLaunchDate,
  siteName,
  siteSubtitle,
}: {
  latestUpdateIso: string | null;
  pageViews: number;
  siteLaunchDate: string;
  siteName: string;
  siteSubtitle: string;
}) {
  const days = runningDays(siteLaunchDate);

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__identity">
          <p className="site-footer__mark">R7</p>
          <p className="site-footer__name">{siteName}</p>
          <p className="site-footer__copy">{siteSubtitle}</p>
          <div className="mt-5 flex flex-wrap gap-4">
            <Link className="site-footer__action" href="/rss.xml">
              <Rss aria-hidden="true" size={16} strokeWidth={1.7} />
              RSS
            </Link>
            <Link className="site-footer__action" href="/contact">
              联系我
              <ArrowUpRight aria-hidden="true" size={16} strokeWidth={1.7} />
            </Link>
          </div>
        </div>

        <nav aria-label="页脚导航" className="site-footer__navigation">
          {linkGroups.map((group) => (
            <section aria-labelledby={`footer-${group.label}`} key={group.label}>
              <h2 className="site-footer__group-title" id={`footer-${group.label}`}>
                {group.label}
              </h2>
              <ul className="site-footer__links">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </nav>

        <div className="site-footer__runtime">
          <p>累计浏览 {pageViews.toLocaleString("zh-CN")}</p>
          {days !== null ? <p>已运行 {days.toLocaleString("zh-CN")} 天</p> : null}
          {latestUpdateIso ? (
            <p>
              最近更新{" "}
              <time dateTime={latestUpdateIso}>
                {dateFormatter.format(new Date(latestUpdateIso))}
              </time>
            </p>
          ) : (
            <p>暂无公开内容更新</p>
          )}
          <p>© {new Date().getFullYear()} R7</p>
        </div>
      </div>
    </footer>
  );
}
