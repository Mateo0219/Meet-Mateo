"use client";

import { useState, useEffect } from "react";
import { Cloud, CloudRain, Sun, CloudSnow } from "lucide-react";

interface WeatherData {
  temp: number;
  condition: string;
  location: string;
}

export default function Weather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  const getWeatherIcon = (condition: string) => {
    const lower = condition.toLowerCase();
    if (lower.includes("雨")) return <CloudRain className="w-8 h-8 text-aurora-blue" />;
    if (lower.includes("雪")) return <CloudSnow className="w-8 h-8 text-white" />;
    if (lower.includes("晴")) return <Sun className="w-8 h-8 text-yellow-400" />;
    return <Cloud className="w-8 h-8 text-white/60" />;
  };

  useEffect(() => {
    // 由于需要 API key，这里使用模拟数据
    // 实际使用时可以接入天气 API（如 OpenWeatherMap, 和风天气等）
    const fetchWeather = async () => {
      try {
        // 模拟 API 调用
        await new Promise((resolve) => setTimeout(resolve, 500));
        
        // 这里可以替换为真实的天气 API
        // const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=Beijing&appid=YOUR_API_KEY&units=metric&lang=zh_cn`);
        // const data = await response.json();
        
        setWeather({
          temp: 22,
          condition: "晴天",
          location: "北京",
        });
      } catch (error) {
        console.error("Failed to fetch weather:", error);
        setWeather({
          temp: 20,
          condition: "多云",
          location: "未知",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    // 每30分钟更新一次
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-card glass-card-hover p-6 group relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-aurora-pink/20 to-aurora-purple/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">天气</h3>
          {loading ? (
            <div className="w-8 h-8 bg-white/10 rounded animate-pulse" />
          ) : weather ? (
            getWeatherIcon(weather.condition)
          ) : null}
        </div>
        
        {loading ? (
          <div className="space-y-2">
            <div className="h-6 bg-white/10 rounded animate-pulse" />
            <div className="h-4 bg-white/10 rounded animate-pulse w-2/3" />
          </div>
        ) : weather ? (
          <div className="space-y-2">
            <div className="text-3xl font-bold text-white">
              {weather.temp}°C
            </div>
            <div className="text-white/60 text-sm">{weather.condition}</div>
            <div className="text-white/40 text-xs">{weather.location}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

