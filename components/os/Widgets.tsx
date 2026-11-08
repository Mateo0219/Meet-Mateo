"use client";

/* eslint-disable @next/next/no-img-element -- small local SVG avatar, no optimisation needed */

import { useRef } from "react";
import { ArrowUpRight, Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Moon, Sun, type LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import { swatches, type SwatchName } from "@/lib/poster";
import { sentenceText } from "@/lib/token-sentence";
import type { WeatherIcon } from "@/lib/weather";
import { rectOf, useOS } from "./OSProvider";

export const AVATAR_SRC = "/avatar-placeholder.svg";

const weatherIcons: Record<WeatherIcon, LucideIcon> = {
  sun: Sun,
  moon: Moon,
  partly: CloudSun,
  cloud: Cloud,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  snow: CloudSnow,
  storm: CloudLightning,
};

const RING = 2 * Math.PI * 40;

/** On the blue day wallpaper a blue widget would vanish; swap it for cream. */
function useWidgetPaint(name: SwatchName) {
  const { isNight } = useOS();
  const swatch = swatches[!isNight && name === "blue" ? "cream" : name];
  return { backgroundColor: swatch.bg, color: swatch.ink };
}

export function ProfileWidget() {
  const { clock, choice, composition, openApp } = useOS();
  const ref = useRef<HTMLElement>(null);
  const paint = useWidgetPaint(composition.colors.title);
  return (
    <article ref={ref} className="widget widget-profile" style={paint}>
      <div className="widget-profile-top">
        <img src={AVATAR_SRC} alt="" className="widget-avatar" width={64} height={75} />
        <div>
          <span className="widget-label">{clock ? `${clock.moment}的` : "此刻的"}</span>
          <strong className="widget-name">Mateo</strong>
        </div>
      </div>
      <p className="widget-sentence">{sentenceText(choice)}</p>
      <button type="button" className="widget-action" onClick={() => openApp("now", { origin: rectOf(ref.current) })}>
        打开此刻 <ArrowUpRight size={14} aria-hidden="true" />
      </button>
    </article>
  );
}

export function WeatherWidget() {
  const { weather, composition } = useOS();
  const paint = useWidgetPaint(composition.colors.weather);
  const Glyph = weather ? weatherIcons[weather.icon] : Cloud;
  return (
    <article className="widget widget-small" style={paint} aria-label="北京天气">
      <span className="widget-label">北京</span>
      <Glyph className="widget-glyph" size={30} strokeWidth={1.8} aria-hidden="true" />
      <strong className="widget-figure">{weather ? `${weather.temperature}°` : "--°"}</strong>
      <span className="widget-caption">{weather?.label ?? "读取中"}</span>
    </article>
  );
}

export function OrbitWidget() {
  const { birthday, composition } = useOS();
  const paint = useWidgetPaint(composition.colors.orbit);
  return (
    <article className="widget widget-small" style={paint} aria-label="生日轨道">
      <span className="widget-label">生日轨道</span>
      <svg className="widget-ring" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="40" />
        <motion.circle
          cx="50"
          cy="50"
          r="40"
          strokeDasharray={RING}
          initial={{ strokeDashoffset: RING }}
          animate={{ strokeDashoffset: RING * (1 - (birthday?.birthdayPercent ?? 0) / 100) }}
          transition={{ type: "spring", bounce: 0, duration: 1.2, delay: 0.2 }}
        />
      </svg>
      <strong className="widget-figure">{birthday?.daysUntilBirthday ?? "--"}</strong>
      <span className="widget-caption">天后再绕一圈</span>
    </article>
  );
}
