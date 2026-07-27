import type { ContentStatus, Prisma } from "@prisma/client";
import { Edit3, ExternalLink, Link2, Star, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { deleteFriendLink } from "@/actions/garden-admin";
import { ConfirmButton, SearchField } from "@/components/admin/AdminControls";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { GardenActionForm } from "@/components/admin/GardenActionForm";
import { Pagination } from "@/components/admin/Pagination";
import { db } from "@/lib/db";

const PAGE_SIZE = 15;
const statuses = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
const statusLabel = {
  ARCHIVED: "已归档",
  DRAFT: "草稿",
  PUBLISHED: "已发布",
} as const;

function parseTags(raw: string) {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((tag): tag is string => typeof tag === "string")
      : [];
  } catch {
    return [];
  }
}

export default async function AdminFriendsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const rawStatus = typeof params.status === "string" ? params.status : "";
  const status = statuses.includes(rawStatus as (typeof statuses)[number])
    ? (rawStatus as ContentStatus)
    : undefined;
  const rawPage = Number(typeof params.page === "string" ? params.page : "1");
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
  const where: Prisma.FriendLinkWhereInput = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q } },
            { url: { contains: q } },
            { description: { contains: q } },
            { tagsJson: { contains: q } },
          ],
        }
      : {}),
  };
  const [friends, count] = await Promise.all([
    db.friendLink.findMany({
      orderBy: [
        { featured: "desc" },
        { position: "asc" },
        { publishedAt: "desc" },
        { createdAt: "desc" },
      ],
      select: {
        avatarUrl: true,
        description: true,
        featured: true,
        id: true,
        name: true,
        position: true,
        status: true,
        tagsJson: true,
        url: true,
      },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      where,
    }),
    db.friendLink.count({ where }),
  ]);
  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <>
      <AdminHeader
        action={{ href: "/admin/friends/new", label: "添加友链" }}
        description="维护站点资料、公开描述、标签与排序；后台联系方式不会在列表和公开页面显示。"
        eyebrow="GARDEN / FRIENDS"
        title="友链"
      />

      <form className="mb-7 grid gap-3 border-b border-[var(--line)] pb-6 md:grid-cols-[minmax(14rem,1fr)_12rem_auto]" method="get">
        <SearchField defaultValue={q} placeholder="搜索名称、网址、描述或标签" />
        <label>
          <span className="sr-only">按状态筛选</span>
          <select
            className="min-h-11 w-full border border-[var(--line)] bg-[var(--canvas)] px-3 text-sm"
            defaultValue={status ?? ""}
            name="status"
          >
            <option value="">全部状态</option>
            {statuses.map((item) => (
              <option key={item} value={item}>
                {statusLabel[item]}
              </option>
            ))}
          </select>
        </label>
        <button className="min-h-11 border border-[var(--ink)] px-5 text-sm" type="submit">
          筛选
        </button>
      </form>

      {friends.length ? (
        <ul className="grid border-l border-t border-[var(--line)] md:grid-cols-2 xl:grid-cols-3">
          {friends.map((friend) => {
            const tags = parseTags(friend.tagsJson);
            return (
              <li className="min-w-0 border-b border-r border-[var(--line)] p-4" key={friend.id}>
                <div className="flex gap-4">
                  <div className="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--ink)_6%,transparent)]">
                    {friend.avatarUrl ? (
                      <Image
                        alt=""
                        className="object-cover"
                        fill
                        sizes="56px"
                        src={friend.avatarUrl}
                      />
                    ) : (
                      <Link2 aria-hidden="true" className="text-[var(--muted)]" size={23} strokeWidth={1.4} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        className="truncate font-semibold hover:text-[var(--accent)]"
                        href={`/admin/friends/${friend.id}/edit`}
                      >
                        {friend.name}
                      </Link>
                      {friend.featured ? (
                        <Star aria-label="精选" className="shrink-0 text-[var(--accent)]" fill="currentColor" size={13} />
                      ) : null}
                    </div>
                    <Link
                      className="mt-1 inline-flex min-h-11 max-w-full items-center gap-1.5 truncate font-mono text-[10px] text-[var(--muted)] hover:text-[var(--accent)]"
                      href={friend.url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <span className="truncate">{friend.url}</span>
                      <ExternalLink aria-hidden="true" className="shrink-0" size={12} />
                    </Link>
                  </div>
                </div>
                <p className="mt-3 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-[var(--muted)]">
                  {friend.description}
                </p>
                {tags.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span className="border border-[var(--line)] px-2 py-1 text-[10px] text-[var(--muted)]" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
                <p className="mt-4 font-mono text-[10px] uppercase text-[var(--muted)]">
                  {statusLabel[friend.status]} · ORDER {friend.position}
                </p>
                <div className="mt-3 flex items-center justify-between border-t border-[var(--line)] pt-2">
                  <Link
                    className="inline-flex min-h-11 items-center gap-2 text-sm text-[var(--accent)]"
                    href={`/admin/friends/${friend.id}/edit`}
                  >
                    <Edit3 aria-hidden="true" size={15} />
                    编辑
                  </Link>
                  <GardenActionForm action={deleteFriendLink} successMessage="友链已删除。">
                    <input name="id" type="hidden" value={friend.id} />
                    <ConfirmButton message={`确定删除友链“${friend.name}”？`}>
                      <span className="grid size-11 place-items-center">
                        <span className="sr-only">删除友链“{friend.name}”</span>
                        <Trash2 aria-hidden="true" size={15} />
                      </span>
                    </ConfirmButton>
                  </GardenActionForm>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="grid min-h-72 place-items-center border-y border-[var(--line)] text-center">
          <div>
            <Link2 aria-hidden="true" className="mx-auto mb-4 text-[var(--muted)]" size={34} strokeWidth={1.2} />
            <p className="font-medium">没有匹配的友链</p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              添加真实站点资料，审核后再公开发布。
            </p>
          </div>
        </div>
      )}
      <Pagination
        page={Math.min(page, pageCount)}
        pageCount={pageCount}
        searchParams={{ q, status }}
      />
    </>
  );
}
