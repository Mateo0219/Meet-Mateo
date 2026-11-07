import type { AppId } from "./os-apps";
import type { SwatchName } from "./poster";
import { createRandom } from "./random";

/** The 12 hand-labelled dimensions every fragment is scored on. */
export const facets = ["音乐", "运动", "创造", "生活", "节奏", "空间", "团队", "情绪", "专注", "迭代", "判断", "好奇"] as const;
export type Facet = (typeof facets)[number];

export type FragmentKind = "music" | "sport" | "make" | "life";

export const fragmentKinds: Record<FragmentKind, { label: string; swatch: SwatchName }> = {
  music: { label: "音乐", swatch: "pink" },
  sport: { label: "运动", swatch: "lime" },
  make: { label: "创造", swatch: "blue" },
  life: { label: "生活", swatch: "orange" },
};

export const kindOrder: FragmentKind[] = ["music", "sport", "make", "life"];

export interface Fragment {
  id: string;
  kind: FragmentKind;
  label: string;
  detail: string;
  shape: "pill" | "round" | "card";
  tags: Partial<Record<Facet, number>>;
  /** External link. */
  href?: string;
  /** App to open inside Mateo OS. */
  opens?: { app: AppId; payload?: string };
  action?: string;
  /** Labels filled in from live data at render time. */
  live?: "playlist" | "song" | "birthday";
}

export const fragments: Fragment[] = [
  { id: "playlist", kind: "music", label: "喜欢的音乐", detail: "网易云里一直在加的歌单，这个网站的播放器就从这里读歌。", shape: "round", tags: { 音乐: 1, 情绪: 0.6 }, opens: { app: "music" }, action: "去听", live: "playlist" },
  { id: "today-song", kind: "music", label: "今天抽到的歌", detail: "首页海报每次生成时，从歌单里抽一首。", shape: "pill", tags: { 音乐: 1, 情绪: 0.8, 好奇: 0.2 }, opens: { app: "music" }, action: "去听", live: "song" },
  { id: "rhythm-focus", kind: "music", label: "用节奏调节注意力", detail: "写代码的时候，歌的节奏决定了我能专注多久。", shape: "pill", tags: { 音乐: 1, 节奏: 0.8, 专注: 0.7, 创造: 0.25 } },
  { id: "mood-archive", kind: "music", label: "保存每段时间的情绪", detail: "回头听某首歌，会想起当时在做什么、在想什么。", shape: "card", tags: { 音乐: 0.9, 情绪: 1 } },

  { id: "midfield", kind: "sport", label: "中场", detail: "我在场上的位置。要看全局，也要接得住球。", shape: "round", tags: { 运动: 1, 空间: 0.8, 团队: 0.7 }, opens: { app: "notes", payload: "football" }, action: "读足球笔记" },
  { id: "see-space", kind: "sport", label: "先看空间，再决定动作", detail: "好的跑位往往发生在拿球之前。", shape: "card", tags: { 运动: 0.8, 空间: 1, 判断: 0.8, 创造: 0.3 }, opens: { app: "notes", payload: "football" }, action: "读足球笔记" },
  { id: "trust", kind: "sport", label: "相信队友", detail: "一次回追、一脚传球、一次主动补位。信任在球场上从来不是抽象词。", shape: "pill", tags: { 运动: 0.8, 团队: 1, 情绪: 0.3 } },
  { id: "stay-rhythm", kind: "sport", label: "留在节奏里", detail: "比分会变，体力会掉。真正稳定的是注意力。", shape: "pill", tags: { 运动: 0.7, 节奏: 1, 专注: 0.6 } },
  { id: "keep-running", kind: "sport", label: "失误了，下一次继续跑", detail: "有失误也没关系，下一次继续跑。", shape: "card", tags: { 运动: 0.7, 迭代: 0.9, 情绪: 0.3 } },
  { id: "pingpong", kind: "sport", label: "乒乓 · 旋转", detail: "旋转很快，注意力要更快。", shape: "pill", tags: { 运动: 1, 专注: 0.9, 节奏: 0.6 } },

  { id: "meet-mateo", kind: "make", label: "Meet-Mateo", detail: "就是你正在看的这个网站，一直在改。", shape: "pill", tags: { 创造: 1, 迭代: 0.6, 好奇: 0.4 }, href: "https://github.com/Mateo0219/Meet-Mateo", action: "看源码" },
  { id: "blur-to-ui", kind: "make", label: "把模糊，变成界面", detail: "把还说不清的念头拆成结构、交互和可以被真实使用的产品。", shape: "card", tags: { 创造: 1, 判断: 0.7, 好奇: 0.3 } },
  { id: "touchable", kind: "make", label: "可触摸的界面", detail: "把想法尽快变成能点、能拖、能用的东西。", shape: "pill", tags: { 创造: 1, 空间: 0.35, 迭代: 0.3 } },
  { id: "not-final", kind: "make", label: "第一版不是结论", detail: "像判断下一次跑位一样，让东西持续接近它该有的样子。", shape: "pill", tags: { 创造: 0.7, 迭代: 1, 判断: 0.4, 运动: 0.15 } },
  { id: "feel-first", kind: "make", label: "先感受，再定义", detail: "音乐、球场、街道与日常都是输入。先把注意力放进去，答案才开始成形。", shape: "card", tags: { 创造: 0.5, 情绪: 0.6, 判断: 0.7, 好奇: 0.4 } },

  { id: "shanghai", kind: "life", label: "上海", detail: "现在生活的城市。首页的时间和天气都来自这里。", shape: "round", tags: { 生活: 1, 空间: 0.4 } },
  { id: "birthday", kind: "life", label: "生日轨道", detail: "离下一次生日还有多久，每一次绕行都算数。", shape: "pill", tags: { 生活: 1, 节奏: 0.4 }, live: "birthday" },
  { id: "slow", kind: "life", label: "慢慢来", detail: "不赶时间。", shape: "pill", tags: { 生活: 0.8, 节奏: 0.6 } },
  { id: "curious", kind: "life", label: "保持好奇", detail: "永远保留一个没有被答案填满的位置。", shape: "round", tags: { 好奇: 1, 生活: 0.5, 创造: 0.3 } },
  { id: "archive", kind: "life", label: "记录 · 暂时是空的", detail: "等遇到想留下来的照片和文字，再从这里开始更新。", shape: "pill", tags: { 生活: 0.8, 情绪: 0.25, 好奇: 0.3 }, opens: { app: "notes", payload: "moments" }, action: "打开记录" },
];

