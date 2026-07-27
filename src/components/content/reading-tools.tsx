"use client";

import { List } from "lucide-react";
import { motion, useScroll } from "motion/react";
import { useEffect, useState } from "react";

export type TocHeading = { id: string; text: string; level: 2 | 3 };

export function ReadingProgress() {
  const { scrollYProgress } = useScroll();
  return (
    <motion.div
      aria-hidden
      className="fixed inset-x-0 top-0 z-[70] h-0.5 origin-left bg-[var(--accent)]"
      style={{ scaleX: scrollYProgress }}
    />
  );
}

export function TableOfContents({ headings }: { headings: TocHeading[] }) {
  const [active, setActive] = useState(headings[0]?.id ?? "");

  useEffect(() => {
    const elements = headings.map((heading) => document.getElementById(heading.id)).filter(Boolean) as HTMLElement[];
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible?.target.id) setActive(visible.target.id);
      },
      { rootMargin: "-15% 0px -70% 0px" },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [headings]);

  if (!headings.length) return null;

  const links = (
    <ol className="space-y-2.5">
      {headings.map((heading) => (
        <li key={heading.id} className={heading.level === 3 ? "pl-3" : ""}>
          <a
            href={`#${heading.id}`}
            aria-current={active === heading.id ? "location" : undefined}
            className={`block border-l-2 py-1 pl-3 text-sm leading-5 transition-colors ${
              active === heading.id
                ? "border-[var(--accent)] font-semibold text-[var(--ink)]"
                : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
            }`}
          >
            {heading.text}
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <>
      <aside className="sticky top-24 hidden self-start xl:block" aria-label="文章目录">
        <p className="mb-4 flex items-center gap-2 text-xs font-semibold text-[var(--muted)]">
          <List aria-hidden size={15} /> 本文目录
        </p>
        {links}
      </aside>
      <details className="mb-8 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 xl:hidden">
        <summary className="cursor-pointer font-semibold">展开文章目录</summary>
        <div className="mt-4">{links}</div>
      </details>
    </>
  );
}

