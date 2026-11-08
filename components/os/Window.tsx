"use client";

import { useEffect, useLayoutEffect, useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { animate, motion, useMotionValue, useReducedMotion } from "motion/react";
import type { AppMeta } from "@/lib/os-apps";
import {
  clampRect,
  rubberband,
  TITLE_BAR,
  transformFromOrigin,
  VISIBLE_GRIP,
  type Rect,
  type WindowState,
} from "@/lib/window-manager";

type Edge = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";
const edges: Edge[] = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];

// Apple's default: critically damped, ~0.4s response.
const settle = { type: "spring" as const, bounce: 0, duration: 0.42 };

interface WindowProps {
  win: WindowState;
  app: AppMeta;
  title: string;
  z: number;
  active: boolean;
  area: Rect;
  toolbar?: ReactNode;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  onCommit: (rect: Rect) => void;
  children: ReactNode;
}

export default function Window({ win, app, title, z, active, area, toolbar, onFocus, onClose, onMinimize, onToggleMaximize, onCommit, children }: WindowProps) {
  const reducedMotion = useReducedMotion();
  const frameRef = useRef<HTMLElement>(null);
  const x = useMotionValue(win.rect.x);
  const y = useMotionValue(win.rect.y);
  const width = useMotionValue(win.rect.width);
  const height = useMotionValue(win.rect.height);
  const interacting = useRef(false);
  const drag = useRef<{ offsetX: number; offsetY: number } | null>(null);
  const resize = useRef<{ edge: Edge; px: number; py: number; rect: Rect } | null>(null);

  // Retain app state/audio while excluding hidden descendants from all input.
  useLayoutEffect(() => {
    if (frameRef.current) frameRef.current.inert = win.minimized;
  }, [win.minimized]);

  // Follow committed geometry (zoom, restore, clamp) from wherever the window is now.
  useEffect(() => {
    if (interacting.current) return;
    const transition = reducedMotion ? { duration: 0 } : settle;
    const controls = [
      animate(x, win.rect.x, transition),
      animate(y, win.rect.y, transition),
      animate(width, win.rect.width, transition),
      animate(height, win.rect.height, transition),
    ];
    return () => controls.forEach((control) => control.stop());
  }, [win.rect, reducedMotion, x, y, width, height]);

  const currentRect = (): Rect => ({ x: x.get(), y: y.get(), width: width.get(), height: height.get() });

  const settleInside = () => {
    const final = clampRect(currentRect(), area);
    const transition = reducedMotion ? { duration: 0 } : settle;
    animate(x, final.x, transition);
    animate(y, final.y, transition);
    onCommit(final);
  };

  const onTitlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0 || win.maximized || (event.target as HTMLElement).closest("button, input, a, [data-no-drag]")) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    interacting.current = true;
    // Respect where the title bar was grabbed.
    drag.current = { offsetX: event.clientX - x.get(), offsetY: event.clientY - y.get() };
  };

  const onTitlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (!drag.current) return;
    const rawX = event.clientX - drag.current.offsetX;
    const rawY = event.clientY - drag.current.offsetY;
    const minX = area.x - width.get() + VISIBLE_GRIP;
    const maxX = area.x + area.width - VISIBLE_GRIP;
    const minY = area.y;
    const maxY = area.y + area.height - TITLE_BAR;
    // Resist progressively past the edges instead of stopping dead.
    const nextX = rawX < minX ? minX - rubberband(minX - rawX, area.width) : rawX > maxX ? maxX + rubberband(rawX - maxX, area.width) : rawX;
    const nextY = rawY < minY ? minY - rubberband(minY - rawY, area.height) : rawY > maxY ? maxY + rubberband(rawY - maxY, area.height) : rawY;
    x.set(nextX);
    y.set(nextY);
  };

  const onTitlePointerUp = () => {
    if (!drag.current) return;
    drag.current = null;
    interacting.current = false;
    settleInside();
  };

  const onResizeDown = (edge: Edge) => (event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    onFocus();
    interacting.current = true;
    resize.current = { edge, px: event.clientX, py: event.clientY, rect: currentRect() };
  };

  const onResizeMove = (event: ReactPointerEvent<HTMLElement>) => {
    const state = resize.current;
    if (!state) return;
    const { edge, rect } = state;
    const dx = event.clientX - state.px;
    const dy = event.clientY - state.py;
    let next = { ...rect };
    if (edge.includes("e")) next.width = Math.max(app.minSize.width, rect.width + dx);
    if (edge.includes("s")) next.height = Math.max(app.minSize.height, rect.height + dy);
    if (edge.includes("w")) {
      next.width = Math.max(app.minSize.width, rect.width - dx);
      next.x = rect.x + rect.width - next.width;
    }
    if (edge.includes("n")) {
      next.height = Math.max(app.minSize.height, rect.height - dy);
      next.y = rect.y + rect.height - next.height;
      if (next.y < area.y) {
        next.height -= area.y - next.y;
        next.y = area.y;
      }
    }
    next = { ...next, height: Math.min(next.height, area.y + area.height - next.y) };
    x.set(next.x);
    y.set(next.y);
    width.set(next.width);
    height.set(next.height);
  };

  const onResizeUp = () => {
    if (!resize.current) return;
    resize.current = null;
    interacting.current = false;
    onCommit(clampRect(currentRect(), area));
  };

  const shown = { x: 0, y: 0, scale: 1, opacity: 1 };
  const fromOrigin = { ...transformFromOrigin(win.rect, win.origin), opacity: 0 };
  const motionProps = reducedMotion
    ? { initial: { opacity: 0 }, animate: { opacity: win.minimized ? 0 : 1 }, exit: { opacity: 0 } }
    : {
        initial: fromOrigin,
        animate: win.minimized ? fromOrigin : shown,
        // Leaving is faster than arriving.
        exit: { opacity: 0, scale: 0.96, transition: { duration: 0.16, ease: [0.23, 1, 0.32, 1] as const } },
        transition: { ...settle, opacity: { duration: win.minimized ? 0.3 : 0.18 } },
      };

  return (
    <motion.section
      ref={frameRef}
      className={`os-window-frame${active ? " is-active" : ""}${win.minimized ? " is-minimized" : ""}${win.maximized ? " is-maximized" : ""}`}
      style={{ x, y, width, height, zIndex: z }}
      aria-label={app.name}
      aria-hidden={win.minimized}
      onPointerDownCapture={onFocus}
    >
      <motion.div className="os-window" style={{ transformOrigin: "0 0" }} {...motionProps}>
        <header
          className="os-titlebar"
          onPointerDown={onTitlePointerDown}
          onPointerMove={onTitlePointerMove}
          onPointerUp={onTitlePointerUp}
          onPointerCancel={onTitlePointerUp}
          onDoubleClick={(event) => {
            if (!(event.target as HTMLElement).closest("button, input, a, [data-no-drag]")) onToggleMaximize();
          }}
        >
          <div className="traffic-lights" data-no-drag>
            <button type="button" className="light light-close" onClick={onClose} aria-label={`关闭${app.name}`} />
            <button type="button" className="light light-minimize" onClick={onMinimize} aria-label={`最小化${app.name}`} />
            <button type="button" className="light light-zoom" onClick={onToggleMaximize} aria-label={win.maximized ? "还原窗口" : "放大窗口"} />
          </div>
          <span className="os-window-title">{title}</span>
          <div className="os-titlebar-tools" data-no-drag>
            {toolbar}
          </div>
        </header>
        <div className="os-window-content">{children}</div>
      </motion.div>

      {!win.minimized &&
        edges.map((edge) => (
          <span
            key={edge}
            className={`resize-handle resize-${edge}`}
            onPointerDown={onResizeDown(edge)}
            onPointerMove={onResizeMove}
            onPointerUp={onResizeUp}
            onPointerCancel={onResizeUp}
            aria-hidden="true"
          />
        ))}
    </motion.section>
  );
}
