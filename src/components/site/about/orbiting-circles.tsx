import type { CSSProperties } from "react";

const technologies = [
  { label: "Java", short: "JV", angle: 0, ring: "outer" },
  { label: "JavaScript", short: "JS", angle: 120, ring: "outer" },
  { label: "MySQL", short: "DB", angle: 240, ring: "outer" },
  { label: "Next.js", short: "NX", angle: 45, ring: "inner" },
  { label: "Git", short: "GT", angle: 165, ring: "inner" },
  { label: "AI Tools", short: "AI", angle: 285, ring: "inner" },
] as const;

type OrbitStyle = CSSProperties & {
  "--orbit-angle": string;
  "--orbit-counter-angle": string;
  "--orbit-delay": string;
  "--orbit-radius": string;
  "--orbit-speed": string;
};

export function OrbitingCircles({ className = "" }: { className?: string }) {
  return (
    <figure
      aria-labelledby="technology-orbit-caption"
      className={`technology-orbit relative mx-auto grid aspect-square w-full max-w-[23rem] place-items-center ${className}`}
    >
      <div
        aria-hidden="true"
        className="absolute size-[56%] rounded-full border border-dashed border-[var(--line)]"
      />
      <div
        aria-hidden="true"
        className="absolute size-[82%] rounded-full border border-[var(--line)]"
      />
      <div className="relative z-10 grid size-24 place-items-center rounded-full border border-[var(--accent)] bg-[var(--surface)] shadow-[var(--shadow-raised)]">
        <span className="text-3xl font-black tracking-[-0.08em]">R7</span>
      </div>

      {technologies.map((technology, index) => (
        <span
          aria-hidden="true"
          className="technology-orbit__node absolute grid size-12 place-items-center rounded-full border border-[var(--line)] bg-[var(--surface)] font-mono text-[11px] font-semibold text-[var(--ink)] shadow-[var(--shadow)]"
          key={technology.label}
          style={
            {
              "--orbit-angle": `${technology.angle}deg`,
              "--orbit-counter-angle": `${-technology.angle}deg`,
              "--orbit-delay": `${-index * 1.8}s`,
              "--orbit-radius":
                technology.ring === "outer"
                  ? "clamp(7.2rem, 17vw, 9.1rem)"
                  : "clamp(4.8rem, 12vw, 6.2rem)",
              "--orbit-speed": technology.ring === "outer" ? "30s" : "24s",
            } as OrbitStyle
          }
          title={technology.label}
        >
          {technology.short}
        </span>
      ))}

      <figcaption className="sr-only" id="technology-orbit-caption">
        R7 当前学习和使用的技术生态
      </figcaption>
      <ul className="sr-only">
        {technologies.map((technology) => (
          <li key={technology.label}>{technology.label}</li>
        ))}
      </ul>

      <style>{`
        .technology-orbit__node {
          animation: r7-orbit var(--orbit-speed) linear var(--orbit-delay) infinite;
          transform:
            rotate(var(--orbit-angle))
            translateX(var(--orbit-radius))
            rotate(var(--orbit-counter-angle));
        }
        @keyframes r7-orbit {
          from {
            transform:
              rotate(var(--orbit-angle))
              translateX(var(--orbit-radius))
              rotate(var(--orbit-counter-angle));
          }
          to {
            transform:
              rotate(calc(var(--orbit-angle) + 360deg))
              translateX(var(--orbit-radius))
              rotate(calc(var(--orbit-counter-angle) - 360deg));
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .technology-orbit__node {
            animation: none;
          }
        }
      `}</style>
    </figure>
  );
}
