"use client";

import { Menu, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AtmosphereToggle } from "@/components/site/atmosphere/atmosphere-toggle";
import { Marquee } from "@/components/site/home/marquee";
import { ThemeToggle } from "@/components/site/theme-toggle";

const links = [
  { href: "/", label: "首页", exact: true },
  { href: "/blog", label: "文章" },
  { href: "/projects", label: "项目" },
  { href: "/archive", label: "归档" },
  { href: "/photos", label: "照片墙" },
  { href: "/music", label: "音乐" },
  { href: "/moments", label: "说说" },
  { href: "/guestbook", label: "留言墙" },
  { href: "/friends", label: "友链" },
  { href: "/about", label: "关于" },
] as const;

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader({
  announcement = "",
  siteName = "R7",
}: {
  announcement?: string;
  siteName?: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const closeDrawer = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const drawerTrigger = triggerRef.current;
    document.body.style.overflow = "hidden";
    firstLinkRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDrawer();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(
        drawerRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      window.requestAnimationFrame(() => drawerTrigger?.focus());
    };
  }, [closeDrawer, open]);

  return (
    <header className="site-header">
      {announcement ? <Marquee text={announcement} /> : null}
      <div className="site-header__bar">
        <Link
          aria-label={`${siteName}首页`}
          className="site-wordmark"
          href="/"
        >
          <span aria-hidden="true">R7</span>
          <span className="site-wordmark__name">{siteName}</span>
        </Link>

        <nav aria-label="主导航" className="site-header__desktop-nav">
          {links.map((link) => {
            const active = isActive(pathname, link.href, "exact" in link && link.exact);
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className="site-header__nav-link"
                data-active={active ? "true" : undefined}
                href={link.href}
                key={link.href}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="site-header__controls">
          <Link
            aria-label="搜索"
            className="site-icon-control"
            href="/search"
          >
            <Search aria-hidden="true" size={18} strokeWidth={1.7} />
          </Link>
          <ThemeToggle />
          <AtmosphereToggle />
          <button
            aria-controls="site-navigation-drawer"
            aria-expanded={open}
            aria-label={open ? "关闭导航" : "打开导航"}
            className="site-icon-control xl:hidden"
            onClick={() => setOpen((current) => !current)}
            ref={triggerRef}
            type="button"
          >
            <Menu aria-hidden="true" size={19} strokeWidth={1.7} />
          </button>
        </div>
      </div>

      {open ? (
        <div className="site-drawer" id="site-navigation-drawer">
          <button
            aria-label="关闭导航背景"
            className="site-drawer__backdrop"
            onClick={closeDrawer}
            type="button"
          />
          <div
            aria-label="完整导航"
            aria-modal="true"
            className="site-drawer__panel"
            ref={drawerRef}
            role="dialog"
          >
            <div className="site-drawer__top">
              <span className="font-semibold">{siteName}</span>
              <button
                aria-label="关闭抽屉导航"
                className="site-icon-control"
                onClick={closeDrawer}
                type="button"
              >
                <X aria-hidden="true" size={19} />
              </button>
            </div>
            <nav aria-label="移动端导航" className="site-drawer__nav">
              {links.map((link, index) => {
                const active = isActive(
                  pathname,
                  link.href,
                  "exact" in link && link.exact,
                );
                return (
                  <Link
                    aria-current={active ? "page" : undefined}
                    className="site-drawer__link"
                    data-active={active ? "true" : undefined}
                    href={link.href}
                    key={link.href}
                    onClick={closeDrawer}
                    ref={index === 0 ? firstLinkRef : undefined}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
            <Link
              className="site-drawer__search"
              href="/search"
              onClick={closeDrawer}
            >
              <Search aria-hidden="true" size={17} />
              搜索全部内容
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
