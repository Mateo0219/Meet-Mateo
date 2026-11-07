"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import { ArrowUpRight, X } from "lucide-react";
import { animate, AnimatePresence, motion, useMotionValue, useReducedMotion } from "motion/react";
import {
  fragmentKinds,
  fragments,
  groupLayout,
  kindOrder,
  latentLayout,
  nearestFragments,
  projectFragments,
  scatterLayout,
  type Bounds,
  type Box,
  type Fragment,
  type Size,
} from "@/lib/fragments";
import { swatches } from "@/lib/poster";
import { useOS } from "../OSProvider";

type Lens = "scatter" | "latent" | "group";

const lenses: { id: Lens; label: string; note: string }[] = [
  { id: "scatter", label: "散落", note: "随便扔。拖起来甩一下，它们会带着惯性滑出去。" },
  { id: "latent", label: "隐空间", note: "每个碎片是一个 12 维标签向量，在浏览器里按余弦距离做 MDS 摊到二维；连线是最相近的三个。" },
  { id: "group", label: "归类", note: "按音乐、运动、创造、生活收拾整齐。" },
];

const projection = projectFragments(fragments);
const SCATTER_SEED = 7;

type LiveLabels = Partial<Record<NonNullable<Fragment["live"]>, string>>;

interface StickerProps {
  fragment: Fragment;
  label: string;
  box: Box | undefined;
  index: number;
  draggable: boolean;
  active: boolean;
  dimmed: boolean;
  canvasRef: RefObject<HTMLDivElement>;
  register: (id: string, element: HTMLElement | null) => void;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}

function Sticker({ fragment, label, box, index, draggable, active, dimmed, canvasRef, register, onSelect, onHover }: StickerProps) {
  const reducedMotion = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useMotionValue(0);
  const placed = useRef(false);
  const dragged = useRef(false);
  const swatch = swatches[fragmentKinds[fragment.kind].swatch];

  useEffect(() => {
    if (!box) return;
    const targetX = box.x - box.width / 2;
    const targetY = box.y - box.height / 2;
    if (!placed.current || reducedMotion) {
      x.set(targetX);
      y.set(targetY);
      rotate.set(box.rotate);
      placed.current = true;
      return;
    }
    // Animate from wherever the sticker is now, including mid-flight or just thrown.
    const spring = { type: "spring" as const, stiffness: 180, damping: 22, mass: 0.9, delay: index * 0.012 };
    const controls = [animate(x, targetX, spring), animate(y, targetY, spring), animate(rotate, box.rotate, spring)];
    return () => controls.forEach((control) => control.stop());
  }, [box, index, reducedMotion, rotate, x, y]);

  return (
    <motion.button
      ref={(element) => register(fragment.id, element)}
      type="button"
      className={`sticker sticker-${fragment.shape}${active ? " is-active" : ""}${dimmed ? " is-dimmed" : ""}${draggable ? " is-draggable" : ""}`}
      style={{ x, y, rotate, backgroundColor: swatch.bg, color: swatch.ink, visibility: box ? "visible" : "hidden" }}
      drag={draggable}
      dragConstraints={canvasRef}
      dragElastic={0.2}
      dragTransition={{ power: 0.4, timeConstant: 280, bounceStiffness: 420, bounceDamping: 24 }}
      initial={{ opacity: 0, scale: 0.4 }}
      whileInView={{ opacity: 1, scale: 1, transition: { type: "spring", stiffness: 420, damping: 16, delay: index * 0.035 } }}
      viewport={{ once: true, amount: 0.3 }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.96 }}
      whileDrag={{ scale: 1.1, zIndex: 40 }}
      onDragStart={() => {
        dragged.current = true;
      }}
      onClick={() => {
        if (dragged.current) {
          dragged.current = false;
          return;
        }
        onSelect(fragment.id);
      }}
      onPointerEnter={() => onHover(fragment.id)}
      onPointerLeave={() => onHover(null)}
      onFocus={() => onHover(fragment.id)}
      onBlur={() => onHover(null)}
    >
      {label}
    </motion.button>
  );
}

