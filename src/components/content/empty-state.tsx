import { Sprout } from "lucide-react";
import Link from "next/link";

export function EmptyState({
  title,
  description,
  href,
  action,
}: {
  title: string;
  description: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="grid min-h-72 place-items-center rounded-xl border border-dashed border-[var(--line)] px-6 py-16 text-center">
      <div>
        <Sprout className="mx-auto text-[var(--success)]" aria-hidden size={34} strokeWidth={1.5} />
        <h2 className="mt-5 text-2xl font-semibold tracking-[-.04em]">{title}</h2>
        <p className="mx-auto mt-3 max-w-md text-[var(--muted)]">{description}</p>
        {href && action ? (
          <Link href={href} className="mt-6 inline-flex min-h-11 items-center rounded-full border border-[var(--line)] px-5 font-semibold">
            {action}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
