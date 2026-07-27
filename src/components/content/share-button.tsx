"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";

export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    if (navigator.share) {
      await navigator.share({ title, url: window.location.href });
      return;
    }
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-5 text-sm font-semibold active:scale-[.98]"
      aria-live="polite"
    >
      {copied ? <Check aria-hidden size={17} /> : <Share2 aria-hidden size={17} />}
      {copied ? "链接已复制" : "分享文章"}
    </button>
  );
}