function toVector(fragment: Fragment): number[] {
  const raw = facets.map((facet) => fragment.tags[facet] ?? 0);
  const length = Math.hypot(...raw) || 1;
  return raw.map((value) => value / length);
}

const dot = (a: readonly number[], b: readonly number[]) => a.reduce((sum, value, index) => sum + value * b[index], 0);

function principalComponent(matrix: number[][], iterations = 200): { vector: number[]; value: number } {
  const size = matrix.length;
  let vector = Array.from({ length: size }, (_, index) => 1 / (index + 1));
  for (let step = 0; step < iterations; step += 1) {
    const next = matrix.map((row) => dot(row, vector));
    const length = Math.hypot(...next) || 1;
    vector = next.map((value) => value / length);
  }
  // Eigenvectors have no inherent sign; pin it so the map never flips.
  const anchor = vector.reduce((best, value) => (Math.abs(value) > Math.abs(best) ? value : best), 0);
  if (anchor < 0) vector = vector.map((value) => -value);
  const value = dot(vector, matrix.map((row) => dot(row, vector)));
  return { vector, value };
}

export interface ProjectedPoint {
  id: string;
  x: number;
  y: number;
}

/** PCA of the cosine-normalised facet vectors onto two axes (unscaled). */
function principalCoordinates(vectors: readonly number[][]): number[][] {
  const dimensions = facets.length;
  const mean = Array.from({ length: dimensions }, (_, column) => vectors.reduce((sum, row) => sum + row[column], 0) / vectors.length);
  const centered = vectors.map((row) => row.map((value, column) => value - mean[column]));
  const covariance = Array.from({ length: dimensions }, (_, i) =>
    Array.from({ length: dimensions }, (_, j) => centered.reduce((sum, row) => sum + row[i] * row[j], 0) / centered.length),
  );

  const first = principalComponent(covariance);
  const deflated = covariance.map((row, i) => row.map((value, j) => value - first.value * first.vector[i] * first.vector[j]));
  const second = principalComponent(deflated);

  return centered.map((row) => [dot(row, first.vector), dot(row, second.vector)]);
}

