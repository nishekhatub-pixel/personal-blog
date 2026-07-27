export default function BlogLoading() {
  return (
    <div
      role="status"
      className="mx-auto max-w-[1400px] animate-pulse px-[clamp(1rem,4vw,4rem)] py-20"
      aria-label="正在加载文章"
    >
      <div className="h-28 w-1/2 rounded-xl bg-[var(--surface-strong)]" />
      <div className="mt-16 aspect-[16/7] rounded-xl bg-[var(--surface-strong)]" />
      <div className="mt-10 space-y-5">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 rounded-xl bg-[var(--surface-strong)]" />
        ))}
      </div>
      <span className="sr-only">正在加载文章</span>
    </div>
  );
}
