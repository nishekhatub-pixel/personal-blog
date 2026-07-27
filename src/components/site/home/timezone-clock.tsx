"use client";

import { useEffect, useMemo, useState } from "react";

function validTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat("zh-CN", { timeZone }).format();
    return timeZone;
  } catch {
    return "Asia/Shanghai";
  }
}

export function TimezoneClock({
  initialIso,
  timeZone,
}: {
  initialIso: string;
  timeZone: string;
}) {
  const [now, setNow] = useState(() => new Date(initialIso));
  const zone = useMemo(() => validTimeZone(timeZone), [timeZone]);
  const timeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("zh-CN", {
        hour: "2-digit",
        hour12: false,
        minute: "2-digit",
        second: "2-digit",
        timeZone: zone,
      }),
    [zone],
  );
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("zh-CN", {
        day: "2-digit",
        month: "short",
        timeZone: zone,
        weekday: "short",
      }),
    [zone],
  );

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="home-clock" aria-label={`${zone} 当前时间`}>
      <time className="home-clock__time" dateTime={now.toISOString()}>
        {timeFormatter.format(now)}
      </time>
      <span className="home-clock__date">{dateFormatter.format(now)}</span>
    </div>
  );
}
