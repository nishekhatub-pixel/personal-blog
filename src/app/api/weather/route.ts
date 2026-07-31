import { NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/data";
import { fetchWeather } from "@/lib/weather";

export const runtime = "nodejs";

export async function GET() {
  const settings = await getSiteSettings();
  const latitude =
    settings.latitude.trim() === "" ? Number.NaN : Number(settings.latitude);
  const longitude =
    settings.longitude.trim() === "" ? Number.NaN : Number(settings.longitude);
  const weather = await fetchWeather({
    enabled: settings.weatherEnabled === "true",
    city: settings.locationName.trim(),
    latitude,
    longitude,
    timezone: settings.timezone,
    mode: settings.weatherMode === "manual" ? "manual" : "auto",
    manualCondition: settings.manualWeatherCondition,
    manualTemperature:
      settings.manualWeatherTemperature.trim() === ""
        ? Number.NaN
        : Number(settings.manualWeatherTemperature),
    manualDescription: settings.manualWeatherDescription,
  });

  return NextResponse.json(weather, {
    headers: {
      "Cache-Control":
        weather.status === "ready"
          ? "public, max-age=60, s-maxage=1800, stale-while-revalidate=3600"
          : "public, max-age=30, s-maxage=300",
    },
  });
}
