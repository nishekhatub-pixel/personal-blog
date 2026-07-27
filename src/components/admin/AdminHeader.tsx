import Link from "next/link";
import { Plus } from "lucide-react";

type AdminHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
  action?: {
    href: string;
    label: string;
  };
};

export function AdminHeader({
  eyebrow = "ADMIN",
  title,
  description,
  action,
}: AdminHeaderProps) {
  return (
    <header className="mb-9 flex flex-col gap-6 border-b border-[var(--line)] pb-8 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.18em] text-[var(--success)]">
          {eyebrow}
        </p>
        <h1 className="text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)] sm:text-base">
          {description}
        </p>
      </div>
      {action ? (
        <Link
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 bg-[var(--accent)] px-5 text-sm font-semibold text-[var(--accent-ink)] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
          href={action.href}
        >
          <Plus aria-hidden="true" size={17} />
          {action.label}
        </Link>
      ) : null}
    </header>
  );
}
