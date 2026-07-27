"use client";

import { Check, Copy } from "lucide-react";
import { type ReactNode, useState } from "react";

export function CodeBlock({ code, language, children }: { code: string; language?: string; children?: ReactNode }) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="not-prose my-8 overflow-hidden rounded-xl border border-[var(--line)] bg-[#111714] text-[#e9f1ec]">
      <div className="flex min-h-11 items-center justify-between border-b border-white/10 px-4">
        <span className="font-mono text-xs text-white/60">{language || "text"}</span>
        <button
          type="button"
          onClick={copyCode}
          className="inline-flex min-h-9 items-center gap-2 rounded-full px-3 text-xs text-white/80 hover:bg-white/10"
          aria-live="polite"
        >
          {copied ? <Check aria-hidden size={15} /> : <Copy aria-hidden size={15} />}
          {copied ? "已复制" : "复制"}
        </button>
      </div>
      <pre className="max-w-full overflow-x-auto p-5 text-sm leading-7 [&_.hljs-attr]:text-[#8ee8c9] [&_.hljs-keyword]:text-[#8ee8c9] [&_.hljs-number]:text-[#ffce84] [&_.hljs-string]:text-[#d8e88e] [&_.hljs-title]:text-[#8bc5ff]">
        {children || <code className={language ? `language-${language}` : undefined}>{code}</code>}
      </pre>
    </div>
  );
}
