"use client";

import { useRef } from "react";
import { animate, AnimatePresence, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { appById, apps, type AppId } from "@/lib/os-apps";
import AppContent from "./apps/AppContent";
import AppIcon from "./AppIcon";
import { rectOf, useOS } from "./OSProvider";
import { OrbitWidget, ProfileWidget, SongWidget, WeatherWidget } from "./Widgets";

const dockApps: AppId[] = ["now", "fragments", "music", "notes"];
const gridApps = apps.filter((app) => !dockApps.includes(app.id));

/** Momentum projection from Apple's sample code (decelerationRate 0.99, snappier). */
const project = (velocity: number, rate = 0.99) => ((velocity / 1000) * rate) / (1 - rate);

export function Sheet({ id }: { id: AppId }) {
  const { windows, closeApp } = useOS();
  const reducedMotion = useReducedMotion();
  // Pixels, not "100%": the scrim is derived from this value and needs a number.
  const offscreen = typeof window === "undefined" ? 900 : window.innerHeight;
  const y = useMotionValue(reducedMotion ? 0 : offscreen);
  const sheetRef = useRef<HTMLDivElement>(null);
  const scrim = useTransform(y, [0, offscreen], [0.35, 0]);
  const windowState = windows.windows.find((window) => window.id === id);
  const app = appById[id];

  return (
    <>
      <motion.div className="ios-scrim" style={{ opacity: scrim }} exit={{ opacity: 0, transition: { duration: 0.25 } }} onClick={() => closeApp(id)} />
      <motion.div
        ref={sheetRef}
        className="ios-sheet"
        role="dialog"
        aria-label={app.name}
        style={{ y }}
        initial={reducedMotion ? { opacity: 0 } : false}
        animate={reducedMotion ? { opacity: 1 } : { y: 0 }}
        exit={reducedMotion ? { opacity: 0 } : { y: offscreen, transition: { type: "spring", bounce: 0, duration: 0.3 } }}
        transition={{ type: "spring", bounce: 0, duration: 0.42 }}
      >
        <header
          className="ios-sheet-header"
          onPointerDown={(event) => {
            if ((event.target as HTMLElement).closest("button") || reducedMotion) return;
            const sheet = sheetRef.current;
            if (!sheet) return;
            const startY = event.clientY;
            const startTime = performance.now();
            const height = sheet.offsetHeight;
            const target = event.currentTarget;
            target.setPointerCapture(event.pointerId);
            const move = (moveEvent: PointerEvent) => y.set(Math.max(0, moveEvent.clientY - startY));
            const up = (upEvent: PointerEvent) => {
              target.removeEventListener("pointermove", move);
              target.removeEventListener("pointerup", up);
              const elapsed = Math.max(16, performance.now() - startTime);
              const velocity = ((upEvent.clientY - startY) / elapsed) * 1000;
              // Decide from where the throw would land, not where the finger let go.
              if (y.get() + project(velocity) > height * 0.35) closeApp(id);
              else animate(y, 0, { type: "spring", bounce: 0.2, duration: 0.4, velocity });
            };
            target.addEventListener("pointermove", move);
            target.addEventListener("pointerup", up);
          }}
        >
          <span className="ios-grabber" aria-hidden="true" />
          <span className="ios-sheet-title">{app.name}</span>
          <button type="button" className="ios-sheet-done" onClick={() => closeApp(id)}>
            完成
          </button>
        </header>
        <div className="ios-sheet-content">
          <AppContent id={id} payload={windowState?.payload} navigationId={windowState?.navigationId ?? 0} compact />
        </div>
      </motion.div>
    </>
  );
}

export default function MobileHome() {
  const { clock, weather, activeId, windows, openApp, closeApp } = useOS();

  // Launching from the home screen starts fresh; apps opening apps stack up for "back".
  const launch = (id: AppId, element: HTMLElement) => {
    windows.windows.forEach((window) => closeApp(window.id));
    openApp(id, { origin: rectOf(element) });
  };

  const icon = (id: AppId) => {
    const app = appById[id];
    return (
      <button key={id} type="button" className="ios-app" aria-label={app.name} onClick={(event) => launch(id, event.currentTarget)}>
        <span className="ios-app-icon">
          <AppIcon icon={app.icon} swatch={app.swatch} />
        </span>
        <span className="ios-app-label">{app.name}</span>
      </button>
    );
  };

  return (
    <div className="ios">
      <div className="ios-status">
        <span>{clock?.time ?? ""}</span>
        <span>{weather ? `上海 ${weather.temperature}° ${weather.label}` : "上海"}</span>
      </div>
      <div className="ios-home">
        <ProfileWidget />
        <div className="widget-row">
          <WeatherWidget />
          <OrbitWidget />
        </div>
        <SongWidget />
        <div className="ios-grid">{gridApps.map((app) => icon(app.id))}</div>
      </div>
      <nav className="ios-dock" aria-label="程序坞">
        {dockApps.map((id) => icon(id))}
      </nav>
      <AnimatePresence>{activeId && <Sheet key={activeId} id={activeId} />}</AnimatePresence>
    </div>
  );
}
