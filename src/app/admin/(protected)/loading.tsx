export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-label="正在加载后台数据">
      <div className="h-3 w-24 animate-pulse bg-[var(--line)]" />
      <div className="mt-5 h-10 w-[min(28rem,76vw)] animate-pulse bg-[var(--line)]" />
      <div className="mt-4 h-4 w-[min(40rem,86vw)] animate-pulse bg-[var(--line)]" />
      <div className="mt-10 grid border-y border-[var(--line)] sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            className="min-h-40 border-[var(--line)] p-5 sm:border-l"
            key={index}
          >
            <div className="h-3 w-16 animate-pulse bg-[var(--line)]" />
            <div className="mt-6 h-12 w-24 animate-pulse bg-[var(--line)]" />
          </div>
        ))}
      </div>
      <span className="sr-only">正在读取内容，请稍候。</span>
    </div>
  );
}
