import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { parseStringArray, type PublicProject } from "./content-types";
import { MediaFrame } from "./media-frame";

export function ProjectCard({
  project,
  ratio = "wide",
  priority = false,
}: {
  project: PublicProject;
  ratio?: "wide" | "landscape" | "square" | "portrait";
  priority?: boolean;
}) {
  const technologies = parseStringArray(project.technologyJson).slice(0, 4);
  return (
    <article className="group">
      <Link href={`/projects/${project.slug}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-4">
        <MediaFrame
          src={project.coverImage}
          alt={project.coverAlt}
          title={project.title}
          ratio={ratio}
          priority={priority}
        />
        <div className="mt-5 flex items-start justify-between gap-5">
          <div>
            <h2 className="text-2xl font-semibold tracking-[-.045em] group-hover:text-[var(--success)]">{project.title}</h2>
            <p className="mt-2 max-w-[60ch] text-sm leading-7 text-[var(--muted)]">{project.summary}</p>
            {technologies.length ? (
              <p className="mt-3 font-mono text-xs text-[var(--muted)]">{technologies.join(" / ")}</p>
            ) : null}
          </div>
          <ArrowUpRight className="mt-1 shrink-0" aria-hidden size={22} strokeWidth={1.7} />
        </div>
      </Link>
    </article>
  );
}

