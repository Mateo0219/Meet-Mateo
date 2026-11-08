/**
 * Mateo's world: the main island, organised around who Mateo is, and a small
 * trip to Eshan. Coordinates are world pixels; a structure's (x, y) is the
 * middle of its front edge on the ground.
 */
import type { AppId } from "./os-apps";
import { createRandom } from "./random";

export const PLAYER_RADIUS = 14;
export const WALK_SPEED = 300;
export const RIVER_HALF = 50;
export const THOUGHT_REACH = 38;
const EDGE = 46;
const BRIDGE_HALF_HEIGHT = 42;
const CELL = 24;
/** Planned paths keep a little clearance, so rounding can't pin a walker to an edge. */
const MARGIN = 6;

export type MapId = "island" | "eshan";
export type TodoId = "make" | "play" | "moments";
export interface Point { x: number; y: number }
export interface Ellipse extends Point { rx: number; ry: number }
export interface Rect { x: number; y: number; w: number; h: number }

export type StructureKind = "workshop" | "room" | "photowall" | "clocktower" | "thoughttree" | "statue" | "letters" | "airport" | "plane" | "table" | "tv" | "station" | "kuixing" | "oldhouse" | "breakfast" | "firepit" | "block";
export interface Structure { id: string; kind: StructureKind; x: number; y: number; w: number; d: number; sign?: string; tint?: number }

export type PlaceAction = { kind: "app"; app: AppId; payload?: string } | { kind: "talk" } | { kind: "travel"; to: MapId };

export interface Place extends Point {
  id: string;
  name: string;
  /** What's here, shown in the prompt. */
  hint: string;
  verb: string;
  radius: number;
  action: PlaceAction;
  speaker?: string;
  lines?: string[];
  todo?: TodoId;
}

export interface River { name: string; center: (y: number) => number }
export interface Bridge { river: number; y: number }

interface MapDefinition {
  id: MapId;
  name: string;
  width: number;
  height: number;
  spawn: Point;
  northLimit: number;
  island?: Ellipse;
  mountains?: boolean;
  rail?: { y: number; from: number; to: number };
  train?: { headX: number; cars: number };
  runway?: { y: number; from: number; to: number };
  structures: Structure[];
  places: Place[];
  rivers: River[];
  bridges: Bridge[];
  roads: Point[][];
  plazas: Ellipse[];
  courts: Rect[];
  gardens: Ellipse[];
  thoughts: (Point & { id: string })[];
  treeCount: number;
  treeSeed: number;
}

export type Tree = Point & { size: number; tone: number };

export interface GameMap extends MapDefinition {
  placeById: Record<string, Place>;
  trees: Tree[];
  isWalkable: (x: number, y: number) => boolean;
  moveWithCollision: (position: Point, dx: number, dy: number) => Point;
  routeTo: (from: Point, to: Point) => Point[];
  nearestPlace: (position: Point) => Place | null;
}

/** The island's coastline as a multiple of its ellipse, by angle. */
export const coastline = (angle: number) => 1 + 0.05 * Math.sin(3 * angle + 1) + 0.03 * Math.sin(7 * angle);

const distanceToSegment = (p: Point, a: Point, b: Point) => {
  const dx = b.x - a.x, dy = b.y - a.y;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
};

const NEIGHBOURS = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2]] as const;

