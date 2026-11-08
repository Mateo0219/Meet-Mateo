/** Everything in the world is drawn by these functions in a loose, pencil-and-wash style. */
import { createRandom } from "@/lib/random";
import { coastline, RIVER_HALF, type Bridge, type Ellipse, type GameMap, type Point, type Rect, type Structure } from "@/lib/world";

type Ctx = CanvasRenderingContext2D;
type Random = () => number;

export const INK = "#3b3029";
const PAPER = "#f1e6d2";
const WALL = ["#f4eee2", "#ece0cb", "#e9eef0"];
const TILE = "#6d7078";
const RED = "#b5452f";
const COBALT = "#2f4dc9";
const CONCRETE = "#b9b4a8";
const WOOD = "#a9744a";
export const RENDER_SCALE = 1.5;

export interface Sprite { canvas: HTMLCanvasElement; x: number; y: number; sortY: number; width: number; height: number; }

function sketch(ctx: Ctx, points: Point[], closed: boolean, r: Random, wobble = 1.3) {
  const path = closed ? [...points, points[0]] : points;
  ctx.beginPath();
  path.forEach((point, index) => {
    if (index === 0) { ctx.moveTo(point.x + (r() - 0.5) * wobble, point.y + (r() - 0.5) * wobble); return; }
    const from = path[index - 1];
    const steps = Math.max(1, Math.round(Math.hypot(point.x - from.x, point.y - from.y) / 26));
    for (let step = 1; step <= steps; step += 1) {
      const t = step / steps;
      ctx.lineTo(from.x + (point.x - from.x) * t + (r() - 0.5) * wobble, from.y + (point.y - from.y) * t + (r() - 0.5) * wobble);
    }
  });
}

function shape(ctx: Ctx, points: Point[], fill: string | null, r: Random, lineWidth = 2, wobble = 1.3) {
  if (fill) {
    sketch(ctx, points, true, r, wobble * 0.6);
    ctx.fillStyle = fill;
    ctx.fill();
  }
  ctx.strokeStyle = INK;
  ctx.lineCap = ctx.lineJoin = "round";
  ctx.lineWidth = lineWidth;
  sketch(ctx, points, true, r, wobble);
  ctx.stroke();
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = lineWidth * 0.6;
  sketch(ctx, points, true, r, wobble * 1.7);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

const box = (x: number, y: number, w: number, h: number): Point[] => [{ x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h }];

function stroke(ctx: Ctx, points: Point[], r: Random, color = INK, width = 1.6, wobble = 1) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = ctx.lineJoin = "round";
  sketch(ctx, points, false, r, wobble);
  ctx.stroke();
}

/** Diagonal pencil shading inside the current path area. */
function hatch(ctx: Ctx, x: number, y: number, w: number, h: number, r: Random, color: string, gap = 9) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  for (let offset = -h; offset < w; offset += gap + r() * 3) {
    ctx.beginPath();
    ctx.moveTo(x + offset, y + h + 2);
    ctx.lineTo(x + offset + h + (r() - 0.5) * 8, y - 2);
    ctx.stroke();
  }
  ctx.restore();
}

function curve(a: Point, control: Point, b: Point, steps = 10): Point[] {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps, u = 1 - t;
    return { x: u * u * a.x + 2 * u * t * control.x + t * t * b.x, y: u * u * a.y + 2 * u * t * control.y + t * t * b.y };
  });
}

/** A tiled roof with upturned eaves; the y given is where it meets the wall. */
function tiledRoof(ctx: Ctx, cx: number, y: number, width: number, height: number, r: Random, color = TILE) {
  const half = width / 2, top = y - height, inner = half * 0.62;
  const left = curve({ x: cx - inner, y: top }, { x: cx - half * 0.86, y: y - height * 0.15 }, { x: cx - half - 10, y: y - height * 0.3 });
  const right = curve({ x: cx + half + 10, y: y - height * 0.3 }, { x: cx + half * 0.86, y: y - height * 0.15 }, { x: cx + inner, y: top });
  const eave = curve({ x: cx - half - 10, y: y - height * 0.3 }, { x: cx, y: y + height * 0.28 }, { x: cx + half + 10, y: y - height * 0.3 }, 14);
  shape(ctx, [...left, ...eave.slice(1), ...right.slice(1)], color, r, 2);
  for (let i = -6; i <= 6; i += 1) {
    const t = i / 6;
    stroke(ctx, [{ x: cx + inner * t, y: top + 2 }, { x: cx + (half + 2) * t, y: y - height * 0.12 + (1 - t * t) * height * 0.22 }], r, "rgba(30,28,36,0.42)", 1, 0.8);
  }
  stroke(ctx, [{ x: cx - inner - 6, y: top }, { x: cx + inner + 6, y: top }], r, INK, 3.4, 0.8);
}

function windows(ctx: Ctx, x: number, y: number, w: number, h: number, columns: number, rows: number, r: Random, color = "#7f9fb4") {
  const cellW = w / columns, cellH = h / rows;
  for (let row = 0; row < rows; row += 1) for (let column = 0; column < columns; column += 1) {
    shape(ctx, box(x + column * cellW + cellW * 0.2, y + row * cellH + cellH * 0.18, cellW * 0.6, cellH * 0.62), color, r, 1.3, 0.7);
  }
}

function signboard(ctx: Ctx, cx: number, y: number, width: number, text: string, r: Random, color = RED) {
  shape(ctx, box(cx - width / 2, y, width, 24), color, r, 1.6, 0.7);
  ctx.fillStyle = "#fff7e6";
  ctx.font = '700 15px "STKaiti","KaiTi","Kaiti SC",serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, cx, y + 13);
}

function tiledWall(ctx: Ctx, x: number, y: number, w: number, h: number, r: Random) {
  ctx.strokeStyle = "rgba(90,80,70,0.12)";
  ctx.lineWidth = 1;
  for (let line = y + 12; line < y + h; line += 12) { ctx.beginPath(); ctx.moveTo(x + 2, line + (r() - 0.5)); ctx.lineTo(x + w - 2, line + (r() - 0.5)); ctx.stroke(); }
}

