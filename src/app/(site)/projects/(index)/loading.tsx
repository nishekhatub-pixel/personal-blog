export default function ProjectsLoading() {
  return (
    <div
      role="status"
      className="mx-auto max-w-[1400px] animate-pulse px-[clamp(1rem,4vw,4rem)] py-20"
      aria-label="正在加载项目"
    >
      <div className="h-40 w-3/4 rounded-xl bg-[var(--surface-strong)]" />
      <div className="mt-20 grid gap-8 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => <div key={index} className="aspect-[4/3] rounded-xl bg-[var(--surface-strong)]" />)}
      </div>
      <span className="sr-only">正在加载项目</span>
    </div>
  );
}
