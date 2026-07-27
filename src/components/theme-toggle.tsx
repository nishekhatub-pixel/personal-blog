"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const modes = ["light", "dark", "system"] as const;
const subscribeToHydration = () => () => undefined;

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );

  const current = mounted && modes.includes(theme as (typeof modes)[number])
    ? (theme as (typeof modes)[number])
    : "system";
  const next = modes[(modes.indexOf(current) + 1) % modes.length];
  const label =
    current === "light" ? "亮色主题" : current === "dark" ? "暗色主题" : "跟随系统";
  const Icon = current === "light" ? Sun : current === "dark" ? Moon : Monitor;

  return (
    <button
      type="button"
      className="icon-button"
      aria-label={`${label}，点击切换`}
      title={`${label}，下一个：${next === "light" ? "亮色" : next === "dark" ? "暗色" : "跟随系统"}`}
      onClick={() => setTheme(next)}
    >
      <Icon aria-hidden="true" size={18} strokeWidth={1.8} />
      {!compact && <span>{label}</span>}
    </button>
  );
}
