import { SearchX } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <section className="empty-state" aria-live="polite">
      <SearchX aria-hidden="true" size={34} strokeWidth={1.4} />
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </section>
  );
}
