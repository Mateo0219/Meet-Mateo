"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from "motion/react";
import { ArrowUpRight, Camera, Check, ChevronDown, Hand, Home, Layers, Minus, Plus, Search } from "lucide-react";
import { appById, type AppId } from "@/lib/os-apps";
import { rubberband } from "@/lib/window-manager";
import { rectOf, useOS } from "./OSProvider";

type SceneId = "work" | "pingpong" | "life";
interface Scene { id: SceneId; number: string; title: string; subtitle: string; app: AppId; alt: string; depth: number }
const scenes: Scene[] = [
  { id: "work", number: "01", title: "Vibe Coding", subtitle: "和 AI 一起把想法做成作品", app: "projects", alt: "笔记本电脑、台灯和绿植组成的蓝色工作台", depth: 9 },
  { id: "pingpong", number: "02", title: "乒乓球", subtitle: "来打一局吧", app: "pingpong", alt: "树荫下的蓝色乒乓球台、球拍和长椅", depth: 15 },
  { id: "life", number: "03", title: "生活碎片", subtitle: "一些值得留下的日常", app: "moments", alt: "北京街景、山湖与咖啡的照片，以及摊开的笔记本", depth: 12 },
];

function PingPongIcon({ size = 23 }: { size?: number; strokeWidth?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14.8 3.1c3.6 1.6 4.5 5.9 2.3 9.8-1.8 3.2-5 5.1-7.8 4.7l-3.5 4-3.1-2.7 3.8-4C5 12.6 5.6 9 7.5 6.2c2-2.9 4.7-4.1 7.3-3.1Z" /><path d="m6.1 12.7 6 4.1" /><circle cx="20" cy="19.5" r="2.2" /></svg>;
}

const dockItems = [
  { id: "overview", title: "总览", icon: Home },
  { id: "work", title: "作品", icon: Layers },
  { id: "pingpong", title: "乒乓球", icon: PingPongIcon },
  { id: "life", title: "生活", icon: Camera },
] as const;

const PAN_LIMIT = { x: 360, y: 240 };
const ZOOM_MIN = 0.8;
const ZOOM_MAX = 1.4;
const settle = { type: "spring" as const, bounce: 0, duration: 0.45 };
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
/** Past the edge the canvas keeps following, with growing resistance. */
const soften = (value: number, limit: number) => (Math.abs(value) <= limit ? value : Math.sign(value) * (limit + rubberband(Math.abs(value) - limit, limit * 2)));
/** Where a flick would come to rest (Apple's decelerationRate projection, snappy variant). */
const project = (velocity: number) => (velocity / 1000) * (0.99 / 0.01);

function SpaceHeader({ onOverview }: { onOverview: () => void }) {
  const { clock, weather, openApp, setSpotlightOpen, windows, minimizeApp, lock } = useOS();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mod, setMod] = useState("Ctrl");
  const menuRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const openedByKeyboard = useRef(false);

  useEffect(() => { if (/Mac|iPhone|iPad/.test(navigator.platform)) setMod("⌘"); }, []);

  useEffect(() => {
    if (!menuOpen) return;
    if (openedByKeyboard.current) panelRef.current?.querySelector("button")?.focus();
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

  const moveFocus = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const items = Array.from(event.currentTarget.querySelectorAll("button"));
    const current = items.indexOf(document.activeElement as HTMLButtonElement);
    const step = event.key === "ArrowDown" ? 1 : -1;
    items[current < 0 ? 0 : (current + step + items.length) % items.length]?.focus();
  };

  const launch = (app: AppId, payload?: string) => { setMenuOpen(false); openApp(app, { payload }); };
  return (
    <header className="space-header">
      <div className="space-brand-menu" ref={menuRef}>
        <button ref={brandRef} type="button" className="space-brand" aria-label="Mateo OS 菜单" aria-expanded={menuOpen} aria-controls="space-menu" onClick={(event) => { openedByKeyboard.current = event.detail === 0; setMenuOpen(!menuOpen); }}>Mateo OS <ChevronDown className="space-brand-chevron" size={15} strokeWidth={2.2} aria-hidden="true" /></button>
        {menuOpen && <div ref={panelRef} id="space-menu" className="space-menu" aria-label="Mateo OS 导航" onKeyDown={moveFocus}>
          <button type="button" onClick={() => { setMenuOpen(false); onOverview(); }}>回到总览</button>
          <button type="button" onClick={() => { setMenuOpen(false); setSpotlightOpen(true); }}>搜索 <span>{mod} K</span></button>
          <div className="space-menu-group">
            <button type="button" onClick={() => launch("now")}>此刻</button>
            <button type="button" onClick={() => launch("fragments")}>碎片</button>
            <button type="button" onClick={() => launch("notes")}>备忘录</button>
            <button type="button" onClick={() => launch("terminal")}>终端</button>
            <button type="button" onClick={() => launch("llms")}>llms.txt</button>
          </div>
          {windows.windows.length > 0 && <div className="space-menu-group"><small>已打开的窗口</small>{windows.windows.map((win) => <button key={win.id} type="button" onClick={() => launch(win.id)}>{appById[win.id].name}{!win.minimized && <Check size={13} aria-label="显示中" />}</button>)}</div>}
          <div className="space-menu-group">
            {windows.windows.length > 0 && <button type="button" onClick={() => { windows.windows.forEach((win) => minimizeApp(win.id)); setMenuOpen(false); }}>收起所有窗口</button>}
            <button type="button" onClick={() => { setMenuOpen(false); lock(); }}>锁定屏幕</button>
          </div>
        </div>}
      </div>
      <nav className="space-status" aria-label="状态与导航">
        <button type="button" className="space-search" aria-label="Spotlight 搜索" title={`搜索（${mod} K）`} onClick={() => setSpotlightOpen(true)}><Search size={18} strokeWidth={1.8} /></button>
        <span className="space-status-divider" />
        <span className="space-weather" aria-label={weather ? `北京 ${weather.temperature}度 ${weather.label}` : "北京天气暂未载入"} title={weather?.label}>北京 {weather ? `${weather.temperature}°` : "—"}</span>
        <span className="space-status-divider" />
        <time>{clock?.time ?? "--:--"}</time>
        <span className="space-status-divider" />
        <button type="button" className="space-about" onClick={(event) => openApp("notes", { payload: "about", origin: rectOf(event.currentTarget) })}>关于 <ArrowUpRight size={15} /></button>
      </nav>
    </header>
  );
}

function SceneCard({ scene, index, parallaxX, parallaxY }: { scene: Scene; index: number; parallaxX: MotionValue<number>; parallaxY: MotionValue<number> }) {
  const { openApp } = useOS();
  const x = useTransform(parallaxX, (value) => value * scene.depth);
  const y = useTransform(parallaxY, (value) => value * scene.depth);
  const open = (element: HTMLElement) => openApp(scene.app, { origin: rectOf(element) });

  return (
    <motion.section className={`space-scene scene-${scene.id}`} aria-label={scene.title} style={{ x, y, "--i": index } as unknown as CSSProperties}>
      <button type="button" className="space-scene-art" aria-label={`进入${scene.title}`} onClick={(event) => open(event.currentTarget)}>
        <Image src={`/scenes/${scene.id}.webp`} alt={scene.alt} width={1536} height={1024} sizes="(max-width: 760px) 100vw, 42vw" priority={scene.id === "work" || scene.id === "pingpong"} draggable={false} />
      </button>
      <button type="button" className="space-scene-label" onClick={(event) => open(event.currentTarget)}>
        <span className="space-scene-heading"><span>{scene.number}</span><strong>{scene.title}</strong></span>
        <span className="space-scene-caption">{scene.subtitle} <ArrowUpRight size={15} /></span>
      </button>
      {scene.id === "life" && <button type="button" className="space-about-note" onClick={(event) => openApp("notes", { payload: "about", origin: rectOf(event.currentTarget) })}>关于我.md <ArrowUpRight size={13} /></button>}
    </motion.section>
  );
}

export default function SpaceHome() {
  const { isMobile, openApp, windows, activeId, dispatch, dockIcons, minimizeApp } = useOS();
  const reducedMotion = useReducedMotion();
  const [zoom, setZoom] = useState(1);
  // Left unset until measured: the stylesheet computes the same fit before hydration.
  const [fit, setFit] = useState<number | null>(null);
  const fitRef = useRef(1);
  const zoomRef = useRef(1);
  const viewportRef = useRef<HTMLDivElement>(null);
  const overviewRef = useRef<HTMLButtonElement | null>(null);
  const panX = useMotionValue(0);
  const panY = useMotionValue(0);
  const scale = useMotionValue(1);
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const parallaxX = useSpring(pointerX, { stiffness: 90, damping: 22, mass: 0.6 });
  const parallaxY = useSpring(pointerY, { stiffness: 90, damping: 22, mass: 0.6 });
  const drag = useRef<{ x: number; y: number; originX: number; originY: number; moved: boolean; samples: { t: number; x: number; y: number }[] } | null>(null);
  const suppressClick = useRef(false);

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;
    const measure = () => {
      fitRef.current = Math.min(element.clientWidth / 1440, element.clientHeight / 900);
      setFit(fitRef.current);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const zoomTo = useCallback((value: number, immediate = false) => {
    const next = clamp(value, ZOOM_MIN, ZOOM_MAX);
    zoomRef.current = next;
    setZoom(Math.round(next * 100) / 100);
    if (immediate) { scale.stop(); scale.set(next); }
    else animate(scale, next, reducedMotion ? { duration: 0 } : settle);
  }, [scale, reducedMotion]);

  const resetView = useCallback(() => {
    zoomTo(1);
    const transition = reducedMotion ? { duration: 0 } : settle;
    animate(panX, 0, transition);
    animate(panY, 0, transition);
    viewportRef.current?.scrollTo({ top: 0, behavior: reducedMotion ? "instant" : "smooth" });
  }, [panX, panY, reducedMotion, zoomTo]);

  const overview = useCallback(() => {
    windows.windows.forEach((win) => dispatch({ type: "minimize", id: win.id }));
    resetView();
    overviewRef.current?.focus({ preventScroll: true });
  }, [windows.windows, dispatch, resetView]);

  // Trackpad and wheel: two-finger scroll pans, pinch (ctrl + wheel) zooms. Non-passive so the browser doesn't zoom the page.
  useEffect(() => {
    const element = viewportRef.current;
    if (!element || isMobile) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      if (event.ctrlKey || event.metaKey) { zoomTo(zoomRef.current * Math.exp(-event.deltaY * 0.01), true); return; }
      panX.stop(); panY.stop();
      panX.set(clamp(panX.get() - event.deltaX / fitRef.current, -PAN_LIMIT.x, PAN_LIMIT.x));
      panY.set(clamp(panY.get() - event.deltaY / fitRef.current, -PAN_LIMIT.y, PAN_LIMIT.y));
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, [isMobile, panX, panY, zoomTo]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (isMobile || event.button !== 0 || (event.target as HTMLElement).closest("[data-no-pan]")) return;
    panX.stop(); panY.stop();
    suppressClick.current = false;
    drag.current = { x: event.clientX, y: event.clientY, originX: panX.get(), originY: panY.get(), moved: false, samples: [] };
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = drag.current;
    if (!start) {
      if (event.pointerType === "mouse" && !reducedMotion && !isMobile) {
        pointerX.set(0.5 - event.clientX / window.innerWidth);
        pointerY.set(0.5 - event.clientY / window.innerHeight);
      }
      return;
    }
    const dx = event.clientX - start.x, dy = event.clientY - start.y;
    if (!start.moved && Math.hypot(dx, dy) < 5) return;
    if (!start.moved) { start.moved = true; event.currentTarget.setPointerCapture(event.pointerId); event.currentTarget.classList.add("is-panning"); }
    panX.set(soften(start.originX + dx / fitRef.current, PAN_LIMIT.x));
    panY.set(soften(start.originY + dy / fitRef.current, PAN_LIMIT.y));
    start.samples = [...start.samples.slice(-4), { t: event.timeStamp, x: event.clientX, y: event.clientY }];
  };
  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = drag.current;
    drag.current = null;
    suppressClick.current = start?.moved ?? false;
    if (!start?.moved) return;
    event.currentTarget.classList.remove("is-panning");
    const first = start.samples[0], last = start.samples[start.samples.length - 1];
    const elapsed = first && last ? last.t - first.t : 0;
    const paused = !last || event.timeStamp - last.t > 80;
    const velocityX = elapsed > 0 && !paused && !reducedMotion ? ((last.x - first.x) / elapsed) * 1000 / fitRef.current : 0;
    const velocityY = elapsed > 0 && !paused && !reducedMotion ? ((last.y - first.y) / elapsed) * 1000 / fitRef.current : 0;
    const transition = reducedMotion ? { duration: 0 } : { type: "spring" as const, bounce: 0, duration: 0.7 };
    animate(panX, clamp(panX.get() + project(velocityX), -PAN_LIMIT.x, PAN_LIMIT.x), { ...transition, velocity: velocityX });
    animate(panY, clamp(panY.get() + project(velocityY), -PAN_LIMIT.y, PAN_LIMIT.y), { ...transition, velocity: velocityY });
  };

  const selected = activeId ? scenes.find((scene) => scene.app === activeId)?.id ?? null : "overview";

  return (
    <main className="space-home">
      <SpaceHeader onOverview={overview} />
      <div ref={viewportRef} className="space-viewport" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onClickCapture={(event) => { if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false; } }}>
        <div className="space-intro"><p>一个持续生长的个人空间</p><h1><span>在北京 vibe coding、</span><span>打乒乓球、</span><span>听歌。</span></h1></div>
        <div className="space-fit" style={fit === null ? undefined : ({ "--fit": fit } as CSSProperties)}>
          <motion.div className="space-world" style={isMobile ? undefined : { x: panX, y: panY, scale }}>
            <svg className="space-paths" viewBox="0 0 1440 900" aria-hidden="true"><path pathLength={1} d="M355 402C175 429 157 490 252 514S430 580 535 704C640 770 760 730 830 668M720 390C850 370 770 280 836 288M1320 333C1430 397 1400 500 1290 560" /><circle cx="355" cy="402" r="5" /></svg>
            <div className="space-wordmark" aria-hidden="true">MATEO</div>
            {scenes.map((scene, index) => <SceneCard key={scene.id} scene={scene} index={index} parallaxX={parallaxX} parallaxY={parallaxY} />)}
          </motion.div>
        </div>
      </div>
      <div className="space-explore-hint"><Hand size={18} strokeWidth={1.4} /><span>拖动或滚动探索 · 点击进入</span></div>
      <nav className="space-dock" aria-label="程序坞">
        {dockItems.map(({ id, title, icon: Icon }) => {
          const scene = scenes.find((entry) => entry.id === id);
          const running = scene ? windows.windows.some((win) => win.id === scene.app) : false;
          const isSelected = selected === id;
          return <button key={id} type="button" ref={(element) => {
            if (id === "overview") { overviewRef.current = element; return; }
            if (!scene) return;
            if (element) dockIcons.current.set(scene.app, element); else dockIcons.current.delete(scene.app);
          }} className={`space-dock-item${isSelected ? " is-selected" : ""}`} aria-label={title} aria-current={isSelected ? "page" : undefined} onClick={(event) => {
            if (!scene) overview();
            else if (isSelected) minimizeApp(scene.app);
            else openApp(scene.app, { origin: rectOf(event.currentTarget) });
          }}>{isSelected && <motion.span layoutId="space-dock-pill" className="space-dock-pill" transition={{ type: "spring", bounce: 0.12, duration: 0.38 }} />}<Icon size={22} strokeWidth={1.65} /><span>{title}</span><i className={running ? "is-running" : ""} /></button>;
        })}
      </nav>
      <div className="space-zoom" role="group" aria-label="画布缩放">
        <button type="button" aria-label="缩小画布" disabled={zoom <= ZOOM_MIN} onClick={() => zoomTo(Math.round((zoomRef.current - 0.1) * 10) / 10)}><Minus size={15} /></button>
        <button type="button" aria-label="重置画布" title="回到初始视角" onClick={resetView}>{Math.round(zoom * 100)}%</button>
        <button type="button" aria-label="放大画布" disabled={zoom >= ZOOM_MAX} onClick={() => zoomTo(Math.round((zoomRef.current + 0.1) * 10) / 10)}><Plus size={15} /></button>
      </div>
    </main>
  );
}
