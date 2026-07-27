import { Boxes, Database, Server } from "lucide-react";

const icons = [Boxes, Server, Database] as const;

export function ArchitectureBeam({ steps }: { steps: string[] }) {
  if (steps.length < 3) return null;

  return (
    <section
      aria-labelledby="project-architecture-heading"
      className="rounded-[1.125rem] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow)] md:p-7"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--accent)]">
        Architecture
      </p>
      <h2 className="mt-2 text-2xl font-semibold" id="project-architecture-heading">
        真实技术路径
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
        只根据这个项目已记录的技术栈展示，不为简单项目制造额外层级。
      </p>

      <div className="architecture-beam relative mt-7">
        <div
          aria-hidden="true"
          className="architecture-beam__line absolute bg-[var(--line)]"
        >
          <span className="architecture-beam__pulse absolute rounded-full bg-[var(--accent)] shadow-[0_0_0.8rem_var(--accent-soft)]" />
        </div>
        <ol className="relative grid gap-3 sm:grid-flow-col sm:auto-cols-fr sm:gap-5">
          {steps.map((step, index) => {
            const Icon = icons[Math.min(index, icons.length - 1)];
            return (
              <li
                className="relative z-10 flex min-h-20 items-center gap-3 rounded-[var(--radius-control,0.625rem)] border border-[var(--line)] bg-[var(--surface-strong)] p-4 sm:flex-col sm:justify-center sm:text-center"
                key={step}
              >
                <Icon aria-hidden="true" className="text-[var(--accent)]" size={19} />
                <span className="text-sm font-semibold">{step}</span>
              </li>
            );
          })}
        </ol>
      </div>

      <style>{`
        .architecture-beam__line {
          bottom: 2.5rem;
          left: 1.25rem;
          top: 2.5rem;
          width: 1px;
        }
        .architecture-beam__pulse {
          height: 30%;
          left: -1px;
          top: 0;
          width: 3px;
          animation: r7-beam-y 4.8s ease-in-out infinite;
        }
        @keyframes r7-beam-y {
          0%, 100% { transform: translateY(0); opacity: 0; }
          12%, 88% { opacity: 1; }
          88% { transform: translateY(233%); opacity: 1; }
        }
        @media (min-width: 640px) {
          .architecture-beam__line {
            bottom: auto;
            height: 1px;
            left: 2rem;
            right: 2rem;
            top: 50%;
            width: auto;
          }
          .architecture-beam__pulse {
            height: 3px;
            left: 0;
            top: -1px;
            width: 30%;
            animation-name: r7-beam-x;
          }
          @keyframes r7-beam-x {
            0%, 100% { transform: translateX(0); opacity: 0; }
            12%, 88% { opacity: 1; }
            88% { transform: translateX(233%); opacity: 1; }
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .architecture-beam__pulse { display: none; }
        }
      `}</style>
    </section>
  );
}
