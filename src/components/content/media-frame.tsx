import Image from "next/image";

type MediaFrameProps = {
  src?: string | null;
  alt?: string | null;
  title: string;
  priority?: boolean;
  ratio?: "wide" | "landscape" | "square" | "portrait";
  className?: string;
};

const ratios = {
  wide: "aspect-[16/10]",
  landscape: "aspect-[4/3]",
  square: "aspect-square",
  portrait: "aspect-[4/5]",
};

export function MediaFrame({ src, alt, title, priority, ratio = "wide", className = "" }: MediaFrameProps) {
  return (
    <div className={`relative isolate overflow-hidden rounded-[var(--radius-media)] bg-[var(--surface-strong)] ${ratios[ratio]} ${className}`}>
      {src ? (
        <Image
          src={src}
          alt={alt || `${title} 封面`}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, 60vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]"
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center overflow-hidden bg-[linear-gradient(135deg,var(--surface-strong),var(--canvas))]">
          <span className="select-none text-[clamp(4rem,15vw,11rem)] font-black tracking-[-.12em] text-[color:var(--ink)/.08]">R7</span>
          <span className="absolute bottom-5 left-5 max-w-[70%] font-mono text-xs text-[var(--muted)]">{title}</span>
        </div>
      )}
    </div>
  );
}