function createMap(definition: MapDefinition): GameMap {
  const { width, height, island, northLimit, rivers, bridges, structures, places, roads, plazas, thoughts } = definition;
  const colliders: Rect[] = structures.map(({ x, y, w, d }) => ({ x: x - w / 2, y: y - d, w, h: d }));

  /** How far a point is from the island's centre, where 1 is the shore. */
  const shoreRatio = (x: number, y: number) => {
    if (!island) return 0;
    const dx = (x - island.x) / island.rx, dy = (y - island.y) / island.ry;
    return Math.hypot(dx, dy) / coastline(Math.atan2(dy, dx));
  };
  const onBridge = (x: number, y: number) => bridges.some((bridge) => Math.abs(y - bridge.y) <= BRIDGE_HALF_HEIGHT - PLAYER_RADIUS && Math.abs(x - rivers[bridge.river].center(bridge.y)) <= RIVER_HALF + 70);
  const inRiver = (x: number, y: number) => rivers.some((river) => Math.abs(x - river.center(y)) < RIVER_HALF + 6);
  const hitsCollider = (x: number, y: number) => colliders.some((box) => x > box.x - PLAYER_RADIUS && x < box.x + box.w + PLAYER_RADIUS && y > box.y - 6 && y < box.y + box.h + 6);

  const isWalkable = (x: number, y: number) => {
    if (x < EDGE || x > width - EDGE || y < northLimit || y > height - EDGE) return false;
    if (shoreRatio(x, y) > 0.96) return false;
    if (inRiver(x, y) && !onBridge(x, y)) return false;
    return !hitsCollider(x, y);
  };
  const isRoomy = (x: number, y: number) => isWalkable(x, y) && isWalkable(x - MARGIN, y - MARGIN) && isWalkable(x + MARGIN, y - MARGIN) && isWalkable(x - MARGIN, y + MARGIN) && isWalkable(x + MARGIN, y + MARGIN);

  // Moves axis by axis so walking into a wall slides along it.
  const moveWithCollision = (position: Point, dx: number, dy: number): Point => {
    let { x, y } = position;
    if (isWalkable(x + dx, y)) x += dx;
    if (isWalkable(x, y + dy)) y += dy;
    return { x, y };
  };

  const columns = Math.floor(width / CELL), rows = Math.floor(height / CELL);
  const cellCenter = (index: number): Point => ({ x: ((index % columns) + 0.5) * CELL, y: (Math.floor(index / columns) + 0.5) * CELL });
  let openCells: Uint8Array | null = null;
  const grid = () => {
    if (openCells) return openCells;
    openCells = new Uint8Array(columns * rows);
    for (let index = 0; index < openCells.length; index += 1) { const { x, y } = cellCenter(index); openCells[index] = isRoomy(x, y) ? 1 : 0; }
    return openCells;
  };
  const nearestOpenCell = (point: Point) => {
    const open = grid(), column = Math.floor(point.x / CELL), row = Math.floor(point.y / CELL);
    for (let radius = 0; radius < 12; radius += 1) {
      let best = -1, bestDistance = Infinity;
      for (let r = row - radius; r <= row + radius; r += 1) for (let c = column - radius; c <= column + radius; c += 1) {
        if (r < 0 || c < 0 || r >= rows || c >= columns || !open[r * columns + c]) continue;
        const center = cellCenter(r * columns + c), distance = Math.hypot(center.x - point.x, center.y - point.y);
        if (distance < bestDistance) { best = r * columns + c; bestDistance = distance; }
      }
      if (best >= 0) return best;
    }
    return -1;
  };
  const clearLine = (a: Point, b: Point) => {
    const steps = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 8);
    for (let i = 1; i < steps; i += 1) if (!isRoomy(a.x + ((b.x - a.x) * i) / steps, a.y + ((b.y - a.y) * i) / steps)) return false;
    return true;
  };

  // Shortest walk around buildings and over bridges, with the grid's zigzags pulled straight.
  const routeTo = (from: Point, to: Point): Point[] => {
    if (clearLine(from, to)) return [to];
    const open = grid(), start = nearestOpenCell(from), goal = nearestOpenCell(to);
    if (start < 0 || goal < 0) return [];
    const cost = new Float64Array(open.length).fill(Infinity), previous = new Int32Array(open.length).fill(-1), done = new Uint8Array(open.length);
    const heap: [number, number][] = [[0, start]];
    const push = (item: [number, number]) => { heap.push(item); for (let i = heap.length - 1; i > 0;) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
    const pop = () => { const top = heap[0], last = heap.pop()!; if (heap.length) { heap[0] = last; for (let i = 0; ;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
    cost[start] = 0;
    while (heap.length) {
      const [, current] = pop();
      if (done[current]) continue;
      done[current] = 1;
      if (current === goal) break;
      const column = current % columns, row = Math.floor(current / columns);
      for (const [dc, dr, weight] of NEIGHBOURS) {
        const c = column + dc, r = row + dr;
        if (c < 0 || r < 0 || c >= columns || r >= rows) continue;
        const next = r * columns + c;
        if (!open[next] || (dc && dr && (!open[row * columns + c] || !open[r * columns + column]))) continue;
        if (cost[current] + weight < cost[next]) { cost[next] = cost[current] + weight; previous[next] = current; push([cost[next] + Math.hypot(c - (goal % columns), r - Math.floor(goal / columns)), next]); }
      }
    }
    if (goal !== start && previous[goal] < 0) return [];
    const cells: Point[] = [];
    for (let index = goal; index >= 0; index = previous[index]) cells.unshift(cellCenter(index));
    cells.push(to);
    const route: Point[] = [];
    let anchor = from, i = 0;
    while (i < cells.length) {
      let far = i;
      for (let j = cells.length - 1; j > i; j -= 1) if (clearLine(anchor, cells[j])) { far = j; break; }
      route.push(cells[far]);
      anchor = cells[far];
      i = far + 1;
    }
    return route;
  };

  const nearestPlace = (position: Point) => {
    let best: Place | null = null, bestDistance = Infinity;
    for (const place of places) {
      const distance = Math.hypot(place.x - position.x, place.y - position.y);
      if (distance <= place.radius && distance < bestDistance) { best = place; bestDistance = distance; }
    }
    return best;
  };

  const nearRoad = (p: Point, gap: number) => roads.some((road) => road.slice(1).some((b, i) => distanceToSegment(p, road[i], b) < gap));
  const random = createRandom(definition.treeSeed);
  const trees: Tree[] = [];
  for (let attempt = 0; attempt < 2400 && trees.length < definition.treeCount; attempt += 1) {
    const point = { x: 60 + random() * (width - 120), y: northLimit + 20 + random() * (height - northLimit - 60) };
    const clear = isWalkable(point.x, point.y) && shoreRatio(point.x, point.y) < 0.9 && !nearRoad(point, 62)
      && !places.some((place) => Math.hypot(place.x - point.x, place.y - point.y) < 170)
      && !thoughts.some((item) => Math.hypot(item.x - point.x, item.y - point.y) < 70)
      && !trees.some((tree) => Math.hypot(tree.x - point.x, tree.y - point.y) < 105)
      && !colliders.some((box) => point.x > box.x - 50 && point.x < box.x + box.w + 50 && point.y > box.y - 10 && point.y < box.y + box.h + 70)
      && ![...plazas, ...definition.gardens].some((area) => ((point.x - area.x) / (area.rx + 50)) ** 2 + ((point.y - area.y) / (area.ry + 50)) ** 2 < 1)
      && !definition.courts.some((court) => point.x > court.x - 40 && point.x < court.x + court.w + 40 && point.y > court.y - 20 && point.y < court.y + court.h + 70)
      && !rivers.some((river) => Math.abs(point.x - river.center(point.y)) < RIVER_HALF + 30)
      && !(definition.rail && point.x < definition.rail.to + 60 && Math.abs(point.y - definition.rail.y) < 110)
      && !(definition.runway && point.x < definition.runway.to + 60 && Math.abs(point.y - definition.runway.y) < 110);
    if (clear) trees.push({ ...point, size: 0.8 + random() * 0.55, tone: Math.floor(random() * 3) });
  }

  return { ...definition, placeById: Object.fromEntries(places.map((place) => [place.id, place])), trees, isWalkable, moveWithCollision, routeTo, nearestPlace };
}

/** Steps along a route; returns the new position and the waypoints still ahead. */
export function followRoute(map: GameMap, position: Point, route: Point[], distance: number): { position: Point; route: Point[]; dx: number; dy: number } {
  if (route.length === 0) return { position, route, dx: 0, dy: 0 };
  const [target, ...rest] = route;
  const ax = target.x - position.x, ay = target.y - position.y, gap = Math.hypot(ax, ay);
  if (gap <= Math.max(distance, 8)) return { position, route: rest, dx: 0, dy: 0 };
  const dx = (ax / gap) * distance, dy = (ay / gap) * distance;
  return { position: map.moveWithCollision(position, dx, dy), route, dx, dy };
}

export const TODOS: { id: TodoId; label: string }[] = [
  { id: "make", label: "做个东西" },
  { id: "play", label: "打一局球" },
  { id: "moments", label: "看看朋友圈" },
];

const hub = { x: 1300, y: 830 };

const island = createMap({
  id: "island",
  name: "Mateo 岛",
  width: 2600,
  height: 1700,
  spawn: { x: 1120, y: 826 },
  northLimit: 120,
  island: { x: 1300, y: 860, rx: 1210, ry: 760 },
  runway: { y: 1262, from: -20, to: 720 },
  structures: [
    { id: "letters", kind: "letters", x: 1300, y: 370, w: 760, d: 40 },
    { id: "workshop", kind: "workshop", x: 1300, y: 690, w: 430, d: 90 },
    { id: "room", kind: "room", x: 640, y: 560, w: 300, d: 80 },
    { id: "photowall", kind: "photowall", x: 640, y: 960, w: 370, d: 26 },
    { id: "table", kind: "table", x: 2030, y: 720, w: 120, d: 44 },
    { id: "tv", kind: "tv", x: 2190, y: 720, w: 70, d: 30 },
    { id: "clocktower", kind: "clocktower", x: 2010, y: 1190, w: 130, d: 60 },
    { id: "statue", kind: "statue", x: 1300, y: 1040, w: 96, d: 44 },
    { id: "thoughttree", kind: "thoughttree", x: 1300, y: 1360, w: 110, d: 24 },
    { id: "plane", kind: "plane", x: 250, y: 1290, w: 340, d: 30 },
    { id: "airport", kind: "airport", x: 560, y: 1310, w: 190, d: 40 },
  ],
  places: [
    { id: "workshop", name: "Mateo 工作室", hint: "作品", verb: "进去", radius: 120, x: 1300, y: 762, action: { kind: "app", app: "projects" }, todo: "make" },
    { id: "room", name: "我的房间", hint: "关于我", verb: "推门", radius: 110, x: 640, y: 628, action: { kind: "app", app: "notes", payload: "about" } },
    { id: "photowall", name: "照片墙", hint: "朋友圈", verb: "看看", radius: 120, x: 640, y: 1024, action: { kind: "app", app: "moments" }, todo: "moments" },
    { id: "table", name: "乒乓球场", hint: "乒乓球", verb: "开打", radius: 110, x: 2030, y: 790, action: { kind: "app", app: "pingpong" }, todo: "play" },
    { id: "garden", name: "念头花园", hint: "碎片", verb: "逛逛", radius: 120, x: 1300, y: 1430, action: { kind: "app", app: "fragments" } },
    { id: "clock", name: "钟楼", hint: "此刻", verb: "看时间", radius: 110, x: 2010, y: 1256, action: { kind: "app", app: "now" } },
    { id: "statue", name: "Mateo 雕像", hint: "这是我", verb: "看看", radius: 80, x: 1300, y: 1104, action: { kind: "talk" }, speaker: "Mateo", lines: ["这是我。", "对，我给自己立了座雕像。反正这座岛是我的。"] },
    { id: "airport", name: "小机场", hint: "我从哪来", verb: "飞回峨山", radius: 100, x: 560, y: 1372, action: { kind: "travel", to: "eshan" } },
  ],
  rivers: [],
  bridges: [],
  roads: [
    [hub, { x: 1300, y: 762 }],
    [hub, { x: 950, y: 800 }, { x: 640, y: 640 }],
    [hub, { x: 950, y: 950 }, { x: 640, y: 1036 }],
    [{ x: 640, y: 1036 }, { x: 640, y: 1200 }, { x: 560, y: 1380 }],
    [hub, { x: 1650, y: 830 }, { x: 2030, y: 800 }],
    [{ x: 1480, y: 1030 }, { x: 1750, y: 1130 }, { x: 2010, y: 1268 }],
    [hub, { x: 1300, y: 1430 }],
  ],
  plazas: [{ x: 1300, y: 1030, rx: 240, ry: 150 }],
  courts: [{ x: 1870, y: 610, w: 400, h: 240 }],
  gardens: [{ x: 1300, y: 1410, rx: 340, ry: 140 }],
  thoughts: [
    { id: "t1", x: 300, y: 760 }, { id: "t2", x: 900, y: 450 }, { id: "t3", x: 1760, y: 470 },
    { id: "t4", x: 2350, y: 960 }, { id: "t5", x: 1650, y: 1000 }, { id: "t6", x: 1000, y: 1200 },
    { id: "t7", x: 1780, y: 1420 }, { id: "t8", x: 860, y: 1460 }, { id: "t9", x: 1040, y: 620 },
  ],
  treeCount: 60,
  treeSeed: 219,
});

const eshanRiver = (y: number) => 950 + 50 * Math.sin(y / 260) + 20 * Math.sin(y / 110 + 1);

const eshan = createMap({
  id: "eshan",
  name: "峨山",
  width: 1700,
  height: 1240,
  spawn: { x: 470, y: 420 },
  northLimit: 280,
  mountains: true,
  rail: { y: 205, from: -10, to: 1710 },
  train: { headX: 1040, cars: 2 },
  structures: [
    { id: "station", kind: "station", x: 470, y: 340, w: 430, d: 60 },
    { id: "breakfast", kind: "breakfast", x: 230, y: 760, w: 210, d: 56, sign: "早点 · 米线" },
    { id: "kuixing", kind: "kuixing", x: 600, y: 1010, w: 200, d: 90 },
    { id: "old-1", kind: "oldhouse", x: 350, y: 1000, w: 180, d: 66 },
    { id: "old-2", kind: "oldhouse", x: 790, y: 1030, w: 110, d: 66 },
    { id: "firepit", kind: "firepit", x: 1370, y: 640, w: 76, d: 36 },
    { id: "b-1", kind: "block", x: 1200, y: 430, w: 130, d: 46, sign: "小卖部", tint: 1 },
    { id: "b-2", kind: "block", x: 1540, y: 430, w: 130, d: 46, sign: "网吧", tint: 0 },
    { id: "b-3", kind: "block", x: 1200, y: 1040, w: 130, d: 46, sign: "烧烤", tint: 2 },
    { id: "b-4", kind: "block", x: 1540, y: 1040, w: 130, d: 46, sign: "文具", tint: 1 },
  ],
  places: [
    { id: "back", name: "回程", hint: "飞回 Mateo 岛", verb: "出发", radius: 80, x: 660, y: 410, action: { kind: "travel", to: "island" } },
    { id: "breakfast", name: "街边早点铺", hint: "峨山的味道", verb: "看看", radius: 100, x: 230, y: 826, action: { kind: "talk" }, speaker: "早点铺", lines: ["峨山的舂鸡和化念烤鹅都很有名。"] },
    { id: "kuixing", name: "魁星楼", hint: "嶍峨古镇", verb: "看看", radius: 110, x: 600, y: 1074, action: { kind: "talk" }, speaker: "魁星楼", lines: ["这是嶍峨古镇的魁星楼。"] },
    { id: "river", name: "练江边", hint: "穿城的江", verb: "看看", radius: 90, x: 850, y: 500, action: { kind: "talk" }, speaker: "练江", lines: ["猊江和练江并排穿过县城。"] },
    { id: "plaza", name: "民族团结广场", hint: "火把节", verb: "看看", radius: 120, x: 1370, y: 736, action: { kind: "talk" }, speaker: "广场", lines: ["每年火把节，这里是全城最热闹的地方。"] },
  ],
  rivers: [{ name: "练 江", center: eshanRiver }],
  bridges: [{ river: 0, y: 640 }],
  roads: [
    [{ x: 470, y: 420 }, { x: 470, y: 640 }, { x: 600, y: 1090 }],
    [{ x: 470, y: 640 }, { x: eshanRiver(640), y: 640 }, { x: 1370, y: 660 }],
    [{ x: 470, y: 420 }, { x: 660, y: 420 }],
    [{ x: 470, y: 720 }, { x: 230, y: 840 }],
  ],
  plazas: [{ x: 1370, y: 670, rx: 230, ry: 150 }],
  courts: [],
  gardens: [],
  thoughts: [],
  treeCount: 22,
  treeSeed: 1951,
});

export const maps: Record<MapId, GameMap> = { island, eshan };

export const ARRIVAL_LINES: Record<MapId, string[]> = {
  island: [],
  eshan: ["这是峨山，我长大的地方。", "现在我在北京工作，回一趟家要坐飞机。逛完从这儿回岛上。"],
};
