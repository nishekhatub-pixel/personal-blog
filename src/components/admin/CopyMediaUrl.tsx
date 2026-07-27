"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyMediaUrl({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      className="inline-flex min-h-10 items-center gap-2 px-3 text-xs text-[var(--muted)] hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1800);
        } catch {
          setCopied(false);
        }
      }}
      type="button"
    >
      {copied ? (
        <Check aria-hidden="true" size={14} />
      ) : (
        <Copy aria-hidden="true" size={14} />
      )}
      {copied ? "已复制" : "复制地址"}
    </button>
  );
}
