"use client";

import { ArrowRight, LoaderCircle, LockKeyhole } from "lucide-react";
import { FormEvent, useState, useTransition } from "react";

export function LoginForm() {
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const data = new FormData(event.currentTarget);

    startTransition(async () => {
      try {
        const response = await fetch("/api/auth/login", {
          body: JSON.stringify({
            email: data.get("email"),
            password: data.get("password"),
            website: data.get("website"),
          }),
          headers: { "content-type": "application/json" },
          method: "POST",
        });
        if (!response.ok) {
          const payload = (await response.json()) as { error?: string };
          throw new Error(payload.error ?? "登录失败，请检查邮箱与密码。");
        }
        window.location.assign("/admin");
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "登录失败，请稍后再试。",
        );
      }
    });
  };

  return (
    <form className="mt-10 grid gap-5" onSubmit={submit}>
      <label className="grid gap-2 text-sm">
        <span>邮箱</span>
        <input
          autoComplete="email"
          autoFocus
          className="min-h-12 border border-[var(--line)] bg-transparent px-4 outline-none transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--accent)_25%,transparent)]"
          inputMode="email"
          name="email"
          placeholder="admin@example.com"
          required
          type="email"
        />
      </label>
      <label className="grid gap-2 text-sm">
        <span>密码</span>
        <input
          autoComplete="current-password"
          className="min-h-12 border border-[var(--line)] bg-transparent px-4 outline-none transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--accent)_25%,transparent)]"
          minLength={8}
          name="password"
          required
          type="password"
        />
      </label>
      <label className="sr-only" aria-hidden="true">
        请勿填写
        <input autoComplete="off" name="website" tabIndex={-1} />
      </label>
      <div aria-live="polite" className="min-h-6 text-sm">
        {error ? (
          <p className="flex items-start gap-2 text-[var(--danger)]">
            <LockKeyhole aria-hidden="true" className="mt-0.5" size={15} />
            {error}
          </p>
        ) : null}
      </div>
      <button
        className="inline-flex min-h-12 items-center justify-between bg-[var(--accent)] px-5 text-sm font-semibold text-[var(--accent-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        <span>{pending ? "正在验证…" : "进入编辑室"}</span>
        {pending ? (
          <LoaderCircle aria-hidden="true" className="animate-spin" size={17} />
        ) : (
          <ArrowRight aria-hidden="true" size={17} />
        )}
      </button>
    </form>
  );
}
