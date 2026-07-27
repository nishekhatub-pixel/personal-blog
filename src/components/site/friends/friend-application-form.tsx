"use client";

import { Send } from "lucide-react";
import { useState, type FormEvent } from "react";

type FormStatus = {
  kind: "idle" | "pending" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
};

const initialStatus: FormStatus = { kind: "idle", message: "" };

export function FriendApplicationForm() {
  const [status, setStatus] = useState<FormStatus>(initialStatus);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setStatus({ kind: "pending", message: "正在提交申请。" });

    try {
      const response = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          url: formData.get("url"),
          description: formData.get("description"),
          avatarUrl: formData.get("avatarUrl"),
          contact: formData.get("contact"),
          tags: formData.get("tags"),
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
          message: result.message || "友链申请提交失败，请稍后重试。",
          fieldErrors: result.fieldErrors,
        });
        return;
      }

      form.reset();
      setStatus({
        kind: "success",
        message: result.message || "申请已提交，审核后会出现在友链页。",
      });
    } catch {
      setStatus({
        kind: "error",
        message: "网络暂时不可用，请稍后重试。",
      });
    }
  };

  const fieldError = (name: string) => status.fieldErrors?.[name]?.[0];
  const fields = [
    {
      name: "name",
      label: "站点名称",
      type: "text",
      autoComplete: "organization",
      placeholder: "",
      required: true,
    },
    {
      name: "url",
      label: "站点地址",
      type: "url",
      autoComplete: "url",
      placeholder: "https://example.com",
      required: true,
    },
    {
      name: "avatarUrl",
      label: "头像地址（可选）",
      type: "url",
      autoComplete: "url",
      placeholder: "https://example.com/avatar.png",
      required: false,
    },
    {
      name: "contact",
      label: "联系方式（只用于审核）",
      type: "text",
      autoComplete: "email",
      placeholder: "",
      required: false,
    },
  ] as const;

  return (
    <form
      aria-label="申请友链"
      className="rounded-[var(--radius-panel,1.125rem)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow)] md:p-7"
      onSubmit={submit}
      noValidate
    >
      <h2 className="text-2xl font-semibold tracking-[-.04em]">申请加入友链</h2>
      <p className="mt-2 leading-7 text-[var(--muted)]">
        请提交真实、可访问的个人站点。申请会先进入后台审核。
      </p>

      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.name}>
            <label
              htmlFor={`friend-${field.name}`}
              className="mb-2 block font-semibold"
            >
              {field.label}
            </label>
            <input
              id={`friend-${field.name}`}
              name={field.name}
              type={field.type}
              autoComplete={field.autoComplete}
              required={field.required}
              maxLength={field.name === "name" ? 120 : 500}
              placeholder={field.placeholder}
              aria-invalid={Boolean(fieldError(field.name))}
              aria-describedby={
                fieldError(field.name) ? `friend-${field.name}-error` : undefined
              }
              className="min-h-12 w-full rounded-[var(--radius-control,.625rem)] border border-[var(--line-strong)] bg-[var(--canvas)] px-4"
            />
            {fieldError(field.name) ? (
              <p
                id={`friend-${field.name}-error`}
                className="mt-2 text-sm text-[var(--danger)]"
              >
                {fieldError(field.name)}
              </p>
            ) : null}
          </div>
        ))}

        <div className="sm:col-span-2">
          <label htmlFor="friend-description" className="mb-2 block font-semibold">
            简介
          </label>
          <textarea
            id="friend-description"
            name="description"
            rows={4}
            required
            maxLength={500}
            aria-invalid={Boolean(fieldError("description"))}
            aria-describedby={
              fieldError("description") ? "friend-description-error" : undefined
            }
            className="w-full resize-y rounded-[var(--radius-control,.625rem)] border border-[var(--line-strong)] bg-[var(--canvas)] px-4 py-3"
          />
          {fieldError("description") ? (
            <p id="friend-description-error" className="mt-2 text-sm text-[var(--danger)]">
              {fieldError("description")}
            </p>
          ) : null}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="friend-tags" className="mb-2 block font-semibold">
            标签（可选）
          </label>
          <input
            id="friend-tags"
            name="tags"
            maxLength={400}
            placeholder="技术, 写作, 生活"
            aria-invalid={Boolean(fieldError("tags"))}
            aria-describedby="friend-tags-help"
            className="min-h-12 w-full rounded-[var(--radius-control,.625rem)] border border-[var(--line-strong)] bg-[var(--canvas)] px-4"
          />
          <p id="friend-tags-help" className="mt-2 text-sm text-[var(--muted)]">
            使用逗号或换行分隔，最多 20 个。
          </p>
          {fieldError("tags") ? (
            <p className="mt-2 text-sm text-[var(--danger)]">{fieldError("tags")}</p>
          ) : null}
        </div>

        <div className="sr-only" aria-hidden>
          <label htmlFor="friend-company">公司</label>
          <input
            id="friend-company"
            name="company"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={status.kind === "pending"}
        className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-7 font-semibold text-[var(--accent-ink)] transition-transform active:scale-[.985] disabled:cursor-wait disabled:opacity-65"
      >
        <Send aria-hidden size={18} strokeWidth={1.7} />
        {status.kind === "pending" ? "正在提交" : "提交申请"}
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