/**
 * Metric MDS (SMACOF) on cosine distance, started from PCA. A linear projection
 * collapses near-orthogonal groups onto each other; MDS keeps them apart while
 * cross-tagged fragments settle between the groups they share.
 */
function multidimensionalScaling(vectors: readonly number[][], iterations = 300): number[][] {
  const count = vectors.length;
  const target = vectors.map((a) => vectors.map((b) => Math.max(0, 1 - dot(a, b))));
  let points = principalCoordinates(vectors);

  for (let step = 0; step < iterations; step += 1) {
    points = points.map((point, i) => {
      let x = 0;
      let y = 0;
      for (let j = 0; j < count; j += 1) {
        if (i === j) continue;
        const distance = Math.hypot(point[0] - points[j][0], point[1] - points[j][1]) || 1e-9;
        const ratio = target[i][j] / distance;
        x += ratio * (point[0] - points[j][0]);
        y += ratio * (point[1] - points[j][1]);
      }
      return [x / count, y / count];
    });
  }
  return points;
}

/** 2D semantic map of the fragments, scaled to 0–1 on each axis. */
export function projectFragments(items: readonly Fragment[]): ProjectedPoint[] {
  const raw = multidimensionalScaling(items.map(toVector));
  const normalise = (axis: 0 | 1) => {
    const values = raw.map((point) => point[axis]);
    const min = Math.min(...values);
    const span = Math.max(...values) - min || 1;
    return values.map((value) => (value - min) / span);
  };
  const xs = normalise(0);
  const ys = normalise(1);
  return items.map((item, index) => ({ id: item.id, x: xs[index], y: ys[index] }));
}

