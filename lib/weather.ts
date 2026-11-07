export type WeatherIcon = "sun" | "moon" | "partly" | "cloud" | "fog" | "drizzle" | "rain" | "snow" | "storm";

export interface ShanghaiWeather {
  temperature: number;
  code: number;
  isDay: boolean;
  label: string;
  icon: WeatherIcon;
}

export const SHANGHAI_COORDINATES = { latitude: 31.23, longitude: 121.47 } as const;

/** WMO weather interpretation codes, as returned by Open-Meteo. */
export function describeWeatherCode(code: number, isDay: boolean): { label: string; icon: WeatherIcon } {
  if (code === 0) return { label: "晴", icon: isDay ? "sun" : "moon" };
  if (code === 1) return { label: "大致晴朗", icon: isDay ? "sun" : "moon" };
  if (code === 2) return { label: "局部多云", icon: "partly" };
  if (code === 3) return { label: "阴", icon: "cloud" };
  if (code === 45 || code === 48) return { label: "雾", icon: "fog" };
  if (code >= 51 && code <= 57) return { label: "毛毛雨", icon: "drizzle" };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return { label: code >= 80 ? "阵雨" : "雨", icon: "rain" };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { label: "雪", icon: "snow" };
  if (code >= 95 && code <= 99) return { label: "雷雨", icon: "storm" };
  return { label: "多云", icon: "cloud" };
}

export function parseOpenMeteo(data: unknown): ShanghaiWeather | null {
  if (!data || typeof data !== "object" || !("current" in data)) return null;
  const current = (data as { current: unknown }).current;
  if (!current || typeof current !== "object") return null;
  const { temperature_2m: temperature, weather_code: code, is_day: isDay } = current as Record<string, unknown>;
  if (typeof temperature !== "number" || !Number.isFinite(temperature)) return null;
  if (typeof code !== "number" || !Number.isInteger(code)) return null;
  const day = isDay !== 0;
  return { temperature: Math.round(temperature), code, isDay: day, ...describeWeatherCode(code, day) };
}

const weatherIconNames = new Set<WeatherIcon>(["sun", "moon", "partly", "cloud", "fog", "drizzle", "rain", "snow", "storm"]);

export function isShanghaiWeather(value: unknown): value is ShanghaiWeather {
  if (!value || typeof value !== "object") return false;
  const weather = value as Record<string, unknown>;
  return (
    typeof weather.temperature === "number" &&
    typeof weather.code === "number" &&
    typeof weather.isDay === "boolean" &&
    typeof weather.label === "string" &&
    typeof weather.icon === "string" &&
    weatherIconNames.has(weather.icon as WeatherIcon)
  );
}
