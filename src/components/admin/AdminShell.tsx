"use client";

import {
  BookOpenText,
  ChevronRight,
  CircleGauge,
  Disc3,
  FileText,
  FolderKanban,
  ImageIcon,
  Images,
  Link2,
  ListMusic,
  LogOut,
  Menu,
  MessageCircle,
  MessageCircleMore,
  MessageSquareText,
  Settings,
  Tags,
  type LucideIcon,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { logoutAction } from "@/actions/admin";
import { ThemeToggle } from "@/components/site/theme-toggle";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

const navItems: readonly NavItem[] = [
  { href: "/admin", label: "概览", icon: CircleGauge, exact: true },
  { href: "/admin/posts", label: "文章", icon: FileText },
  { href: "/admin/categories", label: "分类", icon: BookOpenText },
  { href: "/admin/tags", label: "标签", icon: Tags },
  { href: "/admin/projects", label: "项目", icon: FolderKanban },
  { href: "/admin/moments", label: "说说", icon: MessageCircle },
  { href: "/admin/albums", label: "相册", icon: Images },
  { href: "/admin/photos", label: "照片", icon: ImageIcon },
  { href: "/admin/music", label: "音乐", icon: Disc3 },
  { href: "/admin/playlists", label: "歌单", icon: ListMusic },
  { href: "/admin/guestbook", label: "留言墙", icon: MessageCircleMore },
  { href: "/admin/friends", label: "友链", icon: Link2 },
  { href: "/admin/media", label: "媒体", icon: ImageIcon },
  { href: "/admin/comments", label: "评论", icon: MessageSquareText },
  { href: "/admin/settings", label: "设置", icon: Settings },
] as const;

type AdminShellProps = {
  children: React.ReactNode;
  userName: string;
};

function AdminNavigation({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav
      aria-label="后台导航"
      className="mt-8 grid min-h-0 flex-1 content-start gap-1 overflow-y-auto overscroll-contain pr-1"
    >
      {navItems.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);

        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={[
              "group flex min-h-11 items-center justify-between border-l-2 px-4 py-2.5 text-sm transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2",
              active
                ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_9%,transparent)] text-[var(--ink)]"
                : "border-transparent text-[var(--muted)] hover:border-[var(--line)] hover:text-[var(--ink)]",
            ].join(" ")}
            href={href}
            key={href}
            onClick={onNavigate}
          >
            <span className="flex items-center gap-3">
              <Icon aria-hidden="true" size={17} strokeWidth={1.7} />
              {label}
            </span>
            <ChevronRight
              aria-hidden="true"
              className={active ? "opacity-100" : "opacity-0 group-hover:opacity-60"}
              size={15}
            />
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell({ children, userName }: AdminShellProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerCloseRef = useRef<HTMLButtonElement>(null);
  const drawerTriggerRef = useRef<HTMLButtonElement | null>(null);

  const openDrawer = (trigger: HTMLButtonElement) => {
    drawerTriggerRef.current = trigger;
    setDrawerOpen(true);
  };

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    window.requestAnimationFrame(() => drawerTriggerRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!drawerOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawerCloseRef.current?.focus();
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDrawer();
    };
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [closeDrawer, drawerOpen]);

  return (
    <div className="min-h-[100dvh] bg-[var(--canvas)] text-[var(--ink)]">
      <a
        className="fixed left-4 top-4 z-[80] -translate-y-24 bg-[var(--ink)] px-4 py-2 text-sm text-[var(--canvas)] focus:translate-y-0"
        href="#main-content"
      >
        跳到主要内容
      </a>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-[var(--line)] bg-[var(--canvas)] lg:block">
        <div className="flex h-full flex-col px-5 py-7">
          <Link
            className="inline-flex items-baseline gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            href="/admin"
          >
            <span className="font-mono text-xs text-[var(--success)]">R7 /</span>
            <span className="text-base font-semibold tracking-[-0.02em]">编辑室</span>
          </Link>
          <AdminNavigation pathname={pathname} />
          <div className="mt-auto border-t border-[var(--line)] pt-5">
            <p className="mb-3 truncate text-xs text-[var(--muted)]">
              当前账号 · {userName}
            </p>
            <form action={logoutAction}>
              <button
                className="flex min-h-11 w-full items-center gap-3 text-sm text-[var(--muted)] transition-colors hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                type="submit"
              >
                <LogOut aria-hidden="true" size={16} />
                退出登录
              </button>
            </form>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--canvas)_92%,transparent)] px-5 backdrop-blur-md lg:ml-64 lg:px-10">
        <button
          aria-controls="admin-drawer"
          aria-expanded={drawerOpen}
          aria-label="打开后台导航"
          className="grid size-11 place-items-center border border-[var(--line)] lg:hidden"
          onClick={(event) => openDrawer(event.currentTarget)}
          type="button"
        >
          <Menu aria-hidden="true" size={19} />
        </button>
        <p className="hidden text-xs uppercase tracking-[0.18em] text-[var(--muted)] sm:block">
          Content operating system
        </p>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            className="text-sm text-[var(--muted)] underline-offset-4 transition-colors hover:text-[var(--ink)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            href="/"
            target="_blank"
          >
            查看网站
            <span className="sr-only">（在新标签页打开）</span>
          </Link>
        </div>
      </header>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="关闭后台导航"
            className="absolute inset-0 bg-black/55"
            onClick={closeDrawer}
            type="button"
          />
          <aside
            aria-label="后台移动导航"
            className="absolute inset-y-0 left-0 flex w-[min(86vw,22rem)] flex-col overflow-hidden border-r border-[var(--line)] bg-[var(--canvas)] p-5 shadow-2xl"
            id="admin-drawer"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold">R7 编辑室</span>
              <button
                aria-label="关闭导航"
                className="grid size-11 place-items-center border border-[var(--line)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                onClick={closeDrawer}
                ref={drawerCloseRef}
                type="button"
              >
                <X aria-hidden="true" size={19} />
              </button>
            </div>
            <AdminNavigation
              onNavigate={closeDrawer}
              pathname={pathname}
            />
            <form action={logoutAction} className="mt-8">
              <button
                className="flex min-h-11 items-center gap-3 text-sm text-[var(--muted)]"
                type="submit"
              >
                <LogOut aria-hidden="true" size={16} />
                退出登录
              </button>
            </form>
          </aside>
        </div>
      ) : null}

      <main
        className="min-w-0 px-5 pb-28 pt-8 sm:px-7 lg:ml-64 lg:px-10 lg:pb-16 lg:pt-11"
        id="main-content"
      >
        {children}
      </main>

      <nav
        aria-label="后台快捷导航"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-[var(--line)] bg-[color-mix(in_srgb,var(--canvas)_96%,transparent)] px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md lg:hidden"
      >
        {navItems.slice(0, 4).map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={[
                "flex min-h-12 flex-col items-center justify-center gap-1 text-[10px]",
                active ? "text-[var(--success)]" : "text-[var(--muted)]",
              ].join(" ")}
              href={href}
              key={href}
            >
              <Icon aria-hidden="true" size={18} strokeWidth={1.7} />
              {label}
            </Link>
          );
        })}
        <button
          aria-label="打开更多后台导航"
          className="flex min-h-12 flex-col items-center justify-center gap-1 text-[10px] text-[var(--muted)]"
          onClick={(event) => openDrawer(event.currentTarget)}
          type="button"
        >
          <Menu aria-hidden="true" size={18} strokeWidth={1.7} />
          更多
        </button>
      </nav>
    </div>
  );
}
