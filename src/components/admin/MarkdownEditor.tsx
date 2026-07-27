"use client";

import { Eye, ImageIcon, PenLine } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

type MarkdownEditorProps = {
  defaultValue?: string;
  label?: string;
  name?: string;
  required?: boolean;
};

export function MarkdownEditor({
  defaultValue = "",
  label = "正文",
  name = "content",
  required = true,
}: MarkdownEditorProps) {
  const [value, setValue] = useState(defaultValue);
  const [mode, setMode] = useState<"write" | "preview">("write");
  const dirty = useMemo(() => value !== defaultValue, [defaultValue, value]);

  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [dirty]);

  return (
    <section className="border-t border-[var(--line)] pt-7">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium" htmlFor={`editor-${name}`}>
            {label}
          </label>
          {dirty ? (
            <span className="font-mono text-[11px] text-[var(--accent)]">
              尚未保存
            </span>
          ) : null}
        </div>
        <div
          aria-label="编辑器模式"
          className="flex border border-[var(--line)]"
          role="group"
        >
          <button
            aria-pressed={mode === "write"}
            className={[
              "inline-flex min-h-10 items-center gap-2 px-3 text-xs",
              mode === "write"
                ? "bg-[var(--ink)] text-[var(--canvas)]"
                : "text-[var(--muted)]",
            ].join(" ")}
            onClick={() => setMode("write")}
            type="button"
          >
            <PenLine aria-hidden="true" size={14} />
            编写
          </button>
          <button
            aria-pressed={mode === "preview"}
            className={[
              "inline-flex min-h-10 items-center gap-2 px-3 text-xs",
              mode === "preview"
                ? "bg-[var(--ink)] text-[var(--canvas)]"
                : "text-[var(--muted)]",
            ].join(" ")}
            onClick={() => setMode("preview")}
            type="button"
          >
            <Eye aria-hidden="true" size={14} />
            预览
          </button>
        </div>
      </div>

      <p className="mb-3 flex items-center gap-2 text-xs leading-5 text-[var(--muted)]">
        <ImageIcon aria-hidden="true" size={14} />
        支持 Markdown 与 GFM。可从媒体库复制图片地址后插入。
      </p>

      <div className="grid min-h-[32rem] border border-[var(--line)] xl:grid-cols-2">
        <div
          className={[
            "min-h-[32rem] xl:block",
            mode === "preview" ? "hidden xl:block" : "block",
          ].join(" ")}
        >
          <textarea
            className="h-full min-h-[32rem] w-full resize-y bg-transparent p-5 font-mono text-sm leading-7 outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--accent)]"
            id={`editor-${name}`}
            name={name}
            onChange={(event) => setValue(event.target.value)}
            required={required}
            spellCheck
            value={value}
          />
        </div>
        <div
          aria-label="Markdown 实时预览"
          className={[
            "min-h-[32rem] border-[var(--line)] p-5 xl:block xl:border-l",
            mode === "write" ? "hidden xl:block" : "block",
          ].join(" ")}
        >
          {value.trim() ? (
            <article className="max-w-none text-sm leading-7 text-[var(--ink)] [&_a]:text-[var(--accent)] [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-[var(--accent)] [&_blockquote]:pl-4 [&_code]:font-mono [&_code]:text-[var(--accent)] [&_h1]:mb-5 [&_h1]:mt-8 [&_h1]:text-3xl [&_h2]:mb-4 [&_h2]:mt-8 [&_h2]:text-2xl [&_h3]:mb-3 [&_h3]:mt-6 [&_h3]:text-xl [&_li]:my-1 [&_ol]:my-5 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-4 [&_pre]:my-5 [&_pre]:overflow-x-auto [&_pre]:bg-[var(--ink)] [&_pre]:p-4 [&_pre]:text-[var(--canvas)] [&_ul]:my-5 [&_ul]:list-disc [&_ul]:pl-6">
              <ReactMarkdown
                rehypePlugins={[rehypeSanitize]}
                remarkPlugins={[remarkGfm]}
              >
                {value}
              </ReactMarkdown>
            </article>
          ) : (
            <p className="text-sm text-[var(--muted)]">
              预览会在这里出现。先写下一段值得保留的内容。
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
