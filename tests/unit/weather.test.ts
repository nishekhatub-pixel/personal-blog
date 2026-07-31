import { describe, expect, it, vi } from "vitest";
import {
  fetchWeather,
  weatherCondition,
  type WeatherConfig,
} from "@/lib/weather";

const configured: WeatherConfig = {
  enabled: true,
  city: "广州",
  latitude: 23.1291,
  longitude: 113.2644,
  timezone: "Asia/Shanghai",
};

describe("weather service", () => {
  it("does not call the network when weather is disabled", async () => {
    const fetcher = vi.fn();

    await expect(
      fetchWeather({ ...configured, enabled: false }, fetcher as typeof fetch),
    ).resolves.toEqual({
      status: "disabled",
      message: "天气展示已由管理员关闭。",
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("rejects invalid city-level configuration before fetching", async () => {
    const fetcher = vi.fn();

    const result = await fetchWeather(
      { ...configured, latitude: Number.NaN },
      fetcher as typeof fetch,
    );

    expect(result.status).toBe("unconfigured");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("returns administrator weather without calling Open-Meteo", async () => {
    const fetcher = vi.fn();

    const result = await fetchWeather(
      {
        ...configured,
        mode: "manual",
        manualCondition: "小雨",
        manualDescription: "晚些时候转凉。",
        manualTemperature: 24.6,
      },
      fetcher as typeof fetch,
    );

    expect(result).toMatchObject({
      status: "ready",
      source: "manual",
      city: "广州",
      code: 61,
      condition: "小雨",
      description: "晚些时候转凉。",
      temperature: 24.6,
      attribution: null,
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("maps an official Open-Meteo response and requests a 30-minute cache", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          current: {
            time: "2026-07-27T10:00",
            temperature_2m: 30.26,
            relative_humidity_2m: 71,
            weather_code: 2,
            wind_speed_10m: 8.44,
          },
          hourly: {
            time: [
              "2026-07-27T09:00",
              "2026-07-27T10:00",
              "2026-07-27T11:00",
            ],
            temperature_2m: [29, 30.26, 31.18],
            weather_code: [1, 2, 61],
          },
          daily: {
            time: ["2026-07-27"],
            temperature_2m_max: [34.14],
            temperature_2m_min: [26.06],
            weather_code: [2],
          },
        }),
        { status: 200 },
      ),
    );

    const result = await fetchWeather(configured, fetcher as typeof fetch);

    expect(result).toMatchObject({
      status: "ready",
      city: "广州",
      condition: "局部多云",
      temperature: 30.3,
      humidity: 71,
      windSpeed: 8.4,
      high: 34.1,
      low: 26.1,
      hourly: [
        { time: "10:00", temperature: 30.3, condition: "局部多云" },
        { time: "11:00", temperature: 31.2, condition: "有雨" },
      ],
    });
    const [url, init] = fetcher.mock.calls[0] as [URL, RequestInit & {
      next: { revalidate: number };
    }];
    expect(url.origin + url.pathname).toBe(
      "https://api.open-meteo.com/v1/forecast",
    );
    expect(url.searchParams.get("timezone")).toBe("Asia/Shanghai");
    expect(init.next.revalidate).toBe(1800);
  });

  it("returns a stable unavailable state when the service fails", async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error("offline"));

    await expect(
      fetchWeather(configured, fetcher as typeof fetch),
    ).resolves.toEqual({
      status: "unavailable",
      message: "天气服务暂时不可用，请稍后再看。",
    });
  });

  it("covers the documented WMO weather groups", () => {
    expect(weatherCondition(0)).toBe("晴朗");
    expect(weatherCondition(45)).toBe("有雾");
    expect(weatherCondition(63)).toBe("有雨");
    expect(weatherCondition(73)).toBe("有雪");
    expect(weatherCondition(95)).toBe("雷雨");
    expect(weatherCondition(500)).toBe("天气变化中");
  });
});
