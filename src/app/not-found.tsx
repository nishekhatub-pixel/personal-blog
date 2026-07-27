import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main-content" className="error-page">
      <p className="mono">404</p>
      <h1>这里还没有长出内容</h1>
      <p>链接可能已经移动，或者这篇记录尚未公开。</p>
      <div className="button-row">
        <Link className="button button--primary" href="/">
          返回首页
        </Link>
        <Link className="text-link" href="/search">
          搜索内容
        </Link>
      </div>
    </main>
  );
}
