"use client";

import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Droplets,
  MapPin,
  Sun,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { WeatherResponse } from "@/lib/weather";

function WeatherIcon({
  code,
  size = 28,
}: {
  code: number;
  size?: number;
}) {
  let Icon: LucideIcon = Cloud;
  if (code === 0) Icon = Sun;
  else if ([1, 2].includes(code)) Icon = CloudSun;
  else if ([45, 48].includes(code)) Icon = CloudFog;
  else if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    Icon = CloudRain;
  } else if ([71, 73, 75, 77, 85, 86].includes(code)) Icon = CloudSnow;
  else if ([95, 96, 99].includes(code)) Icon = CloudLightning;
  return <Icon aria-hidden="true" size={size} strokeWidth={1.6} />;
}

export function WeatherCard({ className = "" }: { className?: string }) {
  const [weather, setWeather] = useState<WeatherResponse | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/weather", {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("weather request failed");
        return (await response.json()) as WeatherResponse;
      })
      .then(setWeather)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setWeather({
          status: "unavailable",
          message: "天气暂不可用，首页其他内容仍可正常阅读。",
        });
      });
    return () => controller.abort();
  }, []);

  if (!weather) {
    return (
      <section
        aria-busy="true"
        aria-label="天气"
        className={[
          "rounded-[1.125rem] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]",
          className,
        ].join(" ")}
      >
        <div className="h-4 w-24 animate-pulse rounded bg-[var(--surface-strong)] motion-reduce:animate-none" />
        <div className="mt-5 h-12 w-32 animate-pulse rounded bg-[var(--surface-strong)] motion-reduce:animate-none" />
        <p className="mt-5 text-sm text-[var(--muted)]">正在读取已配置城市的天气…</p>
      </section>
    );
  }

  if (weather.status !== "ready") {
    return (
      <section
        aria-live="polite"
        className={[
          "rounded-[1.125rem] border border-dashed border-[var(--line)] bg-[var(--surface)] p-5",
          className,
        ].join(" ")}
      >
        <CloudSun aria-hidden="true" className="text-[var(--accent)]" size={25} />
        <h2 className="mt-3 text-base font-semibold">天气暂不可用</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{weather.message}</p>
      </section>
    );
  }

  return (
    <section
      aria-label={`${weather.city}天气`}
      className={[
        "rounded-[1.125rem] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]",
        className,
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-medium text-[var(--muted)]">
            <MapPin aria-hidden="true" size={14} />
            {weather.city}
          </p>
          <div className="mt-3 flex items-end gap-2">
            <span className="text-4xl font-semibold tracking-[-0.06em]">
              {weather.temperature}°
            </span>
            <span className="pb-1 text-sm text-[var(--muted)]">
              {weather.condition}
            </span>
          </div>
        </div>
        <span className="grid size-12 place-items-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
          <WeatherIcon code={weather.code} size={26} />
        </span>
      </div>

      {weather.description ? (
        <p className="mt-4 border-t border-[var(--line)] pt-4 text-sm leading-6 text-[var(--muted)]">
          {weather.description}
        </p>
      ) : null}

      {weather.source === "auto" ? (
        <div className="mt-4 grid grid-cols-2 gap-2 border-y border-[var(--line)] py-3 text-xs text-[var(--muted)]">
          <span>最高 {weather.high}° · 最低 {weather.low}°</span>
          <span className="text-right">
            {new Intl.DateTimeFormat("zh-CN", {
              timeZone: weather.timezone,
              hour: "2-digit",
              minute: "2-digit",
            }).format(new Date())}
            {" 更新"}
          </span>
          <span className="flex items-center gap-1.5">
            <Droplets aria-hidden="true" size={14} />
            湿度 {weather.humidity}%
          </span>
          <span className="flex items-center justify-end gap-1.5">
            <Wind aria-hidden="true" size={14} />
            风速 {weather.windSpeed} km/h
          </span>
        </div>
      ) : (
        <p className="mt-4 border-y border-[var(--line)] py-3 text-xs text-[var(--muted)]">
          管理员手动更新 ·{" "}
          {new Intl.DateTimeFormat("zh-CN", {
            timeZone: weather.timezone,
            hour: "2-digit",
            minute: "2-digit",
          }).format(new Date(weather.observedAt))}
        </p>
      )}

      {weather.hourly.length ? (
        <ol
          aria-label="未来几小时天气"
          className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-3"
        >
          {weather.hourly.map((hour) => (
            <li
              className="grid min-h-20 place-items-center rounded-[var(--radius-control,0.625rem)] bg-[var(--surface-strong)] px-1 py-2 text-center"
              key={hour.time}
              title={hour.condition}
            >
              <span className="font-mono text-[10px] text-[var(--muted)]">
                {hour.time}
              </span>
              <WeatherIcon code={hour.code} size={16} />
              <span className="text-xs font-semibold">{hour.temperature}°</span>
            </li>
          ))}
        </ol>
      ) : null}

      {weather.attribution ? (
        <p className="mt-4 text-[10px] text-[var(--muted)]">
          天气数据：
          <a
            className="underline underline-offset-2 hover:text-[var(--ink)]"
            href={weather.attribution.url}
            rel="noopener noreferrer"
            target="_blank"
          >
            {weather.attribution.label}
          </a>
        </p>
      ) : null}
    </section>
  );
}
