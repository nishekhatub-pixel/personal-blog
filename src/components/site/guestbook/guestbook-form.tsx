"use client";

import { Send, ShieldCheck, Sprout } from "lucide-react";
import { useState, type FormEvent } from "react";

type FormStatus = {
  kind: "idle" | "pending" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
};

const initialStatus: FormStatus = { kind: "idle", message: "" };
const contentLimit = 3000;

export function GuestbookForm() {
  const [status, setStatus] = useState<FormStatus>(initialStatus);
  const [contentLength, setContentLength] = useState(0);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status.kind === "pending") return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    setStatus({ kind: "pending", message: "正在把便签送进审核队列…" });

    try {
      const response = await fetch("/api/guestbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: formData.get("nickname"),
          content: formData.get("content"),
          website: formData.get("website"),
          company: formData.get("company"),
        }),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        message?: string;
        fieldErrors?: Record<string, string[]>;
      };
      if (!response.ok) {
        setStatus({
          kind: "error",
          message: result.message || "留言提交失败，请稍后重试。",
          fieldErrors: result.fieldErrors,
        });
        return;
      }

      form.reset();
      setContentLength(0);
      setStatus({
        kind: "success",
        message: result.message || "留言已提交，审核通过后会展示。",
      });
    } catch {
      setStatus({
        kind: "error",
        message: "网络暂时不可用，请稍后重试。",
      });
    }
  };

  const fieldError = (name: string) => status.fieldErrors?.[name]?.[0];
  const contentDescription = [
    fieldError("content") ? "guestbook-content-error" : "",
    "guestbook-content-count",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <form
      aria-label="提交留言"
      className="relative overflow-hidden rounded-[1.75rem] border border-white/65 bg-[color-mix(in_srgb,var(--surface)_91%,#f7d9d1_9%)] p-5 shadow-[0_24px_65px_color-mix(in_srgb,var(--ink)_11%,transparent)] sm:p-7"
      onSubmit={submit}
      noValidate
    >
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-2 bg-[color-mix(in_srgb,var(--accent)_64%,#efb7aa_36%)]"
      />
      <span
        aria-hidden
        className="absolute -right-8 -top-8 size-28 rounded-full bg-[color-mix(in_srgb,#c9deea_42%,transparent)]"
      />

      <div className="relative">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--accent)_13%,var(--surface))] text-[var(--accent)]">
          <Sprout aria-hidden size={21} strokeWidth={1.8} />
        </div>
        <h2 className="mt-5 text-[1.75rem] font-semibold tracking-[-.025em]">
          写一张便签
        </h2>
        <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
          昵称和内容会公开，个人网站可选。所有留言都会先进入审核队列。
        </p>
      </div>

      <div className="relative mt-7 space-y-5">
        <div>
          <label
            htmlFor="guestbook-nickname"
            className="mb-2 block text-sm font-semibold text-[var(--ink)]"
          >
            昵称 <span aria-hidden className="text-[var(--accent)]">*</span>
          </label>
          <input
            id="guestbook-nickname"
            name="nickname"
            autoComplete="nickname"
            required
            maxLength={80}
            aria-invalid={Boolean(fieldError("nickname"))}
            aria-describedby={
              fieldError("nickname") ? "guestbook-nickname-error" : undefined
            }
            placeholder="怎么称呼你？"
            className="min-h-12 w-full rounded-2xl border border-[color-mix(in_srgb,var(--line)_88%,transparent)] bg-[color-mix(in_srgb,var(--canvas)_76%,transparent)] px-4 text-base text-[var(--ink)] outline-none transition placeholder:text-[color-mix(in_srgb,var(--muted)_68%,transparent)] focus:border-[var(--accent)] focus:bg-[var(--surface)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--accent)_12%,transparent)]"
          />
          {fieldError("nickname") ? (
            <p
              id="guestbook-nickname-error"
              className="mt-2 text-sm text-[var(--danger)]"
            >
              {fieldError("nickname")}
            </p>
          ) : null}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label
              htmlFor="guestbook-content"
              className="text-sm font-semibold text-[var(--ink)]"
            >
              留言内容 <span aria-hidden className="text-[var(--accent)]">*</span>
            </label>
            <span
              id="guestbook-content-count"
              aria-live="polite"
              className="text-xs tabular-nums text-[var(--muted)]"
            >
              {contentLength} / {contentLimit}
            </span>
          </div>
          <textarea
            id="guestbook-content"
            name="content"
            rows={7}
            required
            maxLength={contentLimit}
            onChange={(event) => setContentLength(event.currentTarget.value.length)}
            aria-invalid={Boolean(fieldError("content"))}
            aria-describedby={contentDescription}
            placeholder="写下一句问候、一个想法，或此刻的心情…"
            className="min-h-40 w-full resize-y rounded-2xl border border-[color-mix(in_srgb,var(--line)_88%,transparent)] bg-[color-mix(in_srgb,var(--canvas)_76%,transparent)] px-4 py-3 text-base leading-7 text-[var(--ink)] outline-none transition placeholder:text-[color-mix(in_srgb,var(--muted)_68%,transparent)] focus:border-[var(--accent)] focus:bg-[var(--surface)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--accent)_12%,transparent)]"
          />
          {fieldError("content") ? (
            <p
              id="guestbook-content-error"
              className="mt-2 text-sm text-[var(--danger)]"
            >
              {fieldError("content")}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="guestbook-website"
            className="mb-2 block text-sm font-semibold text-[var(--ink)]"
          >
            个人网站
            <span className="ml-2 font-normal text-[var(--muted)]">可选</span>
          </label>
          <input
            id="guestbook-website"
            name="website"
            type="url"
            inputMode="url"
            autoComplete="url"
            maxLength={500}
            placeholder="https://example.com"
            aria-invalid={Boolean(fieldError("website"))}
            aria-describedby={
              fieldError("website") ? "guestbook-website-error" : undefined
            }
            className="min-h-12 w-full rounded-2xl border border-[color-mix(in_srgb,var(--line)_88%,transparent)] bg-[color-mix(in_srgb,var(--canvas)_76%,transparent)] px-4 text-base text-[var(--ink)] outline-none transition placeholder:text-[color-mix(in_srgb,var(--muted)_68%,transparent)] focus:border-[var(--accent)] focus:bg-[var(--surface)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--accent)_12%,transparent)]"
          />
          {fieldError("website") ? (
            <p
              id="guestbook-website-error"
              className="mt-2 text-sm text-[var(--danger)]"
            >
              {fieldError("website")}
            </p>
          ) : null}
        </div>

        <div className="sr-only" aria-hidden>
          <label htmlFor="guestbook-company">公司</label>
          <input
            id="guestbook-company"
            name="company"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={status.kind === "pending"}
        className="relative mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 font-semibold text-[var(--accent-ink)] shadow-[0_10px_24px_color-mix(in_srgb,var(--accent)_25%,transparent)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_color-mix(in_srgb,var(--accent)_30%,transparent)] active:translate-y-0 active:scale-[.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] disabled:cursor-wait disabled:opacity-65 motion-reduce:transform-none motion-reduce:transition-none"
      >
        <Send aria-hidden size={18} strokeWidth={1.8} />
        {status.kind === "pending" ? "正在提交…" : "把便签留在这里"}
      </button>

      <div className="mt-4 flex items-start gap-2 text-xs leading-5 text-[var(--muted)]">
        <ShieldCheck
          aria-hidden
          className="mt-0.5 shrink-0 text-[var(--success)]"
          size={15}
        />
        不公开邮箱或 IP；请勿填写敏感个人信息。
      </div>

      {status.message ? (
        <p
          aria-live="polite"
          role={status.kind === "error" ? "alert" : "status"}
          className={`mt-4 rounded-2xl border px-4 py-3 text-sm leading-6 ${
            status.kind === "error"
              ? "border-[color-mix(in_srgb,var(--danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--danger)_8%,transparent)] text-[var(--danger)]"
              : status.kind === "success"
                ? "border-[color-mix(in_srgb,var(--success)_30%,transparent)] bg-[color-mix(in_srgb,var(--success)_8%,transparent)] text-[var(--success)]"
                : "border-[var(--line)] bg-[var(--canvas)] text-[var(--muted)]"
          }`}
        >
          {status.message}
        </p>
      ) : null}
    </form>
  );
}
