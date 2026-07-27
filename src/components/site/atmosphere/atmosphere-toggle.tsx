"use client";

import { Flower2 } from "lucide-react";
import { useAtmosphere } from "@/components/site/atmosphere/atmosphere-provider";

export function AtmosphereToggle() {
  const { allowed, enabled, ready, toggle } = useAtmosphere();
  const label = !allowed
    ? "花瓣效果已由站点设置关闭"
    : enabled
      ? "关闭花瓣效果"
      : "开启花瓣效果";

  return (
    <button
      aria-label={label}
      aria-pressed={allowed ? enabled : undefined}
      className="site-icon-control"
      disabled={!ready || !allowed}
      onClick={toggle}
      title={label}
      type="button"
    >
      <Flower2
        aria-hidden="true"
        className={enabled ? "text-[var(--accent)]" : undefined}
        size={18}
        strokeWidth={1.7}
      />
    </button>
  );
}
