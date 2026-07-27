"use client";

import { Send } from "lucide-react";
import { useState, type FormEvent } from "react";

type FormStatus = {
  kind: "idle" | "pending" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
};

const initialStatus: FormStatus = { kind: "idle", message: "" };

export function GuestbookForm() {
  const [status, setStatus] = useState<FormStatus>(initialStatus);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setStatus({ kind: "pending", message: "正在提交留言。" });

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
      setStatus({
        kind: "success",
        message: result.message || "留言已提交，审核通过后会显示。",
      });
    } catch {
      setStatus({
        kind: "error",
        message: "网络暂时不可用，请稍后重试。",
      });
    }
  };

  const fieldError = (name: string) => status.fieldErrors?.[name]?.[0];

  return (
    <form
      aria-label="提交留言"
      className="rounded-[var(--radius-panel,1.125rem)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow)] md:p-7"
      onSubmit={submit}
      noValidate
    >
      <h2 className="text-2xl font-semibold tracking-[-.04em]">写下一句话</h2>
      <p className="mt-2 leading-7 text-[var(--muted)]">
        留言会先进入审核队列。昵称和内容会公开，个人网站可选。
      </p>

      <div className="mt-7 space-y-5">
        <div>
          <label htmlFor="guestbook-nickname" className="mb-2 block font-semibold">
            昵称
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
            className="min-h-12 w-full rounded-[var(--radius-control,.625rem)] border border-[var(--line-strong)] bg-[var(--canvas)] px-4"
          />
          {fieldError("nickname") ? (
            <p id="guestbook-nickname-error" className="mt-2 text-sm text-[var(--danger)]">
              {fieldError("nickname")}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="guestbook-content" className="mb-2 block font-semibold">
            留言内容
          </label>
          <textarea
            id="guestbook-content"
            name="content"
            rows={6}
            required
            maxLength={3000}
            aria-invalid={Boolean(fieldError("content"))}
            aria-describedby={
              fieldError("content") ? "guestbook-content-error" : undefined
            }
            className="w-full resize-y rounded-[var(--radius-control,.625rem)] border border-[var(--line-strong)] bg-[var(--canvas)] px-4 py-3"
          />
          {fieldError("content") ? (
            <p id="guestbook-content-error" className="mt-2 text-sm text-[var(--danger)]">
              {fieldError("content")}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="guestbook-website" className="mb-2 block font-semibold">
            个人网站（可选）
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
            className="min-h-12 w-full rounded-[var(--radius-control,.625rem)] border border-[var(--line-strong)] bg-[var(--canvas)] px-4"
          />
          {fieldError("website") ? (
            <p id="guestbook-website-error" className="mt-2 text-sm text-[var(--danger)]">
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
        className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 font-semibold text-[var(--accent-ink)] transition-transform active:scale-[.985] disabled:cursor-wait disabled:opacity-65"
      >
        <Send aria-hidden size={18} strokeWidth={1.7} />
        {status.kind === "pending" ? "正在提交" : "提交留言"}
      </button>

      {status.message ? (
        <p
          aria-live="polite"
          className={`mt-4 text-sm ${
            status.kind === "error"
              ? "text-[var(--danger)]"
              : status.kind === "success"
                ? "text-[var(--success)]"
                : "text-[var(--muted)]"
          }`}
        >
          {status.message}
        </p>
      ) : null}
    </form>
  );
}
