"use client";

import {
  BookOpenText,
  Disc3,
  Home,
  Images,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", icon: Home, label: "首页", exact: true },
  { href: "/blog", icon: BookOpenText, label: "文章", exact: false },
  { href: "/photos", icon: Images, label: "照片", exact: false },
  { href: "/moments", icon: MessageCircle, label: "说说", exact: false },
  { href: "/music", icon: Disc3, label: "音乐", exact: false },
] as const;

export function MobileDock() {
  const pathname = usePathname();

  return (
    <nav aria-label="移动端快捷导航" className="mobile-dock">
      <div className="mobile-dock__inner">
        {links.map(({ exact, href, icon: Icon, label }) => {
          const active = exact
            ? pathname === href
            : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className="mobile-dock__link"
              data-active={active ? "true" : undefined}
              href={href}
              key={href}
            >
              <Icon aria-hidden="true" size={18} strokeWidth={1.7} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
