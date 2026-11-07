"use client";

import { useEffect, useRef } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from "motion/react";
import { apps, GITHUB_URL, type AppMeta } from "@/lib/os-apps";
import AppIcon from "./AppIcon";
import { useOS } from "./OSProvider";

const BASE = 54;
const PEAK = 84;
const REACH = 150;

/** Cosine falloff: icons swell smoothly toward the pointer, like the real Dock. */
function useMagnify(mouseX: MotionValue<number>, element: React.RefObject<HTMLElement>) {
  const reducedMotion = useReducedMotion();
  const target = useTransform(mouseX, (pointer) => {
    const bounds = element.current?.getBoundingClientRect();
    if (!bounds || !Number.isFinite(pointer) || reducedMotion) return BASE;
    const distance = Math.abs(pointer - (bounds.x + bounds.width / 2));
    if (distance > REACH) return BASE;
    return BASE + (PEAK - BASE) * (Math.cos((distance / REACH) * Math.PI) + 1) / 2;
  });
  return useSpring(target, { stiffness: 520, damping: 38, mass: 0.5 });
}

function DockApp({ app, mouseX, running }: { app: AppMeta; mouseX: MotionValue<number>; running: boolean }) {
  const { openApp, dockIcons, windows, activeId, minimizeApp, dispatch } = useOS();
  const ref = useRef<HTMLButtonElement>(null);
  const size = useMagnify(mouseX, ref);
  const lift = useMotionValue(0);
  const wasRunning = useRef(running);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const element = ref.current;
    const registry = dockIcons.current;
    if (!element) return;
    registry.set(app.id, element);
    return () => {
      registry.delete(app.id);
    };
  }, [app.id, dockIcons]);

  // Launch bounce: only when an app goes from closed to running.
  useEffect(() => {
    if (running && !wasRunning.current && !reducedMotion) {
      animate(lift, [0, -20, 0, -9, 0], { duration: 0.75, times: [0, 0.28, 0.55, 0.78, 1], ease: "easeOut" });
    }
    wasRunning.current = running;
  }, [running, lift, reducedMotion]);

  const onClick = () => {
    const window = windows.windows.find((item) => item.id === app.id);
    // Clicking the front app minimizes it, like macOS with "click to hide".
    if (window && !window.minimized && activeId === app.id) {
      minimizeApp(app.id);
      return;
    }
    if (window && !window.minimized) {
      dispatch({ type: "focus", id: app.id });
      return;
    }
    openApp(app.id);
  };

  return (
    <div className="dock-item">
      <motion.button
        ref={ref}
        type="button"
        className="dock-button"
        style={{ width: size, height: size, y: lift }}
        onClick={onClick}
        aria-label={app.name}
        whileTap={{ scale: 0.92 }}
      >
        <AppIcon icon={app.icon} swatch={app.swatch} />
      </motion.button>
      <span className="dock-tooltip" role="tooltip">{app.name}</span>
      <span className={`dock-indicator${running ? " is-running" : ""}`} aria-hidden="true" />
    </div>
  );
}

function DockLink({ mouseX }: { mouseX: MotionValue<number> }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const size = useMagnify(mouseX, ref);
  return (
    <div className="dock-item">
      <motion.a
        ref={ref}
        href={GITHUB_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="dock-button"
        style={{ width: size, height: size }}
        aria-label="GitHub"
        whileTap={{ scale: 0.92 }}
      >
        <AppIcon icon="github" swatch="night" />
      </motion.a>
      <span className="dock-tooltip" role="tooltip">GitHub</span>
      <span className="dock-indicator" aria-hidden="true" />
    </div>
  );
}

export default function Dock() {
  const { windows } = useOS();
  const mouseX = useMotionValue(Number.POSITIVE_INFINITY);
  const running = new Set(windows.windows.map((window) => window.id));

  return (
    <nav
      className="os-dock"
      aria-label="程序坞"
      onPointerMove={(event) => {
        if (event.pointerType === "mouse") mouseX.set(event.clientX);
      }}
      onPointerLeave={() => mouseX.set(Number.POSITIVE_INFINITY)}
    >
      {apps
        .filter((app) => app.inDock)
        .map((app) => (
          <DockApp key={app.id} app={app} mouseX={mouseX} running={running.has(app.id)} />
        ))}
      <span className="dock-divider" aria-hidden="true" />
      <DockLink mouseX={mouseX} />
    </nav>
  );
}
