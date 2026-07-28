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
import { useEffect, useState } from "react";

const links = [
  { href: "/", icon: Home, label: "首页", exact: true },
  { href: "/blog", icon: BookOpenText, label: "文章", exact: false },
  { href: "/photos", icon: Images, label: "照片", exact: false },
  { href: "/moments", icon: MessageCircle, label: "说说", exact: false },
  { href: "/music", icon: Disc3, label: "音乐", exact: false },
] as const;

export function MobileDock() {
  const pathname = usePathname();
  const [formFocused, setFormFocused] = useState(false);

  useEffect(() => {
    const isFormControl = (target: EventTarget | null) =>
      target instanceof HTMLElement &&
      Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
    const onFocusIn = (event: FocusEvent) => {
      if (isFormControl(event.target)) setFormFocused(true);
    };
    const onFocusOut = () => {
      window.requestAnimationFrame(() => {
        setFormFocused(isFormControl(document.activeElement));
      });
    };
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  return (
    <nav
      aria-label="移动端快捷导航"
      className="mobile-dock"
      data-form-focused={formFocused ? "true" : undefined}
    >
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