export function nearestFragments(items: readonly Fragment[], id: string, count = 3): Fragment[] {
  const source = items.find((item) => item.id === id);
  if (!source) return [];
  const sourceVector = toVector(source);
  return items
    .filter((item) => item.id !== id)
    .map((item) => ({ item, score: dot(sourceVector, toVector(item)) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map(({ item }) => item);
}

export interface Box {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotate: number;
}

export interface Bounds {
  width: number;
  height: number;
  inset: number;
}

function clampBox(box: Box, bounds: Bounds): Box {
  const halfWidth = box.width / 2;
  const halfHeight = box.height / 2;
  return {
    ...box,
    x: Math.min(Math.max(box.x, bounds.inset + halfWidth), bounds.width - bounds.inset - halfWidth),
    y: Math.min(Math.max(box.y, bounds.inset + halfHeight), bounds.height - bounds.inset - halfHeight),
  };
}

/** Push overlapping boxes apart along their shallowest axis until they settle. */
export function relaxBoxes(input: readonly Box[], bounds: Bounds, gap = 10, iterations = 80): Box[] {
  const boxes = input.map((box) => clampBox(box, bounds));
  for (let step = 0; step < iterations; step += 1) {
    let moved = false;
    for (let i = 0; i < boxes.length; i += 1) {
      for (let j = i + 1; j < boxes.length; j += 1) {
        const a = boxes[i];
        const b = boxes[j];
        const overlapX = (a.width + b.width) / 2 + gap - Math.abs(a.x - b.x);
        const overlapY = (a.height + b.height) / 2 + gap - Math.abs(a.y - b.y);
        if (overlapX <= 0 || overlapY <= 0) continue;
        moved = true;
        if (overlapX < overlapY) {
          const push = (overlapX / 2) * (a.x <= b.x ? -1 : 1);
          boxes[i] = { ...a, x: a.x + push };
          boxes[j] = { ...b, x: b.x - push };
        } else {
          const push = (overlapY / 2) * (a.y <= b.y ? -1 : 1);
          boxes[i] = { ...a, y: a.y + push };
          boxes[j] = { ...b, y: b.y - push };
        }
      }
    }
    for (let index = 0; index < boxes.length; index += 1) boxes[index] = clampBox(boxes[index], bounds);
    if (!moved) break;
  }
  return boxes;
}

export interface Size {
  id: string;
  width: number;
  height: number;
}

export function scatterLayout(sizes: readonly Size[], bounds: Bounds, seed: number): Box[] {
  const random = createRandom(seed);
  const boxes = sizes.map((size) => ({
    ...size,
    x: bounds.inset + random() * (bounds.width - bounds.inset * 2),
    y: bounds.inset + random() * (bounds.height - bounds.inset * 2),
    rotate: (random() - 0.5) * 26,
  }));
  // A pile, not a grid: allow slight overlap so it still feels thrown.
  return relaxBoxes(boxes, bounds, -6, 40);
}

/**
 * Blend each axis with its rank so the map fills the canvas. Order along both
 * axes is preserved; only the spacing is evened out for display.
 */
export function spreadPoints(points: readonly ProjectedPoint[], amount = 0.45): ProjectedPoint[] {
  const rank = (axis: "x" | "y") => {
    const order = [...points].sort((a, b) => a[axis] - b[axis]);
    return new Map(order.map((point, index) => [point.id, points.length > 1 ? index / (points.length - 1) : 0.5]));
  };
  const rankX = rank("x");
  const rankY = rank("y");
  return points.map((point) => ({
    id: point.id,
    x: point.x * (1 - amount) + (rankX.get(point.id) ?? point.x) * amount,
    y: point.y * (1 - amount) + (rankY.get(point.id) ?? point.y) * amount,
  }));
}

export function latentLayout(sizes: readonly Size[], points: readonly ProjectedPoint[], bounds: Bounds): Box[] {
  const byId = new Map(spreadPoints(points).map((point) => [point.id, point]));
  const inner = { x: bounds.inset + 60, y: bounds.inset + 40 };
  const span = { x: bounds.width - inner.x * 2, y: bounds.height - inner.y * 2 };
  const boxes = sizes.map((size) => {
    const point = byId.get(size.id) ?? { x: 0.5, y: 0.5 };
    return { ...size, x: inner.x + point.x * span.x, y: inner.y + point.y * span.y, rotate: 0 };
  });
  return relaxBoxes(boxes, bounds, 8, 120);
}

export interface GroupRegion {
  kind: FragmentKind;
  x: number;
  y: number;
  width: number;
}

export function groupLayout(items: readonly Fragment[], sizes: readonly Size[], bounds: Bounds): { boxes: Box[]; regions: GroupRegion[] } {
  const columns = bounds.width < 640 ? 2 : 4;
  const cellWidth = (bounds.width - bounds.inset * 2) / columns;
  const sizeById = new Map(sizes.map((size) => [size.id, size]));
  const gap = 10;
  const headerHeight = 44;
  const rowGap = 28;

  // Flow each group inside its column, relative to the top of its row.
  const cells = kindOrder.map((kind, index) => {
    const left = bounds.inset + (index % columns) * cellWidth;
    const boxes: Box[] = [];
    let cursorX = left + 12;
    let cursorY = headerHeight;
    let lineHeight = 0;
    for (const item of items.filter((fragment) => fragment.kind === kind)) {
      const size = sizeById.get(item.id);
      if (!size) continue;
      if (cursorX + size.width > left + cellWidth - 12 && cursorX > left + 12) {
        cursorX = left + 12;
        cursorY += lineHeight + gap;
        lineHeight = 0;
      }
      boxes.push({ ...size, x: cursorX + size.width / 2, y: cursorY + size.height / 2, rotate: 0 });
      cursorX += size.width + gap;
      lineHeight = Math.max(lineHeight, size.height);
    }
    return { kind, left, row: Math.floor(index / columns), boxes, height: cursorY + lineHeight };
  });

  // Stack rows by their real height, then centre the whole block in the canvas.
  const rowCount = Math.ceil(kindOrder.length / columns);
  const rowHeights = Array.from({ length: rowCount }, (_, row) => Math.max(...cells.filter((cell) => cell.row === row).map((cell) => cell.height)));
  const total = rowHeights.reduce((sum, height) => sum + height, 0) + rowGap * (rowCount - 1);
  const start = bounds.inset + Math.max(0, (bounds.height - bounds.inset * 2 - total) / 2);
  const rowTops = rowHeights.map((_, row) => start + rowHeights.slice(0, row).reduce((sum, height) => sum + height + rowGap, 0));

  const boxes = cells.flatMap((cell) => cell.boxes.map((box) => ({ ...box, y: box.y + rowTops[cell.row] })));
  const regions = cells.map((cell) => ({ kind: cell.kind, x: cell.left + 12, y: rowTops[cell.row] + 8, width: cellWidth - 24 }));
  return { boxes, regions };
}
