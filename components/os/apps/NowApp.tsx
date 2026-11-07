"use client";

import Image from "next/image";
import { useRef } from "react";
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Moon,
  Play,
  RefreshCw,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { swatches } from "@/lib/poster";
import type { WeatherIcon } from "@/lib/weather";
import { rectOf, useOS } from "../OSProvider";
import TokenSentence from "./TokenSentence";

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

const gridVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
  exit: { transition: { staggerChildren: 0.02, staggerDirection: -1 } },
};

const blockVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 14 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring" as const, bounce: 0, duration: 0.45 } },
  exit: { opacity: 0, scale: 0.97, transition: { duration: 0.14 } },
};

const RING_RADIUS = 44;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

export default function NowApp() {
  const { clock, weather, todaySong, birthday, composition, choice, temperature, setTemperature, swapToken, regenerate, playToday, isNight } = useOS();
  const songRef = useRef<HTMLElement>(null);
  const { colors, chipColors, layout, seed } = composition;
  const paint = (block: keyof typeof colors) => ({ backgroundColor: swatches[colors[block]].bg, color: swatches[colors[block]].ink });
  const WeatherGlyph = weather ? weatherIcons[weather.icon] : Cloud;
  const signalCount = [clock, weather, todaySong, birthday].filter(Boolean).length + 1;

  return (
    <div className={`now-app${isNight ? " is-night" : ""}`}>
      <AnimatePresence mode="wait">
        <motion.div key={seed} className="poster-grid" data-layout={layout} variants={gridVariants} initial="hidden" animate="visible" exit="exit">
          <motion.article className="poster-block block-title" style={paint("title")} variants={blockVariants}>
            <div className="block-meta">
              <span>上海 · {clock?.time ?? "--:--"}</span>
              <span>{clock ? `${clock.weekday} ${clock.date}` : ""}</span>
            </div>
            <h2 className="poster-title">
              <span>{clock ? `${clock.moment}的` : "此刻的"}</span>
              <span>Mateo</span>
            </h2>
            <TokenSentence choice={choice} temperature={temperature} chipColors={chipColors} onSwap={swapToken} />
            <label className="temperature-control">
              <span>temperature</span>
              <input
                type="range"
                min={0.1}
                max={1.5}
                step={0.1}
                value={temperature}
                onChange={(event) => setTemperature(Number(event.target.value))}
                aria-label="采样温度"
              />
              <output>{temperature.toFixed(1)}</output>
            </label>
          </motion.article>

          <motion.article ref={songRef} className="poster-block block-song" style={paint("song")} variants={blockVariants}>
            <span className="block-label">今天抽到</span>
            <div className="song-disc" aria-hidden="true">
              {todaySong ? <Image src={todaySong.cover} alt="" width={240} height={240} unoptimized /> : <span className="song-disc-empty" />}
            </div>
            <div className="song-copy">
              <strong>{todaySong?.name ?? "正在抽歌…"}</strong>
              <span>{todaySong?.artist ?? "Mateo_0219 喜欢的音乐"}</span>
            </div>
            <button type="button" className="block-action" onClick={() => playToday(rectOf(songRef.current))} disabled={!todaySong}>
              <Play size={15} fill="currentColor" aria-hidden="true" /> 播放
            </button>
          </motion.article>

          <motion.article className="poster-block block-orbit" style={paint("orbit")} variants={blockVariants}>
            <span className="block-label">生日轨道</span>
            <svg className="orbit-ring" viewBox="0 0 100 100" aria-hidden="true">
              <circle cx="50" cy="50" r={RING_RADIUS} />
              <motion.circle
                cx="50"
                cy="50"
                r={RING_RADIUS}
                strokeDasharray={RING_LENGTH}
                initial={{ strokeDashoffset: RING_LENGTH }}
                animate={{ strokeDashoffset: RING_LENGTH * (1 - (birthday?.birthdayPercent ?? 0) / 100) }}
                transition={{ type: "spring", bounce: 0, duration: 1.1, delay: 0.25 }}
              />
            </svg>
            <div className="block-figure">
              <strong>{birthday ? birthday.daysUntilBirthday : "--"}</strong>
              <span>天后再绕一圈</span>
            </div>
          </motion.article>

          <motion.article className="poster-block block-weather" style={paint("weather")} variants={blockVariants}>
            <span className="block-label">上海天气</span>
            <WeatherGlyph className="weather-glyph" size={44} strokeWidth={1.6} aria-hidden="true" />
            <div className="block-figure">
              <strong>{weather ? `${weather.temperature}°` : "--°"}</strong>
              <span>{weather?.label ?? "读取中"}</span>
            </div>
          </motion.article>
        </motion.div>
      </AnimatePresence>

      <div className="poster-strip">
        <span className="strip-status">
          <i className="live-dot" aria-hidden="true" />
          由 {signalCount} 个实时信号生成 · seed {seed}
        </span>
        <button type="button" onClick={regenerate}>
          <RefreshCw size={14} aria-hidden="true" /> 重新生成
        </button>
      </div>
    </div>
  );
}
