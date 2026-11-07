"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { animate, motion, useMotionValue, useReducedMotion } from "motion/react";
import { ArrowUpRight, Check, Coffee, Hand, Home, Layers, Minus, Music2, Pause, Play, Plus, Search } from "lucide-react";
import type { AppId } from "@/lib/os-apps";
import { rectOf, useOS } from "./OSProvider";

type SceneId = "work" | "pingpong" | "music" | "life";
const scenes: { id: SceneId; number: string; title: string; subtitle: string; app: AppId; payload?: string; alt: string }[] = [
  { id: "work", number: "01", title: "代码与产品", subtitle: "把想法做成作品", app: "projects", alt: "笔记本电脑、台灯和绿植组成的蓝色工作台" },
  { id: "pingpong", number: "02", title: "乒乓球", subtitle: "球台上的另一面", app: "notes", payload: "pingpong", alt: "树荫下的蓝色乒乓球台、球拍和长椅" },
  { id: "music", number: "03", title: "音乐", subtitle: "给日常换一个节奏", app: "music", alt: "黑胶唱机、音箱、月夜唱片和蓝色弧形座椅" },
  { id: "life", number: "04", title: "生活碎片", subtitle: "一些值得留下的日常", app: "fragments", alt: "上海街景、山湖与咖啡的照片，以及摊开的笔记本" },
];

function PingPongIcon() {
  return <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14.8 3.1c3.6 1.6 4.5 5.9 2.3 9.8-1.8 3.2-5 5.1-7.8 4.7l-3.5 4-3.1-2.7 3.8-4C5 12.6 5.6 9 7.5 6.2c2-2.9 4.7-4.1 7.3-3.1Z" /><path d="m6.1 12.7 6 4.1" /><circle cx="20" cy="19.5" r="2.2" /></svg>;
}

const dockItems = [
  { id: "overview", title: "总览", icon: Home },
  { id: "work", title: "作品", icon: Layers },
  { id: "music", title: "音乐", icon: Music2 },
  { id: "pingpong", title: "乒乓球", icon: PingPongIcon },
  { id: "life", title: "生活", icon: Coffee },
] as const;

function timeLabel(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

function MiniPlayer() {
  const { todaySong, nowPlaying, playToday, openApp, musicControls } = useOS();
  const track = nowPlaying?.track ?? todaySong;
  const [timeline, setTimeline] = useState({ currentTime: 0, duration: 0 });
  const [failedCover, setFailedCover] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => setTimeline(musicControls.current?.getProgress() ?? { currentTime: 0, duration: 0 });
    tick();
    if (!nowPlaying?.playing) return;
    const interval = window.setInterval(tick, 500);
    return () => window.clearInterval(interval);
  }, [nowPlaying?.playing, nowPlaying?.track.id, musicControls]);

  return (
    <div className="space-player" role="group" aria-label="迷你播放器" data-no-pan>
      <button className="space-player-cover" type="button" aria-label="打开音乐播放器" onClick={(event) => openApp("music", { origin: rectOf(event.currentTarget) })}>
        {track && failedCover !== track.cover ? <Image src={track.cover} alt="" width={52} height={52} unoptimized onError={() => setFailedCover(track.cover)} /> : <span className="space-cover-moon" />}
      </button>
      <div className="space-player-copy">
        <button type="button" onClick={() => openApp("music")} className="space-track-title">{track?.name ?? "喜欢的音乐"}</button>
        <span>{track?.artist ?? "点开，听一会儿"}</span>
        <div className="space-track-progress" aria-hidden="true"><i style={{ width: `${timeline.duration ? (timeline.currentTime / timeline.duration) * 100 : 0}%` }} /></div>
      </div>
      <div className="space-player-action">
        <button
          type="button"
          className="space-play-button"
          aria-label={nowPlaying?.playing ? "暂停音乐" : "播放音乐"}
          onClick={(event) => {
            if (musicControls.current) musicControls.current.toggle();
            else if (track) playToday(rectOf(event.currentTarget));
            else openApp("music");
          }}
        >
          {nowPlaying?.playing ? <Pause size={15} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
        </button>
        <span>{timeline.duration ? `${timeLabel(timeline.currentTime)} / ${timeLabel(timeline.duration)}` : "待播放"}</span>
      </div>
    </div>
  );
}

