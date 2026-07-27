import { NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/data";
import { getCurrentMonthCalendarMarkers } from "@/lib/garden-data";

export const dynamic = "force-dynamic";

function integerParameter(value: string | null) {
  if (!value || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const year = integerParameter(url.searchParams.get("year"));
  const month = integerParameter(url.searchParams.get("month"));
  if (!year || year < 1970 || year > 9999 || !month || month < 1 || month > 12) {
    return NextResponse.json(
      { error: "请提供有效的 year 与 month。" },
      { status: 400 },
    );
  }

  const settings = await getSiteSettings();
  const markers = await getCurrentMonthCalendarMarkers({
    month,
    timeZone: settings.timezone,
    year,
  });

  return NextResponse.json(
    { markers, month, year },
    { headers: { "Cache-Control": "no-store" } },
  );
}
