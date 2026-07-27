"use client";

import { RotateCcw } from "lucide-react";
import { useEffect } from "react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="main-content" className="error-page">
      <p className="mono">R7 / ERROR</p>
      <h1>内容暂时没有加载出来</h1>
      <p>错误已经记录。你可以重新尝试，或稍后再回来。</p>
      <button className="button button--primary" type="button" onClick={reset}>
        <RotateCcw aria-hidden="true" size={18} />
        重新加载
      </button>
    </main>
  );
}
