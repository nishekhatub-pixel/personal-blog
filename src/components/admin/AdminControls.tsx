"use client";

import { Search } from "lucide-react";
import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  pendingLabel = "正在保存…",
  className = "",
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      className={[
        "inline-flex min-h-11 items-center justify-center bg-[var(--accent)] px-5 text-sm font-semibold text-[var(--accent-ink)]",
        "transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60",
        className,
      ].join(" ")}
      disabled={pending}
      type="submit"
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

export function ConfirmButton({
  children,
  message,
  name,
  value,
}: {
  children: React.ReactNode;
  message: string;
  name?: string;
  value?: string;
}) {
  return (
    <button
      className="min-h-10 px-3 text-sm text-[var(--danger)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--danger)]"
      name={name}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
      type="submit"
      value={value}
    >
      {children}
    </button>
  );
}

export function SearchField({
  defaultValue,
  placeholder = "搜索…",
}: {
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <label className="relative block min-w-0 flex-1">
      <span className="sr-only">搜索</span>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
        size={17}
      />
      <input
        className="min-h-11 w-full border border-[var(--line)] bg-transparent py-2 pl-10 pr-3 text-sm outline-none transition-colors placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--accent)_25%,transparent)]"
        defaultValue={defaultValue}
        name="q"
        placeholder={placeholder}
        type="search"
      />
    </label>
  );
}
