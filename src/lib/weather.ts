import { z } from "zod";

const currentWeatherSchema = z.object({
  time: z.string(),
  temperature_2m: z.number(),
  relative_humidity_2m: z.number(),
  weather_code: z.number().int(),
  wind_speed_10m: z.number(),
});

const forecastSchema = z.object({
  current: currentWeatherSchema,
  hourly: z.object({
    time: z.array(z.string()),
    temperature_2m: z.array(z.number()),
    weather_code: z.array(z.number().int()),
  }),
  daily: z.object({
    time: z.array(z.string()),
    temperature_2m_max: z.array(z.number()),
    temperature_2m_min: z.array(z.number()),
    weather_code: z.array(z.number().int()),
  }),
});

export type WeatherHour = {
  time: string;
  temperature: number;
  code: number;
  condition: string;
};

export type WeatherSnapshot = {
  status: "ready";
  source: "auto" | "manual";
  city: string;
  timezone: string;
  observedAt: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  code: number;
  condition: string;
  high: number;
  low: number;
  hourly: WeatherHour[];
  description?: string;
  attribution: {
    label: string;
    url: string;
  } | null;
};

export type WeatherUnavailable = {
  status: "disabled" | "unconfigured" | "unavailable";
  message: string;
};

export type WeatherResponse = WeatherSnapshot | WeatherUnavailable;

export type WeatherConfig = {
  enabled: boolean;
  city: string;
  latitude: number;
  longitude: number;
  timezone: string;
  mode?: "auto" | "manual";
  manualCondition?: string;
  manualTemperature?: number;
  manualDescription?: string;
};

export function weatherCondition(code: number) {
  if (code === 0) return "晴朗";
  if (code === 1) return "大部晴朗";
  if (code === 2) return "局部多云";
  if (code === 3) return "阴天";
  if (code === 45 || code === 48) return "有雾";
  if ([51, 53, 55, 56, 57].includes(code)) return "毛毛雨";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "有雨";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "有雪";
  if ([95, 96, 99].includes(code)) return "雷雨";
  return "天气变化中";
}

export function manualWeatherCode(condition: string) {
  if (/雷/.test(condition)) return 95;
  if (/雪/.test(condition)) return 73;
  if (/雨/.test(condition)) return 61;
  if (/雾|霾/.test(condition)) return 45;
  if (/多云|阴/.test(condition)) return 2;
  if (/晴/.test(condition)) return 0;
  return 3;
}

export function isValidTimeZone(timezone: string) {
  try {
    new Intl.DateTimeFormat("zh-CN", { timeZone: timezone }).format();
    return true;
  } catch {
    return false;
  }
}

function rounded(value: number) {
  return Math.round(value * 10) / 10;
}

function hourLabel(value: string) {
  const match = value.match(/T(\d{2}:\d{2})/);
  return match?.[1] ?? value;
}

export async function fetchWeather(
  config: WeatherConfig,
  fetcher: typeof fetch = fetch,
): Promise<WeatherResponse> {
  if (!config.enabled) {
    return { status: "disabled", message: "天气展示已由管理员关闭。" };
  }
  if (config.mode === "manual") {
    const condition = config.manualCondition?.trim() ?? "";
    const temperature = config.manualTemperature;
    if (
      !config.city.trim() ||
      !condition ||
      !Number.isFinite(temperature) ||
      temperature! < -100 ||
      temperature! > 100 ||
      !isValidTimeZone(config.timezone)
    ) {
      return {
        status: "unconfigured",
        message: "手动天气尚未配置城市、天气状态、温度和有效时区。",
      };
    }
    const roundedTemperature = rounded(temperature!);
    return {
      status: "ready",
      source: "manual",
      city: config.city.trim(),
      timezone: config.timezone,
      observedAt: new Date().toISOString(),
      temperature: roundedTemperature,
      humidity: 0,
      windSpeed: 0,
      code: manualWeatherCode(condition),
      condition,
      high: roundedTemperature,
      low: roundedTemperature,
      hourly: [],
      description: config.manualDescription?.trim() || undefined,
      attribution: null,
    };
  }
  if (
    !config.city ||
    !Number.isFinite(config.latitude) ||
    !Number.isFinite(config.longitude) ||
    config.latitude < -90 ||
    config.latitude > 90 ||
    config.longitude < -180 ||
    config.longitude > 180 ||
    !isValidTimeZone(config.timezone)
  ) {
    return {
      status: "unconfigured",
      message: "天气尚未配置城市、经纬度和有效时区。",
    };
  }

  const endpoint = new URL("https://api.open-meteo.com/v1/forecast");
  endpoint.searchParams.set("latitude", String(config.latitude));
  endpoint.searchParams.set("longitude", String(config.longitude));
  endpoint.searchParams.set(
    "current",
    "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m",
  );
  endpoint.searchParams.set("hourly", "temperature_2m,weather_code");
  endpoint.searchParams.set(
    "daily",
    "weather_code,temperature_2m_max,temperature_2m_min",
  );
  endpoint.searchParams.set("forecast_days", "2");
  endpoint.searchParams.set("timezone", config.timezone);

  try {
    const response = await fetcher(endpoint, {
      headers: { Accept: "application/json" },
      next: { revalidate: 1800 },
      signal: AbortSignal.timeout(6_000),
    });
    if (!response.ok) {
      return {
        status: "unavailable",
        message: "天气服务暂时不可用，请稍后再看。",
      };
    }

    const parsed = forecastSchema.safeParse(await response.json());
    if (!parsed.success) {
      return {
        status: "unavailable",
        message: "天气服务返回了无法识别的数据。",
      };
    }

    const data = parsed.data;
    const currentIndex = Math.max(
      0,
      data.hourly.time.findIndex((time) => time >= data.current.time),
    );
    const availableHours = Math.min(
      data.hourly.time.length,
      data.hourly.temperature_2m.length,
      data.hourly.weather_code.length,
    );
    const hourly: WeatherHour[] = [];
    for (
      let index = currentIndex;
      index < Math.min(availableHours, currentIndex + 6);
      index += 1
    ) {
      const code = data.hourly.weather_code[index];
      hourly.push({
        time: hourLabel(data.hourly.time[index]),
        temperature: rounded(data.hourly.temperature_2m[index]),
        code,
        condition: weatherCondition(code),
      });
    }

    return {
      status: "ready",
      source: "auto",
      city: config.city,
      timezone: config.timezone,
      observedAt: data.current.time,
      temperature: rounded(data.current.temperature_2m),
      humidity: Math.round(data.current.relative_humidity_2m),
      windSpeed: rounded(data.current.wind_speed_10m),
      code: data.current.weather_code,
      condition: weatherCondition(data.current.weather_code),
      high: rounded(data.daily.temperature_2m_max[0] ?? data.current.temperature_2m),
      low: rounded(data.daily.temperature_2m_min[0] ?? data.current.temperature_2m),
      hourly,
      attribution: {
        label: "Open-Meteo",
        url: "https://open-meteo.com/",
      },
    };
  } catch {
    return {
      status: "unavailable",
      message: "天气服务暂时不可用，请稍后再看。",
    };
  }
}