function SpaceHeader({ onOverview }: { onOverview: () => void }) {
  const { clock, weather, openApp, setSpotlightOpen, windows, minimizeApp, lock } = useOS();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    const outside = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setMenuOpen(false); brandRef.current?.focus(); }
    };
    window.addEventListener("pointerdown", outside);
    window.addEventListener("keydown", escape);
    return () => {
      window.removeEventListener("pointerdown", outside);
      window.removeEventListener("keydown", escape);
    };
  }, [menuOpen]);

  const launch = (app: AppId, payload?: string) => { setMenuOpen(false); openApp(app, { payload }); };
  return (
    <header className="space-header">
      <div className="space-brand-menu" ref={menuRef}>
        <button ref={brandRef} type="button" className="space-brand" aria-label="Mateo OS 菜单" aria-expanded={menuOpen} aria-controls="space-menu" onClick={() => setMenuOpen(!menuOpen)}>Mateo OS</button>
        {menuOpen && <div id="space-menu" className="space-menu" aria-label="Mateo OS 导航">
          <button type="button" onClick={() => { setMenuOpen(false); onOverview(); }}>回到总览 <span>⌂</span></button>
          <button type="button" onClick={() => launch("now")}>此刻</button>
          <button type="button" onClick={() => launch("notes")}>备忘录</button>
          <button type="button" onClick={() => launch("terminal")}>终端 <span>⌘ K 搜索</span></button>
          <button type="button" onClick={() => launch("llms")}>llms.txt</button>
          {windows.windows.length > 0 && <div className="space-menu-windows"><small>已打开的窗口</small>{windows.windows.map((win) => <button key={win.id} type="button" onClick={() => launch(win.id)}>{win.id === "notes" ? "备忘录" : win.id === "music" ? "音乐" : win.id === "fragments" ? "生活碎片" : win.id === "projects" ? "作品" : win.id === "now" ? "此刻" : win.id === "terminal" ? "终端" : win.id === "llms" ? "llms.txt" : "关于 Mateo"}{!win.minimized && <Check size={13} />}</button>)}</div>}
          <div className="space-menu-footer">
            <button type="button" onClick={() => { windows.windows.forEach((win) => minimizeApp(win.id)); setMenuOpen(false); }}>收起所有窗口</button>
            <button type="button" onClick={() => { setMenuOpen(false); lock(); }}>锁定屏幕</button>
          </div>
        </div>}
      </div>
      <nav className="space-status" aria-label="状态与导航">
        <button type="button" className="space-search" aria-label="Spotlight 搜索" onClick={() => setSpotlightOpen(true)}><Search size={20} strokeWidth={1.7} /></button>
        <span className="space-status-divider" />
        <span className="space-weather" aria-label={weather ? `上海 ${weather.temperature}度 ${weather.label}` : "上海天气暂未载入"}>上海 {weather ? `${weather.temperature}°` : "—"}</span>
        <span className="space-status-divider" />
        <time>{clock?.time ?? "--:--"}</time>
        <span className="space-status-divider" />
        <button type="button" className="space-about" onClick={(event) => openApp("notes", { payload: "about", origin: rectOf(event.currentTarget) })}>关于 <ArrowUpRight size={16} /></button>
      </nav>
    </header>
  );
}

