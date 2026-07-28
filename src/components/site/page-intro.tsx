import type { ReactNode } from "react";

type PageIntroProps = {
  actions?: ReactNode;
  className?: string;
  description?: ReactNode;
  eyebrow?: ReactNode;
  title: ReactNode;
};

export function PageIntro({
  actions,
  className,
  description,
  eyebrow,
  title,
}: PageIntroProps) {
  return (
    <header className={["page-intro", className].filter(Boolean).join(" ")}>
      <div className="page-intro__inner">
        {eyebrow ? (
          <p className="page-intro__eyebrow inline-flex items-center gap-2">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="page-intro__title">{title}</h1>
        {description ? (
          <p className="page-intro__description">{description}</p>
        ) : null}
        {actions ? <div className="page-intro__actions">{actions}</div> : null}
      </div>
    </header>
  );
}
