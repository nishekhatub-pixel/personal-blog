"use client";

import type { CalendarMarker } from "@/lib/garden-data";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type CalendarResponse = {
  markers: CalendarMarker[];
  month: number;
  year: number;
};

type CalendarCell = {
  currentMonth: boolean;
  dateKey: string;
  day: number;
};

const markerLabels = {
  moment: "说说",
  photo: "照片",
  post: "文章",
  project: "项目",
} as const;

const markerShortLabels = {
  moment: "说",
  photo: "照",
  post: "文",
  project: "项",
} as const;

function dateKey(date: Date) {
  return [
    String(date.getFullYear()).padStart(4, "0"),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function calendarCells(year: number, month: number): CalendarCell[] {
  const first = new Date(year, month - 1, 1);
  const gridStart = new Date(year, month - 1, 1 - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(
      gridStart.getFullYear(),
      gridStart.getMonth(),
      gridStart.getDate() + index,
    );
    return {
      currentMonth:
        date.getFullYear() === year && date.getMonth() === month - 1,
      dateKey: dateKey(date),
      day: date.getDate(),
    };
  });
}

function adjacentMonth(year: number, month: number, offset: number) {
  const date = new Date(year, month - 1 + offset, 1);
  return { month: date.getMonth() + 1, year: date.getFullYear() };
}

function validCalendarResponse(value: unknown): value is CalendarResponse {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<CalendarResponse>;
  return (
    Number.isInteger(candidate.year) &&
    Number.isInteger(candidate.month) &&
    Array.isArray(candidate.markers)
  );
}

export function ContentCalendar({
  initialMarkers,
  initialMonth,
  initialYear,
  todayKey,
}: {
  initialMarkers: CalendarMarker[];
  initialMonth: number;
  initialYear: number;
  todayKey: string;
}) {
  const [view, setView] = useState({
    markers: initialMarkers,
    month: initialMonth,
    year: initialYear,
  });
  const [state, setState] = useState<
    { kind: "idle" } | { kind: "loading" } | { kind: "error"; message: string }
  >({ kind: "idle" });
  const abortRef = useRef<AbortController | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const cells = useMemo(
    () => calendarCells(view.year, view.month),
    [view.month, view.year],
  );
  const markers = useMemo(
    () => new Map(view.markers.map((marker) => [marker.date, marker])),
    [view.markers],
  );
  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("zh-CN", {
        month: "long",
        year: "numeric",
      }).format(new Date(view.year, view.month - 1, 1)),
    [view.month, view.year],
  );

  useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    [],
  );

  async function loadMonth(year: number, month: number) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setState({ kind: "loading" });
    try {
      const response = await fetch(`/api/calendar?year=${year}&month=${month}`, {
        cache: "no-store",
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("日历暂时无法更新。");
      const payload = (await response.json()) as unknown;
      if (!validCalendarResponse(payload)) {
        throw new Error("日历返回了无效数据。");
      }
      setView(payload);
      setState({ kind: "idle" });
    } catch (error) {
      if (controller.signal.aborted) return;
      setState({
        kind: "error",
        message: error instanceof Error ? error.message : "日历暂时无法更新。",
      });
    }
  }

  function move(offset: number) {
    const target = adjacentMonth(view.year, view.month, offset);
    void loadMonth(target.year, target.month);
  }

  function handleGridKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const active = document.activeElement;
    const links = Array.from(
      gridRef.current?.querySelectorAll<HTMLAnchorElement>(
        "[data-calendar-day]",
      ) ?? [],
    );
    const index = links.findIndex((link) => link === active);
    if (index < 0) return;

    let nextIndex = index;
    if (event.key === "ArrowLeft") nextIndex = index - 1;
    else if (event.key === "ArrowRight") nextIndex = index + 1;
    else if (event.key === "ArrowUp") nextIndex = index - 7;
    else if (event.key === "ArrowDown") nextIndex = index + 7;
    else if (event.key === "Home") nextIndex = index - (index % 7);
    else if (event.key === "End") nextIndex = index + (6 - (index % 7));
    else if (event.key === "PageUp") {
      event.preventDefault();
      move(-1);
      return;
    } else if (event.key === "PageDown") {
      event.preventDefault();
      move(1);
      return;
    } else {
      return;
    }

    if (links[nextIndex]) {
      event.preventDefault();
      links[nextIndex].focus();
    }
  }

  return (
    <section
      aria-labelledby="content-calendar-title"
      className="home-panel home-calendar"
    >
      <div className="home-calendar__header">
        <div>
          <h2 className="home-widget-title" id="content-calendar-title">
            内容日历
          </h2>
          <p className="home-widget-copy">按日期回看公开记录</p>
        </div>
        <div className="flex gap-1">
          <button
            aria-label="上一个月"
            className="home-calendar__nav"
            disabled={state.kind === "loading"}
            onClick={() => move(-1)}
            type="button"
          >
            <ChevronLeft aria-hidden="true" size={17} />
          </button>
          <button
            aria-label="下一个月"
            className="home-calendar__nav"
            disabled={state.kind === "loading"}
            onClick={() => move(1)}
            type="button"
          >
            <ChevronRight aria-hidden="true" size={17} />
          </button>
        </div>
      </div>
      <p aria-live="polite" className="home-calendar__month">
        {monthLabel}
      </p>
      <div className="home-calendar__weekdays" aria-hidden="true">
        {["日", "一", "二", "三", "四", "五", "六"].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div
        aria-busy={state.kind === "loading"}
        aria-label={`${monthLabel}内容日历`}
        className="home-calendar__grid"
        onKeyDown={handleGridKeyDown}
        ref={gridRef}
      >
        {cells.map((cell) => {
          const marker = markers.get(cell.dateKey);
          const markerText = marker
            ? marker.types.map((type) => markerLabels[type]).join("、")
            : "";
          return (
            <Link
              aria-label={`${cell.dateKey}${marker ? `，${marker.count} 条${markerText}` : "，无公开内容"}`}
              aria-current={cell.dateKey === todayKey ? "date" : undefined}
              className={[
                "home-calendar__day",
                cell.currentMonth ? "" : "home-calendar__day--adjacent",
                marker ? "home-calendar__day--marked" : "",
              ].join(" ")}
              data-calendar-day
              href={`/calendar?date=${cell.dateKey}`}
              key={cell.dateKey}
              title={marker?.labels.join("；")}
            >
              <span>{cell.day}</span>
              {marker ? (
                <span aria-hidden="true" className="home-calendar__types">
                  {marker.types.slice(0, 2).map((type) => (
                    <span key={type}>{markerShortLabels[type]}</span>
                  ))}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
      <div aria-live="polite" className="home-calendar__status">
        {state.kind === "loading" ? "正在读取这个月的公开记录" : null}
        {state.kind === "error" ? (
          <span className="flex items-center justify-between gap-3 text-[var(--danger)]">
            {state.message}
            <button
              aria-label="重试加载当前月份"
              className="grid size-11 shrink-0 place-items-center"
              onClick={() => void loadMonth(view.year, view.month)}
              type="button"
            >
              <RotateCcw aria-hidden="true" size={15} />
            </button>
          </span>
        ) : null}
      </div>
    </section>
  );
}