export default function SpaceHome() {
  const { isMobile, openApp, windows, activeId, dispatch, dockIcons } = useOS();
  const reducedMotion = useReducedMotion();
  const [zoom, setZoom] = useState(1);
  const [fit, setFit] = useState(1);
  const viewportRef = useRef<HTMLDivElement>(null);
  const overviewRef = useRef<HTMLButtonElement | null>(null);
  const panX = useMotionValue(0);
  const panY = useMotionValue(0);
  const drag = useRef<{ x: number; y: number; originX: number; originY: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;
    const measure = () => setFit(Math.min(element.clientWidth / 1440, element.clientHeight / 900));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const overview = useCallback(() => {
    windows.windows.forEach((win) => dispatch({ type: "minimize", id: win.id }));
    setZoom(1);
    animate(panX, 0, { type: "spring", bounce: 0, duration: reducedMotion ? 0 : 0.4 });
    animate(panY, 0, { type: "spring", bounce: 0, duration: reducedMotion ? 0 : 0.4 });
    viewportRef.current?.scrollTo({ top: 0, behavior: reducedMotion ? "instant" : "smooth" });
    overviewRef.current?.focus({ preventScroll: true });
  }, [windows.windows, dispatch, panX, panY, reducedMotion]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (isMobile || event.button !== 0 || (event.target as HTMLElement).closest("[data-no-pan]")) return;
    panX.stop(); panY.stop();
    suppressClick.current = false;
    drag.current = { x: event.clientX, y: event.clientY, originX: panX.get(), originY: panY.get(), moved: false };
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = drag.current;
    if (!start) return;
    const dx = event.clientX - start.x, dy = event.clientY - start.y;
    if (!start.moved && Math.hypot(dx, dy) < 5) return;
    if (!start.moved) { start.moved = true; event.currentTarget.setPointerCapture(event.pointerId); }
    panX.set(Math.max(-360, Math.min(360, start.originX + dx / fit)));
    panY.set(Math.max(-240, Math.min(240, start.originY + dy / fit)));
  };
  const onPointerUp = () => { suppressClick.current = drag.current?.moved ?? false; drag.current = null; };
  const selected = scenes.find((scene) => scene.app === activeId)?.id ?? "overview";

  return (
    <main className="space-home">
      <SpaceHeader onOverview={overview} />
      <div ref={viewportRef} className="space-viewport" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onClickCapture={(event) => { if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false; } }}>
        <div className="space-intro"><p>一个持续生长的个人空间</p><h1><span>在上海写代码、</span><span>打乒乓球、</span><span>听歌。</span></h1></div>
        <div className="space-fit" style={isMobile ? undefined : { transform: `translate(-50%, -50%) scale(${fit})` }}>
          <motion.div className="space-world" style={isMobile ? undefined : { x: panX, y: panY, scale: zoom }}>
            <svg className="space-paths" viewBox="0 0 1440 900" aria-hidden="true"><path d="M355 402C175 429 157 490 252 514S430 580 535 704M720 390C850 370 770 280 836 288M1320 333C1430 397 1335 445 1170 477S820 534 787 605 694 739 535 704" /><circle cx="355" cy="402" r="5" /></svg>
            <div className="space-wordmark" aria-hidden="true">MATEO</div>
            {scenes.map((scene) => <section key={scene.id} className={`space-scene scene-${scene.id}`} aria-label={scene.title}>
              <button type="button" className="space-scene-art" aria-label={`进入${scene.title}`} onClick={(event) => openApp(scene.app, { payload: scene.payload, origin: rectOf(event.currentTarget) })}>
                <Image src={`/scenes/${scene.id}.webp`} alt={scene.alt} width={1536} height={1024} sizes="(max-width: 760px) 100vw, 42vw" priority={scene.id === "work" || scene.id === "pingpong"} draggable={false} />
              </button>
              <button type="button" className="space-scene-label" onClick={(event) => openApp(scene.app, { payload: scene.payload, origin: rectOf(event.currentTarget) })}>
                <span className="space-scene-heading"><span>{scene.number}</span><strong>{scene.title}</strong></span>
                <span className="space-scene-caption">{scene.subtitle} <ArrowUpRight size={15} /></span>
              </button>
              {scene.id === "life" && <button type="button" className="space-about-note" onClick={(event) => openApp("notes", { payload: "about", origin: rectOf(event.currentTarget) })}>关于我.md <ArrowUpRight size={13} /></button>}
              {scene.id === "music" && <MiniPlayer />}
            </section>)}
          </motion.div>
        </div>
      </div>
      <div className="space-explore-hint"><Hand size={18} strokeWidth={1.4} /><span>{isMobile ? "向下探索 · 点击进入" : "拖动探索 · 点击进入"}</span></div>
      <nav className="space-dock" aria-label="程序坞">
        {dockItems.map(({ id, title, icon: Icon }) => {
          const scene = scenes.find((entry) => entry.id === id);
          return <button key={id} type="button" ref={(element) => {
            if (id === "overview") { overviewRef.current = element; return; }
            if (!scene) return;
            if (element) dockIcons.current.set(scene.app, element); else dockIcons.current.delete(scene.app);
          }} className={`space-dock-item${selected === id ? " is-selected" : ""}`} aria-label={title} aria-current={selected === id ? "page" : undefined} onClick={(event) => {
            if (!scene) overview();
            else openApp(scene.app, { payload: scene.payload, origin: rectOf(event.currentTarget) });
          }}><Icon size={22} strokeWidth={1.65} /><span>{title}</span><i className={scene && windows.windows.some((win) => win.id === scene.app) ? "is-running" : ""} /></button>;
        })}
      </nav>
      <div className="space-zoom" aria-label="画布缩放">
        <button type="button" aria-label="缩小画布" disabled={zoom <= 0.8} onClick={() => setZoom((current) => Math.max(0.8, Math.round((current - 0.1) * 10) / 10))}><Minus size={15} /></button>
        <button type="button" aria-label="重置画布" onClick={overview}>{Math.round(zoom * 100)}%</button>
        <button type="button" aria-label="放大画布" disabled={zoom >= 1.4} onClick={() => setZoom((current) => Math.min(1.4, Math.round((current + 0.1) * 10) / 10))}><Plus size={15} /></button>
      </div>
    </main>
  );
}
