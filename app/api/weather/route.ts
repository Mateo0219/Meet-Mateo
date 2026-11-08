import { NextResponse } from "next/server";
import { parseOpenMeteo, BEIJING_COORDINATES } from "@/lib/weather";

const MAX_WEATHER_BYTES = 16_000;

// Fixed coordinates only: this route never takes a location from the visitor.
export async function GET() {
  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.search = new URLSearchParams({
      latitude: String(BEIJING_COORDINATES.latitude),
      longitude: String(BEIJING_COORDINATES.longitude),
      current: "temperature_2m,weather_code,is_day",
      timezone: "Asia/Shanghai",
    }).toString();

    const response = await fetch(url, {
      redirect: "error",
      signal: AbortSignal.timeout(6_000),
      next: { revalidate: 1_800 },
    });
    if (!response.ok) throw new Error(`Open-Meteo 请求失败: ${response.status}`);

    const body = await response.text();
    if (new TextEncoder().encode(body).byteLength > MAX_WEATHER_BYTES) throw new Error("天气响应过大");

    const weather = parseOpenMeteo(JSON.parse(body) as unknown);
    if (!weather) throw new Error("天气响应格式无效");

    return NextResponse.json(weather, {
      headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" },
    });
  } catch (error: unknown) {
    console.error("获取天气错误:", error);
    return NextResponse.json({ error: "暂时无法读取天气" }, { status: 502 });
  }
}