function groundShadow(ctx: Ctx, w: number, h = 16) {
  ctx.fillStyle = "rgba(70,55,40,0.22)";
  ctx.beginPath();
  ctx.ellipse(6, -2, w / 2 + 12, h, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawBlock(ctx: Ctx, s: Structure, r: Random) {
  const w = s.w, floors = 2 + (s.tint ?? 0) % 2, h = 56 * floors + 40, depth = 16, x = -w / 2;
  groundShadow(ctx, w);
  shape(ctx, [{ x: w / 2, y: 0 }, { x: w / 2 + depth, y: -10 }, { x: w / 2 + depth, y: -h - 10 }, { x: w / 2, y: -h }], "#c9bda8", r);
  shape(ctx, box(x, -h, w, h), WALL[s.tint ?? 0], r);
  tiledWall(ctx, x, -h, w, h - 40, r);
  shape(ctx, [{ x, y: -h }, { x: w / 2, y: -h }, { x: w / 2 + depth, y: -h - 10 }, { x: x + depth, y: -h - 10 }], "#d9cdb8", r);
  windows(ctx, x + 10, -h + 8, w - 20, h - 58, 3, floors, r);
  signboard(ctx, 0, -46, w - 18, s.sign ?? "", r, ["#b5452f", "#2f4dc9", "#3f7d5a"][s.tint ?? 0]);
  shape(ctx, box(-18, -22, 36, 22), "#5d5a57", r, 1.6, 0.6);
  shape(ctx, box(x + w * 0.62, -h - 34, 30, 24), COBALT, r, 1.6, 0.7);
  stroke(ctx, [{ x: x + w * 0.62 + 6, y: -h - 10 }, { x: x + w * 0.62 + 6, y: -h }], r);
  stroke(ctx, [{ x: x + w * 0.62 + 24, y: -h - 10 }, { x: x + w * 0.62 + 24, y: -h }], r);
}

function drawOldHouse(ctx: Ctx, s: Structure, r: Random) {
  const w = s.w;
  groundShadow(ctx, w);
  shape(ctx, box(-w / 2, -70, w, 70), "#d9c7a6", r);
  hatch(ctx, -w / 2, -70, w, 70, r, "rgba(120,90,50,0.12)", 12);
  for (let i = 0; i < 3; i += 1) shape(ctx, box(-w / 2 + 16 + i * (w - 32) / 3, -54, (w - 32) / 3 - 12, 40), "#7c5a3e", r, 1.4, 0.6);
  tiledRoof(ctx, 0, -66, w, 46, r);
}

function drawStation(ctx: Ctx, s: Structure, r: Random) {
  const w = s.w, h = 120;
  groundShadow(ctx, w, 20);
  shape(ctx, box(-w / 2, -h, w, h), "#eef0ee", r, 2.2);
  windows(ctx, -w / 2 + 16, -h + 44, w - 32, 54, 11, 1, r, "#7ea0c0");
  shape(ctx, box(-w / 2 - 10, -h - 14, w + 20, 20), "#cfd5d8", r, 2);
  shape(ctx, box(-54, -h + 62, 108, h - 62), "#7ea0c0", r, 2);
  ctx.fillStyle = RED;
  ctx.font = '700 36px "STKaiti","KaiTi","Kaiti SC",serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("峨 山 站", 0, -h + 20);
  shape(ctx, box(155, -66, 44, 56), "#30394f", r, 1.6, 0.6);
  ctx.fillStyle = "#ffd97a";
  ctx.font = '700 11px "Microsoft YaHei",sans-serif';
  ctx.fillText("昆明", 177, -47);
  ctx.fillText("峨山", 177, -27);
}

function drawKuixing(ctx: Ctx, s: Structure, r: Random) {
  groundShadow(ctx, s.w, 18);
  shape(ctx, box(-s.w / 2, -56, s.w, 56), "#c9b48f", r, 2.2);
  hatch(ctx, -s.w / 2, -56, s.w, 56, r, "rgba(90,70,40,0.16)", 10);
  shape(ctx, curve({ x: -30, y: 0 }, { x: 0, y: -80 }, { x: 30, y: 0 }, 12), "#4b3a2f", r, 2);
  const tiers = [{ y: -56, w: 150, h: 84 }, { y: -146, w: 112, h: 66 }, { y: -222, w: 78, h: 52 }];
  tiers.forEach((tier, index) => {
    shape(ctx, box(-tier.w / 2, tier.y - tier.h, tier.w, tier.h), index === 0 ? "#c0503a" : "#b5452f", r, 2);
    for (let i = 0; i < 3 - index + 1; i += 1) {
      const columns = 4 - index, gap = tier.w / columns;
      if (i < columns) shape(ctx, box(-tier.w / 2 + i * gap + gap * 0.24, tier.y - tier.h + 22, gap * 0.52, tier.h - 30), "#6a3e2e", r, 1.2, 0.5);
    }
    tiledRoof(ctx, 0, tier.y - tier.h + 8, tier.w + 40, 34 + (2 - index) * 4, r);
  });
  stroke(ctx, [{ x: 0, y: -292 }, { x: 0, y: -326 }], r, INK, 3);
  ctx.fillStyle = "#d9a441";
  ctx.beginPath();
  ctx.arc(0, -330, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function drawBreakfast(ctx: Ctx, s: Structure, r: Random) {
  const w = s.w;
  groundShadow(ctx, w);
  shape(ctx, box(-w / 2, -86, w, 86), "#e8dcc4", r);
  shape(ctx, box(-w / 2 + 20, -66, w - 40, 66), "#6b5a4c", r, 1.6, 0.6);
  shape(ctx, [{ x: -w / 2 - 14, y: -68 }, { x: w / 2 + 14, y: -68 }, { x: w / 2, y: -100 }, { x: -w / 2, y: -100 }], "#d9583b", r);
  for (let i = 0; i < 7; i += 2) shape(ctx, [{ x: -w / 2 - 14 + i * (w + 28) / 7, y: -68 }, { x: -w / 2 - 14 + (i + 1) * (w + 28) / 7, y: -68 }, { x: -w / 2 + (i + 1) * w / 7, y: -100 }, { x: -w / 2 + i * w / 7, y: -100 }], "#f4ead4", r, 1, 0.5);
  signboard(ctx, 0, -128, w - 40, s.sign ?? "", r);
  shape(ctx, box(52, -38, 46, 38), "#9b9188", r, 1.6, 0.6);
  shape(ctx, box(58, -50, 34, 14), "#c7b995", r, 1.4, 0.6);
}

function drawTable(ctx: Ctx, s: Structure, r: Random) {
  const w = s.w;
  groundShadow(ctx, w, 12);
  for (const x of [-w * 0.34, w * 0.34]) shape(ctx, box(x - 11, -22, 22, 22), "#9b968b", r, 1.6, 0.6);
  shape(ctx, [{ x: -w / 2 - 6, y: -22 }, { x: w / 2 + 6, y: -22 }, { x: w / 2 - 12, y: -56 }, { x: -w / 2 + 12, y: -56 }], CONCRETE, r, 2.2);
  hatch(ctx, -w / 2, -56, w, 34, r, "rgba(70,70,70,0.14)", 7);
  stroke(ctx, [{ x: -w / 2 - 6, y: -22 }, { x: w / 2 + 6, y: -22 }], r, "#f6f2e8", 2);
  shape(ctx, [{ x: -6, y: -60 }, { x: 6, y: -60 }, { x: 4, y: -24 }, { x: -4, y: -24 }], "#c74b3a", r, 1.4, 0.4);
}

function drawTv(ctx: Ctx, s: Structure, r: Random) {
  groundShadow(ctx, s.w, 10);
  shape(ctx, box(-24, -28, 48, 28), WOOD, r, 1.6, 0.6);
  shape(ctx, box(-32, -78, 64, 50), "#52433a", r, 2, 0.6);
  shape(ctx, box(-25, -71, 40, 36), "#a9c9c0", r, 1.4, 0.4);
  stroke(ctx, [{ x: -6, y: -78 }, { x: -22, y: -100 }], r);
  stroke(ctx, [{ x: 6, y: -78 }, { x: 22, y: -100 }], r);
}

function drawFirepit(ctx: Ctx, s: Structure, r: Random) {
  groundShadow(ctx, s.w, 12);
  for (let i = 0; i < 9; i += 1) {
    const a = (i / 9) * Math.PI * 2;
    shape(ctx, box(Math.cos(a) * 34 - 9, Math.sin(a) * 12 - 16, 18, 13), "#a39a8c", r, 1.2, 0.6);
  }
  stroke(ctx, [{ x: -22, y: -6 }, { x: 22, y: -30 }], r, "#6b4a30", 8);
  stroke(ctx, [{ x: 22, y: -6 }, { x: -22, y: -30 }], r, "#7a5636", 8);
}

function drawWorkshop(ctx: Ctx, s: Structure, r: Random) {
  const w = s.w, h = 176, x = -w / 2, depth = 22;
  groundShadow(ctx, w, 22);
  shape(ctx, [{ x: w / 2, y: 0 }, { x: w / 2 + depth, y: -14 }, { x: w / 2 + depth, y: -h - 14 }, { x: w / 2, y: -h }], "#d9cfbb", r, 2.2);
  shape(ctx, box(x, -h, w, h), "#fbf6ea", r, 2.4);
  shape(ctx, [{ x, y: -h }, { x: w / 2, y: -h }, { x: w / 2 + depth, y: -h - 14 }, { x: x + depth, y: -h - 14 }], COBALT, r, 2.2);
  shape(ctx, box(x + 16, -h + 16, w - 32, 40), COBALT, r, 2);
  ctx.fillStyle = "#ffffff";
  ctx.font = '700 25px "STKaiti","KaiTi","Kaiti SC",serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("MATEO 工作室", 0, -h + 37);
  const screens = ["#9fc3f0", "#f0c9a0", "#b9dcae"];
  for (let i = 0; i < 3; i += 1) {
    const sx = x + 22 + i * 132;
    if (i === 1) continue;
    shape(ctx, box(sx, -104, 122, 74), "#2b3148", r, 2, 0.7);
    shape(ctx, box(sx + 8, -97, 106, 60), screens[i], r, 1.2, 0.5);
    for (let l = 0; l < 4; l += 1) stroke(ctx, [{ x: sx + 16, y: -86 + l * 12 }, { x: sx + 44 + r() * 54, y: -86 + l * 12 }], r, "rgba(30,34,70,0.55)", 2.4, 0.4);
  }
  shape(ctx, box(-44, -96, 88, 96), "#7ea0c0", r, 2.2, 0.7);
  stroke(ctx, [{ x: 0, y: -96 }, { x: 0, y: 0 }], r, INK, 2, 0.4);
  stroke(ctx, [{ x: 0, y: -h - 14 }, { x: 0, y: -h - 44 }], r, INK, 3);
  ctx.fillStyle = "#ffd768";
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, -h - 58, 15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
}

function drawRoom(ctx: Ctx, s: Structure, r: Random) {
  const w = s.w;
  groundShadow(ctx, w, 18);
  shape(ctx, box(-w / 2, -96, w, 96), "#f3e3c5", r, 2.2);
  hatch(ctx, -w / 2, -96, w, 96, r, "rgba(140,100,50,0.1)", 13);
  shape(ctx, box(78, -192, 34, 70), "#b5452f", r, 2, 0.6);
  shape(ctx, [{ x: -w / 2 - 24, y: -90 }, { x: w / 2 + 24, y: -90 }, { x: w / 2 - 34, y: -176 }, { x: -w / 2 + 34, y: -176 }], "#c8603f", r, 2.4);
  for (let row = 1; row < 4; row += 1) { const y = -90 - row * 21, inset = row * 15; stroke(ctx, [{ x: -w / 2 - 24 + inset, y }, { x: w / 2 + 24 - inset, y }], r, "rgba(60,30,20,0.35)", 1.3, 0.9); }
  shape(ctx, box(-30, -72, 60, 72), "#7c5a3e", r, 2, 0.6);
  ctx.fillStyle = "#e0bd6f"; ctx.beginPath(); ctx.arc(20, -36, 3.4, 0, Math.PI * 2); ctx.fill();
  for (const x of [-118, 58]) { shape(ctx, box(x, -74, 60, 44), "#a9cfe0", r, 2, 0.6); stroke(ctx, [{ x: x + 30, y: -74 }, { x: x + 30, y: -30 }], r, INK, 1.4, 0.3); }
}

function drawPhotoWall(ctx: Ctx, s: Structure, r: Random) {
  const w = s.w, h = 126;
  groundShadow(ctx, w, 12);
  for (const x of [-w / 2 + 16, w / 2 - 16]) shape(ctx, box(x - 8, -h - 12, 16, h + 12), WOOD, r, 2, 0.6);
  shape(ctx, box(-w / 2 + 8, -h, w - 16, h - 18), "#d8b98a", r, 2.2);
  hatch(ctx, -w / 2 + 8, -h, w - 16, h - 18, r, "rgba(110,70,30,0.13)", 11);
  const tones = ["#8fb4c8", "#c98f62", "#9dbb6c", "#d9a0a0", "#7f9ad6", "#e0c070"];
  for (let i = 0; i < 6; i += 1) {
    const x = -w / 2 + 34 + i * 52, y = -h + 14 + (i % 2) * 12;
    ctx.save();
    ctx.translate(x + 20, y + 24);
    ctx.rotate(((i % 3) - 1) * 0.08);
    shape(ctx, box(-21, -26, 42, 52), "#fbf6ea", r, 1.5, 0.4);
    shape(ctx, box(-16, -21, 32, 32), tones[i], r, 1, 0.3);
    ctx.fillStyle = "#c74b3a";
    ctx.beginPath(); ctx.arc(0, -26, 3.4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

function drawClockTower(ctx: Ctx, s: Structure, r: Random) {
  groundShadow(ctx, s.w, 16);
  shape(ctx, box(-58, -250, 116, 250), "#efe5d0", r, 2.4);
  hatch(ctx, -58, -250, 116, 250, r, "rgba(120,90,50,0.08)", 14);
  shape(ctx, box(-26, -66, 52, 66), "#7c5a3e", r, 2, 0.6);
  tiledRoof(ctx, 0, -246, 150, 76, r, COBALT);
  const face = Array.from({ length: 28 }, (_, i) => ({ x: Math.cos((i / 28) * Math.PI * 2) * 38, y: -196 + Math.sin((i / 28) * Math.PI * 2) * 38 }));
  shape(ctx, face, "#fffaee", r, 2.4, 0.6);
  for (let i = 0; i < 12; i += 1) { const a = (i / 12) * Math.PI * 2; stroke(ctx, [{ x: Math.sin(a) * 30, y: -196 - Math.cos(a) * 30 }, { x: Math.sin(a) * 34, y: -196 - Math.cos(a) * 34 }], r, INK, 2, 0.2); }
}

function drawThoughtTree(ctx: Ctx, s: Structure, r: Random) {
  ctx.save();
  ctx.scale(1.6, 1.6);
  drawTree(ctx, 1, 1, r);
  ctx.restore();
  const tags = [[-62, -128], [-34, -92], [8, -150], [46, -104], [72, -136], [-12, -118]];
  for (const [i, [x, y]] of tags.entries()) {
    stroke(ctx, [{ x, y: y - 12 }, { x, y }], r, INK, 1, 0.3);
    shape(ctx, box(x - 10, y, 20, 24), ["#ffd768", "#fbf6ea", "#f0b8a3", "#c7cff7"][i % 4], r, 1.3, 0.4);
  }
}

function drawStatue(ctx: Ctx, s: Structure, r: Random) {
  groundShadow(ctx, s.w, 14);
  shape(ctx, box(-48, -44, 96, 44), "#bdb5a5", r, 2.2);
  shape(ctx, box(-56, -56, 112, 14), "#cec6b6", r, 2);
  ctx.fillStyle = INK;
  ctx.font = '700 18px "STKaiti","KaiTi","Kaiti SC",serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("MATEO", 0, -21);
  ctx.save();
  ctx.translate(0, -56);
  ctx.scale(2.3, 2.3);
  drawFigure(ctx, { x: 0, y: 0, facing: "down", walk: 0, moving: false }, STONE, 1);
  ctx.restore();
}

function drawLetters(ctx: Ctx, s: Structure, r: Random) {
  const letters = "MATEO", gap = s.w / letters.length;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = '900 italic 168px Arial, Helvetica, sans-serif';
  for (const [i, letter] of [...letters].entries()) {
    const x = -s.w / 2 + gap * (i + 0.5), y = (r() - 0.5) * 8;
    ctx.fillStyle = "#23398f";
    ctx.fillText(letter, x + 9, y - 2);
    ctx.fillStyle = "#fbf6ea";
    ctx.fillText(letter, x, y - 12);
    ctx.lineWidth = 3.4;
    ctx.strokeStyle = INK;
    ctx.lineJoin = "round";
    ctx.strokeText(letter, x, y - 12);
  }
}

function drawAirport(ctx: Ctx, s: Structure, r: Random) {
  const w = s.w;
  groundShadow(ctx, w, 12);
  shape(ctx, box(-w / 2, -14, w, 14), "#c9c2b4", r, 2, 0.8);
  for (const x of [-w / 2 + 22, w / 2 - 22]) shape(ctx, box(x - 5, -96, 10, 84), COBALT, r, 1.6, 0.5);
  shape(ctx, [{ x: -w / 2 - 12, y: -92 }, { x: w / 2 + 12, y: -92 }, { x: w / 2 - 12, y: -126 }, { x: -w / 2 + 12, y: -126 }], "#fbf6ea", r, 2.2);
  signboard(ctx, 0, -122, 118, "飞往峨山", r, COBALT);
}

function drawPlane(ctx: Ctx, s: Structure, r: Random) {
  const half = s.w / 2;
  ctx.fillStyle = "rgba(60,50,40,0.22)";
  ctx.beginPath(); ctx.ellipse(6, -1, half * 0.86, 11, 0, 0, Math.PI * 2); ctx.fill();
  for (const x of [-70, 84]) { stroke(ctx, [{ x, y: -30 }, { x, y: -10 }], r, INK, 3, 0.3); ctx.fillStyle = "#2b2b33"; ctx.beginPath(); ctx.arc(x, -9, 8, 0, Math.PI * 2); ctx.fill(); }
  shape(ctx, [{ x: -half + 6, y: -86 }, { x: -half + 62, y: -74 }, { x: -half + 92, y: -44 }, { x: -half + 44, y: -44 }], COBALT, r, 2.2, 0.7);
  const nose = curve({ x: half - 66, y: -82 }, { x: half + 12, y: -74 }, { x: half, y: -46 }, 10);
  const belly = curve({ x: half, y: -46 }, { x: half - 34, y: -26 }, { x: half - 88, y: -26 }, 8);
  shape(ctx, [{ x: -half + 32, y: -72 }, { x: -half + 90, y: -82 }, ...nose, ...belly.slice(1), { x: -half + 90, y: -26 }, { x: -half + 44, y: -44 }], "#fbf8f0", r, 2.4, 0.8);
  ctx.fillStyle = COBALT;
  ctx.fillRect(-half + 74, -46, half * 2 - 128, 7);
  for (let i = 0; i < 11; i += 1) shape(ctx, box(-half + 96 + i * 20, -70, 11, 12), "#58749a", r, 1, 0.3);
  shape(ctx, box(half - 66, -72, 24, 14), "#58749a", r, 1.2, 0.3);
  shape(ctx, [{ x: -18, y: -42 }, { x: 44, y: -42 }, { x: -8, y: -6 }, { x: -44, y: -6 }], "#dfe3e6", r, 2, 0.6);
  ctx.fillStyle = COBALT;
  ctx.font = 'italic 900 16px Arial, Helvetica, sans-serif';
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("MATEO", -half + 66, -30);
}

function drawStructure(ctx: Ctx, s: Structure, r: Random) {
  const draw = { workshop: drawWorkshop, room: drawRoom, photowall: drawPhotoWall, clocktower: drawClockTower, thoughttree: drawThoughtTree, statue: drawStatue, letters: drawLetters, airport: drawAirport, plane: drawPlane, station: drawStation, kuixing: drawKuixing, oldhouse: drawOldHouse, breakfast: drawBreakfast, firepit: drawFirepit, table: drawTable, tv: drawTv, block: drawBlock }[s.kind];
  draw(ctx, s, r);
}

function drawTree(ctx: Ctx, size: number, tone: number, r: Random) {
  ctx.save();
  ctx.scale(size, size);
  ctx.fillStyle = "rgba(70,55,40,0.2)";
  ctx.beginPath();
  ctx.ellipse(5, -1, 30, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  shape(ctx, [{ x: -6, y: 0 }, { x: 6, y: 0 }, { x: 4, y: -40 }, { x: -4, y: -40 }], "#7a5a3f", r, 1.6, 0.5);
  const palette = [["#7f9a58", "#94ad66", "#6c8650"], ["#8ea25b", "#a7b76d", "#73894c"], ["#6f9367", "#88a874", "#5e7f5b"]][tone];
  const blobs = [{ x: 0, y: -68, s: 32 }, { x: -24, y: -52, s: 24 }, { x: 24, y: -52, s: 24 }, { x: -13, y: -86, s: 22 }, { x: 15, y: -88, s: 21 }];
  for (const [index, blob] of blobs.entries()) {
    const points = Array.from({ length: 14 }, (_, i) => {
      const a = (i / 14) * Math.PI * 2, radius = blob.s * (0.86 + r() * 0.26);
      return { x: blob.x + Math.cos(a) * radius, y: blob.y + Math.sin(a) * radius * 0.92 };
    });
    shape(ctx, points, palette[index % 3], r, 1.5, 1.8);
  }
  ctx.strokeStyle = "rgba(40,50,30,0.3)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 16; i += 1) {
    const x = (r() - 0.5) * 62, y = -92 + r() * 58;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 5 + r() * 5, y - 4 - r() * 4);
    ctx.stroke();
  }
  ctx.restore();
}

function makeSprite(width: number, up: number, down: number, sortY: number, x: number, y: number, draw: (ctx: Ctx) => void): Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(width * RENDER_SCALE);
  canvas.height = Math.ceil((up + down) * RENDER_SCALE);
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(RENDER_SCALE, 0, 0, RENDER_SCALE, (width / 2) * RENDER_SCALE, up * RENDER_SCALE);
  draw(ctx);
  return { canvas, x: x - width / 2, y: y - up, sortY, width, height: up + down };
}

const heights: Record<Structure["kind"], number> = { workshop: 300, room: 210, photowall: 170, clocktower: 340, thoughttree: 260, statue: 230, letters: 190, airport: 150, plane: 130, station: 170, kuixing: 360, oldhouse: 140, breakfast: 160, firepit: 60, table: 80, tv: 110, block: 260 };

export function buildSprites(map: GameMap): Sprite[] {
  const sprites = map.structures.map((s, index) => makeSprite(s.w + 160, heights[s.kind], 30, s.y, s.x, s.y, (ctx) => drawStructure(ctx, s, createRandom(index * 37 + 11))));
  for (const [index, tree] of map.trees.entries()) sprites.push(makeSprite(130 * tree.size, 140 * tree.size, 16, tree.y, tree.x, tree.y, (ctx) => drawTree(ctx, tree.size, tree.tone, createRandom(index + 500))));
  return sprites;
}

function coastPoints(map: GameMap, scale: number): Point[] {
  const island = map.island!;
  return Array.from({ length: 96 }, (_, i) => {
    const a = (i / 96) * Math.PI * 2, reach = coastline(a) * scale;
    return { x: island.x + Math.cos(a) * island.rx * reach, y: island.y + Math.sin(a) * island.ry * reach };
  });
}

function drawSea(ctx: Ctx, map: GameMap, r: Random) {
  ctx.fillStyle = "#8ec2cf";
  ctx.fillRect(0, 0, map.width, map.height);
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 1.8;
  ctx.lineCap = "round";
  for (let i = 0; i < 260; i += 1) {
    const x = r() * map.width, y = r() * map.height, len = 12 + r() * 26;
    ctx.beginPath(); ctx.moveTo(x - len, y); ctx.quadraticCurveTo(x, y - 6, x + len, y); ctx.stroke();
  }
  shape(ctx, coastPoints(map, 1.02), "#ecd9ae", r, 2.2, 3);
  shape(ctx, coastPoints(map, 0.97), PAPER, r, 1.4, 3);
}

function drawGrass(ctx: Ctx, map: GameMap, r: Random) {
  const top = map.northLimit - 40;
  for (let i = 0; i < Math.round((map.width * map.height) / 62000); i += 1) {
    ctx.fillStyle = ["rgba(175,190,130,0.34)", "rgba(190,200,140,0.3)", "rgba(160,180,120,0.28)"][i % 3];
    ctx.beginPath();
    ctx.ellipse(r() * map.width, top + r() * (map.height - top), 90 + r() * 200, 50 + r() * 110, r() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = "rgba(100,120,70,0.34)";
  ctx.lineWidth = 1.2;
  for (let i = 0; i < Math.round((map.width * map.height) / 1900); i += 1) {
    const x = r() * map.width, y = top + r() * (map.height - top);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (r() - 0.5) * 5, y - 5 - r() * 5); ctx.stroke();
  }
}

function drawMountains(ctx: Ctx, map: GameMap, r: Random) {
  const layers = [{ base: 170, peak: 120, color: "#b7c5c0", step: 180 }, { base: 188, peak: 80, color: "#93aa97", step: 130 }];
  for (const layer of layers) {
    const points: Point[] = [{ x: -20, y: layer.base + 30 }];
    for (let x = -20; x <= map.width + 40; x += layer.step) {
      points.push({ x, y: layer.base - r() * layer.peak * (x < 700 ? 1.25 : 0.65) });
      points.push({ x: x + layer.step / 2, y: layer.base - r() * 26 });
    }
    points.push({ x: map.width + 40, y: layer.base + 30 });
    shape(ctx, points, layer.color, r, 2, 3);
  }
  ctx.fillStyle = "rgba(59,48,41,0.55)";
  ctx.font = '700 26px "STKaiti","KaiTi","Kaiti SC",serif';
  ctx.textAlign = "left";
  ctx.fillText("锦 屏 山", 120, 118);
}

function drawRiver(ctx: Ctx, map: GameMap, index: number, r: Random) {
  const river = map.rivers[index];
  const edge = (side: number) => { const points: Point[] = []; for (let y = -20; y <= map.height + 20; y += 24) points.push({ x: river.center(y) + side * RIVER_HALF, y }); return points; };
  shape(ctx, [...edge(-1), ...edge(1).reverse()], "#8cb9c6", r, 2.2, 1.6);
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 1.6;
  for (let y = 10; y < map.height; y += 34) {
    const x = river.center(y) + (r() - 0.5) * 60, len = 14 + r() * 22;
    ctx.beginPath(); ctx.moveTo(x - len, y); ctx.quadraticCurveTo(x, y - 6, x + len, y); ctx.stroke();
  }
  ctx.fillStyle = "rgba(59,48,41,0.55)";
  ctx.font = '700 22px "STKaiti","KaiTi","Kaiti SC",serif';
  ctx.textAlign = "center";
  ctx.fillText(river.name, river.center(900), 900);
}

function drawRoads(ctx: Ctx, map: GameMap, r: Random) {
  for (const width of [64, 56]) for (const road of map.roads) {
    ctx.strokeStyle = width === 64 ? "rgba(120,96,66,0.55)" : "#e6d6b6";
    ctx.lineWidth = width;
    ctx.lineCap = ctx.lineJoin = "round";
    sketch(ctx, road, false, r, width === 64 ? 2.4 : 1);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(120,96,66,0.28)";
  for (let i = 0; i < 500; i += 1) {
    const road = map.roads[Math.floor(r() * map.roads.length)], s = Math.floor(r() * (road.length - 1)), t = r();
    ctx.fillRect(road[s].x + (road[s + 1].x - road[s].x) * t + (r() - 0.5) * 48, road[s].y + (road[s + 1].y - road[s].y) * t + (r() - 0.5) * 48, 2, 2);
  }
}

function drawBridge(ctx: Ctx, map: GameMap, bridge: Bridge, r: Random) {
  const cx = map.rivers[bridge.river].center(bridge.y), half = RIVER_HALF + 34, y = bridge.y;
  shape(ctx, box(cx - half, y - 38, half * 2, 76), "#d2c7b2", r, 2.2);
  for (let x = cx - half + 14; x < cx + half; x += 16) stroke(ctx, [{ x, y: y - 36 }, { x, y: y + 36 }], r, "rgba(80,70,55,0.25)", 1, 0.6);
  for (const edge of [y - 38, y + 38]) stroke(ctx, [{ x: cx - half, y: edge }, { x: cx + half, y: edge }], r, "#8f8471", 5, 0.8);
}

function drawPlaza(ctx: Ctx, plaza: Ellipse, r: Random) {
  const outline = Array.from({ length: 48 }, (_, i) => ({ x: plaza.x + Math.cos((i / 48) * Math.PI * 2) * plaza.rx, y: plaza.y + Math.sin((i / 48) * Math.PI * 2) * plaza.ry }));
  shape(ctx, outline, "#dfd2bb", r, 2.2, 2);
  ctx.strokeStyle = "rgba(100,84,62,0.26)";
  ctx.lineWidth = 1.4;
  for (const scale of [0.25, 0.5, 0.75]) { ctx.beginPath(); ctx.ellipse(plaza.x, plaza.y, plaza.rx * scale, plaza.ry * scale, 0, 0, Math.PI * 2); ctx.stroke(); }
  for (let i = 0; i < 16; i += 1) {
    const a = (i / 16) * Math.PI * 2;
    ctx.beginPath(); ctx.moveTo(plaza.x + Math.cos(a) * plaza.rx * 0.25, plaza.y + Math.sin(a) * plaza.ry * 0.25); ctx.lineTo(plaza.x + Math.cos(a) * plaza.rx, plaza.y + Math.sin(a) * plaza.ry); ctx.stroke();
  }
}

function drawCourt(ctx: Ctx, court: Rect, r: Random) {
  shape(ctx, box(court.x, court.y, court.w, court.h), "#d65f49", r, 2.4, 1);
  shape(ctx, box(court.x + 16, court.y + 16, court.w - 32, court.h - 32), "#e2765f", r, 1.2, 1);
  ctx.strokeStyle = "rgba(255,250,238,0.8)";
  ctx.lineWidth = 3;
  ctx.strokeRect(court.x + 34, court.y + 34, court.w - 68, court.h - 68);
}

function drawGarden(ctx: Ctx, garden: Ellipse, r: Random) {
  const outline = Array.from({ length: 40 }, (_, i) => ({ x: garden.x + Math.cos((i / 40) * Math.PI * 2) * garden.rx, y: garden.y + Math.sin((i / 40) * Math.PI * 2) * garden.ry }));
  shape(ctx, outline, "#c5d49b", r, 1.8, 4);
  for (let i = 0; i < 260; i += 1) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 0.93, x = garden.x + Math.cos(a) * garden.rx * d, y = garden.y + Math.sin(a) * garden.ry * d;
    ctx.fillStyle = ["#e0845f", "#f0c95a", "#f6efe0", "#5f7fd6", "#d9709a"][i % 5];
    for (let p = 0; p < 5; p += 1) { ctx.beginPath(); ctx.arc(x + Math.cos(p * 1.26) * 4, y + Math.sin(p * 1.26) * 3, 2.6, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = "#6b4a30";
    ctx.beginPath(); ctx.arc(x, y, 1.6, 0, Math.PI * 2); ctx.fill();
  }
}

function drawRail(ctx: Ctx, rail: NonNullable<GameMap["rail"]>, r: Random) {
  for (let x = rail.from; x < rail.to; x += 26) stroke(ctx, [{ x, y: rail.y - 20 }, { x: x + 3, y: rail.y + 24 }], r, "#8a7a63", 5, 0.5);
  for (const y of [rail.y - 12, rail.y + 16]) stroke(ctx, [{ x: rail.from, y }, { x: rail.to, y }], r, "#5b5148", 3.4, 0.5);
}

function drawRunway(ctx: Ctx, runway: NonNullable<GameMap["runway"]>, r: Random) {
  shape(ctx, box(runway.from, runway.y - 36, runway.to - runway.from, 76), "#70747b", r, 2.4, 1);
  for (let x = runway.from + 30; x < runway.to - 40; x += 84) {
    ctx.fillStyle = "rgba(255,250,238,0.9)";
    ctx.fillRect(x, runway.y, 46, 5);
  }
}

export function buildGround(map: GameMap): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = map.width * RENDER_SCALE;
  canvas.height = map.height * RENDER_SCALE;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(RENDER_SCALE, RENDER_SCALE);
  const r = createRandom(map.treeSeed + 1);
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, map.width, map.height);

  if (map.island) {
    drawSea(ctx, map, r);
    ctx.save();
    sketch(ctx, coastPoints(map, 0.97), true, r, 1);
    ctx.clip();
    drawGrass(ctx, map, r);
    ctx.fillStyle = "rgba(150,175,115,0.55)";
    ctx.beginPath(); ctx.ellipse(1300, 330, 560, 170, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  } else {
    drawGrass(ctx, map, r);
  }
  if (map.mountains) drawMountains(ctx, map, r);
  if (map.rail) drawRail(ctx, map.rail, r);
  if (map.runway) drawRunway(ctx, map.runway, r);
  map.rivers.forEach((_, index) => drawRiver(ctx, map, index, r));
  drawRoads(ctx, map, r);
  map.bridges.forEach((bridge) => drawBridge(ctx, map, bridge, r));
  map.plazas.forEach((plaza) => drawPlaza(ctx, plaza, r));
  map.courts.forEach((court) => drawCourt(ctx, court, r));
  map.gardens.forEach((garden) => drawGarden(ctx, garden, r));

  ctx.fillStyle = "rgba(90,70,45,0.05)";
  for (let i = 0; i < Math.round((map.width * map.height) / 320); i += 1) ctx.fillRect(r() * map.width, r() * map.height, 1.5, 1.5);
  return canvas;
}

export interface Actor { x: number; y: number; facing: "down" | "up" | "left" | "right"; walk: number; moving: boolean }

const LIVE = { skin: "#f6cf55", shirt: COBALT, legs: "#3a4560", phones: "#e8569a", ink: INK };
const STONE = { skin: "#d6d0c3", shirt: "#c4bdae", legs: "#aca596", phones: "#b8b1a2", ink: "#6d675c" };

function drawFigure(ctx: Ctx, actor: Actor, palette: typeof LIVE, armUp = 0) {
  const step = actor.moving ? Math.sin(actor.walk * 12) : 0, bob = actor.moving ? Math.abs(Math.cos(actor.walk * 12)) * 2.5 : 0;
  ctx.save();
  ctx.translate(actor.x, actor.y);
  ctx.fillStyle = "rgba(60,45,30,0.28)";
  ctx.beginPath(); ctx.ellipse(0, 0, 16, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = palette.ink; ctx.lineWidth = 1.8; ctx.lineJoin = ctx.lineCap = "round";
  ctx.fillStyle = palette.legs;
  for (const side of [-1, 1]) { ctx.beginPath(); ctx.rect(side * 5 - 3.5, -13 + (side * step > 0 ? -3 : 0), 7, 13); ctx.fill(); ctx.stroke(); }
  ctx.translate(0, -bob);
  ctx.fillStyle = palette.shirt; ctx.beginPath(); ctx.roundRect(-11, -34, 22, 23, 6); ctx.fill(); ctx.stroke();
  if (armUp) {
    ctx.save();
    ctx.translate(11, -30);
    ctx.rotate(-2.2 + armUp * 0.5);
    ctx.fillStyle = palette.skin; ctx.beginPath(); ctx.roundRect(-3, 0, 7, 20, 3); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle = palette.skin; ctx.beginPath(); ctx.arc(0, -46, 15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  if (actor.facing !== "up") {
    const shift = actor.facing === "left" ? -5 : actor.facing === "right" ? 5 : 0;
    ctx.fillStyle = palette.ink;
    for (const side of [-1, 1]) { ctx.beginPath(); ctx.arc(shift + side * 5.5, -47, 1.9, 0, Math.PI * 2); ctx.fill(); }
    ctx.beginPath(); ctx.arc(shift, -42, 5, 0.2, Math.PI - 0.2); ctx.stroke();
  }
  ctx.strokeStyle = palette.phones; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(0, -47, 16, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
  ctx.fillStyle = palette.phones; ctx.strokeStyle = palette.ink; ctx.lineWidth = 1.5;
  for (const side of [-1, 1]) { ctx.beginPath(); ctx.roundRect(side * 16 - 4, -52, 8, 14, 3); ctx.fill(); ctx.stroke(); }
  ctx.restore();
}

/** The character the visitor plays: Mateo, drawn to match the site's avatar. */
export const drawMateo = (ctx: Ctx, actor: Actor) => drawFigure(ctx, actor, LIVE);

export function drawThought(ctx: Ctx, x: number, y: number, time: number) {
  const lift = Math.sin(time * 3 + x) * 4;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(60,45,30,0.22)";
  ctx.beginPath(); ctx.ellipse(0, 0, 11, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.translate(0, lift - 26);
  ctx.fillStyle = "rgba(255,214,100,0.32)";
  ctx.beginPath(); ctx.arc(0, -4, 22 + Math.sin(time * 4 + x) * 2, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 1.7; ctx.lineJoin = "round";
  ctx.fillStyle = "#ffd768";
  ctx.beginPath(); ctx.arc(0, -6, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#b9b4a8";
  ctx.beginPath(); ctx.roundRect(-5, 5, 10, 8, 2); ctx.fill(); ctx.stroke();
  ctx.restore();
}

export function drawFlames(ctx: Ctx, x: number, y: number, time: number) {
  for (const [scale, color] of [[1, "#e8622f"], [0.68, "#f4a43a"], [0.36, "#fde08a"]] as const) {
    const sway = Math.sin(time * 9 + scale * 5) * 4, h = (50 + Math.sin(time * 13 + scale) * 8) * scale, w = 24 * scale;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x - w, y - 12);
    ctx.quadraticCurveTo(x - w * 0.9, y - 12 - h * 0.6, x + sway, y - 12 - h);
    ctx.quadraticCurveTo(x + w * 0.9, y - 12 - h * 0.6, x + w, y - 12);
    ctx.closePath();
    ctx.fill();
  }
}

export function drawSteam(ctx: Ctx, x: number, y: number, time: number) {
  ctx.strokeStyle = "rgba(255,255,255,0.75)";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  for (let i = 0; i < 3; i += 1) {
    const phase = (time * 0.7 + i / 3) % 1, px = x + Math.sin(phase * 7 + i) * 8, py = y - phase * 46;
    ctx.globalAlpha = 1 - phase;
    ctx.beginPath(); ctx.moveTo(px, py); ctx.quadraticCurveTo(px + 6, py - 6, px, py - 12); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

export function drawClockHands(ctx: Ctx, x: number, y: number, hour: number, minute: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = INK;
  ctx.lineCap = "round";
  const hand = (angle: number, length: number, width: number) => {
    ctx.lineWidth = width;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(angle) * length, -Math.cos(angle) * length); ctx.stroke();
  };
  hand(((hour % 12) + minute / 60) * (Math.PI / 6), 16, 4);
  hand(minute * (Math.PI / 30), 25, 2.6);
  ctx.restore();
}

export function drawTrain(ctx: Ctx, headX: number, railY: number, cars: number) {
  const y = railY + 14, r = createRandom(7);
  for (let car = 0; car < cars; car += 1) {
    const x = headX - 300 * (car + 1) - 8 * car;
    if (car === 0) shape(ctx, [{ x, y }, { x: x + 240, y }, { x: x + 300, y: y - 18 }, { x: x + 262, y: y - 72 }, { x, y: y - 76 }], "#f6f5f0", r, 2.2, 0.8);
    else shape(ctx, box(x, y - 76, 300, 76), "#f6f5f0", r, 2.2, 0.8);
    ctx.fillStyle = COBALT;
    ctx.fillRect(x + 3, y - 26, car === 0 ? 268 : 294, 9);
    for (let w = 0; w < 7; w += 1) { ctx.fillStyle = "#48607e"; ctx.fillRect(x + 16 + w * 36, y - 60, 24, 22); }
  }
}

export interface Light { x: number; y: number; r: number; color: string }

const LIGHT_BY_KIND: Partial<Record<Structure["kind"], { lift: number; r: number; color: string }>> = {
  workshop: { lift: 110, r: 340, color: "255,215,150" },
  room: { lift: 60, r: 220, color: "255,205,120" },
  photowall: { lift: 70, r: 240, color: "255,215,150" },
  clocktower: { lift: 200, r: 220, color: "255,225,170" },
  thoughttree: { lift: 120, r: 280, color: "255,205,110" },
  statue: { lift: 60, r: 190, color: "255,225,170" },
  table: { lift: 30, r: 230, color: "255,235,190" },
  airport: { lift: 60, r: 200, color: "255,225,170" },
  station: { lift: 40, r: 220, color: "255,225,170" },
  kuixing: { lift: 30, r: 240, color: "255,180,110" },
  breakfast: { lift: 30, r: 170, color: "255,205,120" },
  firepit: { lift: 20, r: 300, color: "255,150,70" },
  block: { lift: 90, r: 120, color: "255,215,150" },
};

export const lightsFor = (map: GameMap): Light[] => map.structures.flatMap((s) => {
  const light = LIGHT_BY_KIND[s.kind];
  return light ? [{ x: s.x, y: s.y - light.lift, r: light.r, color: light.color }] : [];
});