export default function FragmentsApp({ payload, navigationId }: { payload?: string; navigationId: number }) {
  const { library, todaySong, birthday, openApp } = useOS();
  const liveLabels: LiveLabels = {
    playlist: library ? `${library.total} 首喜欢的歌` : undefined,
    song: todaySong ? `♪ ${todaySong.name}` : undefined,
    birthday: birthday ? `生日 · 还有 ${birthday.daysUntilBirthday} 天` : undefined,
  };
  const canvasRef = useRef<HTMLDivElement>(null);
  const stickerRefs = useRef(new Map<string, HTMLElement>());
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [sizes, setSizes] = useState<Size[] | null>(null);
  const [lens, setLens] = useState<Lens>("scatter");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);

  // Opened from Spotlight or the terminal with a specific fragment in mind.
  useEffect(() => {
    if (payload && fragments.some((fragment) => fragment.id === payload)) setActiveId(payload);
  }, [payload, navigationId]);

  const labelFor = (fragment: Fragment) => (fragment.live && liveLabels[fragment.live]) || fragment.label;
  const labelKey = fragments.map(labelFor).join("|");

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const update = () => setBounds({ width: canvas.clientWidth, height: canvas.clientHeight, inset: canvas.clientWidth < 640 ? 10 : 20 });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  const canvasWidth = bounds?.width ?? 0;
  useLayoutEffect(() => {
    if (!canvasWidth) return;
    setSizes(
      fragments.map((fragment) => {
        const element = stickerRefs.current.get(fragment.id);
        return { id: fragment.id, width: element?.offsetWidth ?? 120, height: element?.offsetHeight ?? 44 };
      }),
    );
  }, [canvasWidth, labelKey]);

  const layouts = useMemo(() => {
    if (!bounds || !sizes) return null;
    return {
      scatter: scatterLayout(sizes, bounds, SCATTER_SEED),
      latent: latentLayout(sizes, projection, bounds),
      group: groupLayout(fragments, sizes, bounds),
    };
  }, [bounds, sizes]);

  const boxes = layouts ? (lens === "group" ? layouts.group.boxes : layouts[lens]) : [];
  const boxById = new Map(boxes.map((box) => [box.id, box]));
  const focusId = hoverId ?? activeId;
  const neighbors = focusId ? nearestFragments(fragments, focusId, 3) : [];
  const neighborIds = new Set(neighbors.map((item) => item.id));
  const focusBox = focusId ? boxById.get(focusId) : undefined;
  const activeFragment = fragments.find((item) => item.id === activeId) ?? null;
  const activeNeighbors = activeId ? nearestFragments(fragments, activeId, 3) : [];
  const currentLens = lenses.find((item) => item.id === lens) ?? lenses[0];

  // Median, not mean: bridge fragments sit between groups and would drag the label off its cluster.
  const median = (values: number[]) => {
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)] ?? 0;
  };
  const clusters = lens === "latent" && layouts
    ? kindOrder.map((kind) => {
        const members = layouts.latent.filter((box) => fragments.find((item) => item.id === box.id)?.kind === kind);
        return { kind, x: median(members.map((box) => box.x)), y: median(members.map((box) => box.y)) };
      })
    : [];

  const register = (id: string, element: HTMLElement | null) => {
    if (element) stickerRefs.current.set(id, element);
    else stickerRefs.current.delete(id);
  };

  return (
    <div className="fragments-app">
      <div className="fragments-toolbar">
        <div className="lens-switch" role="group" aria-label="整理方式">
          {lenses.map((item) => (
            <button
              type="button"
              key={item.id}
              className={lens === item.id ? "is-active" : undefined}
              aria-pressed={lens === item.id}
              onClick={() => setLens(item.id)}
            >
              {lens === item.id && <motion.span layoutId="lens-indicator" className="lens-indicator" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
              {item.label}
            </button>
          ))}
        </div>
        <span className="fragments-count">{fragments.length} 个碎片 · 点一张看看它和谁离得近</span>
      </div>

      <div ref={canvasRef} className={`fragment-canvas lens-${lens}`}>
          {clusters.map((cluster) => (
            <motion.span
              key={cluster.kind}
              className="cluster-label"
              style={{ left: cluster.x, top: cluster.y, color: swatches[fragmentKinds[cluster.kind].swatch].bg }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              aria-hidden="true"
            >
              {fragmentKinds[cluster.kind].label}
            </motion.span>
          ))}

          {lens === "group" &&
            layouts?.group.regions.map((region) => (
              <motion.span
                key={region.kind}
                className="group-label"
                style={{ left: region.x, top: region.y }}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <i style={{ backgroundColor: swatches[fragmentKinds[region.kind].swatch].bg }} />
                {fragmentKinds[region.kind].label}
                <small>{fragments.filter((item) => item.kind === region.kind).length}</small>
              </motion.span>
            ))}

          {lens === "latent" && focusBox && (
            <svg className="neighbor-lines" aria-hidden="true">
              {neighbors.map((neighbor) => {
                const target = boxById.get(neighbor.id);
                if (!target) return null;
                return (
                  <motion.line
                    key={`${focusId}-${neighbor.id}`}
                    x1={focusBox.x}
                    y1={focusBox.y}
                    x2={target.x}
                    y2={target.y}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                  />
                );
              })}
            </svg>
          )}

          {fragments.map((fragment, index) => (
            <Sticker
              key={fragment.id}
              fragment={fragment}
              label={labelFor(fragment)}
              box={boxById.get(fragment.id)}
              index={index}
              draggable={lens === "scatter"}
              active={activeId === fragment.id}
              dimmed={lens === "latent" && Boolean(focusId) && focusId !== fragment.id && !neighborIds.has(fragment.id)}
              canvasRef={canvasRef}
              register={register}
              onSelect={(id) => setActiveId((current) => (current === id ? null : id))}
              onHover={setHoverId}
            />
          ))}

          <AnimatePresence>
            {activeFragment && (
              <motion.aside
                key={activeFragment.id}
                className="fragment-detail"
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              >
                <div className="fragment-detail-top">
                  <span
                    className="kind-chip"
                    style={{
                      backgroundColor: swatches[fragmentKinds[activeFragment.kind].swatch].bg,
                      color: swatches[fragmentKinds[activeFragment.kind].swatch].ink,
                    }}
                  >
                    {fragmentKinds[activeFragment.kind].label}
                  </span>
                  <button type="button" className="detail-close" onClick={() => setActiveId(null)} aria-label="关闭">
                    <X size={16} aria-hidden="true" />
                  </button>
                </div>
                <strong>{labelFor(activeFragment)}</strong>
                <p>{activeFragment.detail}</p>
                <div className="detail-near">
                  <span>离得最近</span>
                  {activeNeighbors.map((neighbor) => (
                    <button type="button" key={neighbor.id} onClick={() => setActiveId(neighbor.id)}>
                      {labelFor(neighbor)}
                    </button>
                  ))}
                </div>
                {activeFragment.opens && (
                  <button type="button" className="detail-action" onClick={() => activeFragment.opens && openApp(activeFragment.opens.app, { payload: activeFragment.opens.payload })}>
                    {activeFragment.action} <ArrowUpRight size={15} aria-hidden="true" />
                  </button>
                )}
                {activeFragment.href && (
                  <a href={activeFragment.href} className="detail-action" target="_blank" rel="noopener noreferrer">
                    {activeFragment.action} <ArrowUpRight size={15} aria-hidden="true" />
                  </a>
                )}
              </motion.aside>
            )}
          </AnimatePresence>
      </div>
      <div className="canvas-caption">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={lens}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
            >
              {currentLens.note}
            </motion.p>
          </AnimatePresence>
          <span>{fragments.length} 个碎片 · 4 类 · 12 维</span>
      </div>
    </div>
  );
}
