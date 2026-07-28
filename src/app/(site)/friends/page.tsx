import { ArrowUpRight, Link2, LockKeyhole, Star } from "lucide-react";
import type { Metadata } from "next";
import { FriendApplicationForm } from "@/components/site/friends/friend-application-form";
import { PageIntro } from "@/components/site/page-intro";
import { getSiteSettings } from "@/lib/data";
import { getPublishedFriendLinks } from "@/lib/garden-data";

export const metadata: Metadata = {
  title: "友链",
  description: "R7 数字花园中真实、持续更新的朋友站点。",
  alternates: { canonical: "/friends" },
};
export const dynamic = "force-dynamic";

function enabled(value: string | undefined) {
  return value?.trim().toLocaleLowerCase("en-US") !== "false";
}

function initial(value: string) {
  return Array.from(value.trim())[0]?.toLocaleUpperCase("zh-CN") ?? "R";
}

export default async function FriendsPage() {
  const [settings, links] = await Promise.all([
    getSiteSettings(),
    getPublishedFriendLinks(),
  ]);
  const formEnabled = enabled(settings.friendsEnabled);

  return (
    <main id="main-content">
      <PageIntro
        eyebrow="朋友站点"
        title="友链"
        description="这里收录我真实阅读和认识的个人站点。每一条链接都经过审核，不用示例站点填充数量。"
      />

      <section className="px-[var(--page-gutter)] pb-[clamp(5rem,10vw,9rem)]">
        <div className="mx-auto grid max-w-[var(--content-max)] gap-12 xl:grid-cols-[minmax(0,1.35fr)_minmax(22rem,.8fr)] xl:items-start">
          <div>
            <div className="flex items-end justify-between gap-5 border-b border-[var(--line)] pb-5">
              <h2 className="text-[clamp(2rem,4vw,3.2rem)] font-semibold tracking-[-.05em]">
                公开站点
              </h2>
              <p className="font-mono text-sm text-[var(--muted)]">
                {links.length} 个
              </p>
            </div>

            {links.length ? (
              <ol className="mt-6 grid gap-5 md:grid-cols-2">
                {links.map((link, index) => (
                  <li
                    key={link.id}
                    className={
                      link.featured && index === 0 ? "md:col-span-2" : ""
                    }
                  >
                    <article className="garden-card group flex h-full min-w-0 flex-col p-6">
                      <div className="flex items-start gap-4">
                        {link.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={link.avatarUrl}
                            alt={`${link.name}头像`}
                            width={56}
                            height={56}
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            className="size-14 shrink-0 rounded-[var(--radius-control,.625rem)] border border-[var(--line)] object-cover"
                          />
                        ) : (
                          <span
                            aria-hidden
                            className="grid size-14 shrink-0 place-items-center rounded-[var(--radius-control,.625rem)] bg-[var(--accent-soft)] text-xl font-black text-[var(--accent)]"
                          >
                            {initial(link.name)}
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-xl font-semibold tracking-[-.035em]">
                              {link.name}
                            </h3>
                            {link.featured ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)]">
                                <Star aria-hidden size={14} />
                                精选
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-3 break-words leading-7 text-[var(--muted)]">
                            {link.description}
                          </p>
                        </div>
                      </div>

                      {link.tags.length ? (
                        <ul className="mt-5 flex flex-wrap gap-2" aria-label="站点标签">
                          {link.tags.map((tag) => (
                            <li
                              key={tag}
                              className="rounded-full border border-[var(--line)] px-3 py-1 text-xs text-[var(--muted)]"
                            >
                              {tag}
                            </li>
                          ))}
                        </ul>
                      ) : null}

                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-6 inline-flex min-h-11 w-fit items-center gap-2 font-semibold text-[var(--accent)]"
                        aria-label={`访问 ${link.name}，在新窗口打开`}
                      >
                        访问站点
                        <ArrowUpRight
                          aria-hidden
                          size={17}
                          className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                        />
                      </a>
                    </article>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="garden-panel grid min-h-80 place-items-center px-6 text-center">
                <div className="max-w-lg">
                  <Link2
                    aria-hidden
                    className="mx-auto text-[var(--accent)]"
                    size={34}
                    strokeWidth={1.4}
                  />
                  <h2 className="mt-6 text-3xl font-semibold tracking-[-.045em]">
                    友链列表正在建立
                  </h2>
                  <p className="mt-4 leading-8 text-[var(--muted)]">
                    这里只展示真实通过审核的站点。还没有数据时，保持空白比虚构朋友更诚实。
                  </p>
                </div>
              </div>
            )}
          </div>

          <aside className="xl:sticky xl:top-[calc(var(--header-height)+1.5rem)]">
            {formEnabled ? (
              <FriendApplicationForm />
            ) : (
              <div className="garden-panel p-7">
                <LockKeyhole
                  aria-hidden
                  className="text-[var(--accent)]"
                  size={28}
                  strokeWidth={1.5}
                />
                <h2 className="mt-5 text-2xl font-semibold tracking-[-.04em]">
                  友链申请暂时关闭
                </h2>
                <p className="mt-3 leading-7 text-[var(--muted)]">
                  已发布的站点仍然可以访问。重新开放时会恢复申请表。
                </p>
              </div>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}
