import { describe, expect, it } from "vitest";
import {
  fragments,
  groupLayout,
  latentLayout,
  nearestFragments,
  projectFragments,
  relaxBoxes,
  scatterLayout,
  type Bounds,
  type Box,
} from "../lib/fragments";
import { describeWeatherCode, isShanghaiWeather, parseOpenMeteo } from "../lib/weather";

const bounds: Bounds = { width: 1200, height: 640, inset: 20 };
const sizes = fragments.map((fragment) => ({ id: fragment.id, width: 120, height: 44 }));

const overlaps = (a: Box, b: Box, gap = 0) =>
  Math.abs(a.x - b.x) < (a.width + b.width) / 2 + gap && Math.abs(a.y - b.y) < (a.height + b.height) / 2 + gap;

const insideBounds = (box: Box) =>
  box.x - box.width / 2 >= bounds.inset - 0.5 &&
  box.x + box.width / 2 <= bounds.width - bounds.inset + 0.5 &&
  box.y - box.height / 2 >= bounds.inset - 0.5 &&
  box.y + box.height / 2 <= bounds.height - bounds.inset + 0.5;

describe("fragment data", () => {
  it("has unique ids and at least one tag each", () => {
    expect(new Set(fragments.map((fragment) => fragment.id)).size).toBe(fragments.length);
    for (const fragment of fragments) expect(Object.keys(fragment.tags).length).toBeGreaterThan(0);
  });
});

describe("projectFragments", () => {
  it("is deterministic and normalised to 0–1", () => {
    const first = projectFragments(fragments);
    expect(projectFragments(fragments)).toEqual(first);
    for (const point of first) {
      expect(point.x).toBeGreaterThanOrEqual(0);
      expect(point.x).toBeLessThanOrEqual(1);
      expect(point.y).toBeGreaterThanOrEqual(0);
      expect(point.y).toBeLessThanOrEqual(1);
    }
  });

  it("keeps a kind closer to itself than to other kinds on average", () => {
    const points = new Map(projectFragments(fragments).map((point) => [point.id, point]));
    const distance = (a: string, b: string) => {
      const p = points.get(a)!;
      const q = points.get(b)!;
      return Math.hypot(p.x - q.x, p.y - q.y);
    };
    const music = fragments.filter((fragment) => fragment.kind === "music").map((fragment) => fragment.id);
    const make = fragments.filter((fragment) => fragment.kind === "make").map((fragment) => fragment.id);
    const average = (pairs: [string, string][]) => pairs.reduce((sum, [a, b]) => sum + distance(a, b), 0) / pairs.length;
    const within = average(music.flatMap((a, i) => music.slice(i + 1).map((b) => [a, b] as [string, string])));
    const across = average(music.flatMap((a) => make.map((b) => [a, b] as [string, string])));
    expect(within).toBeLessThan(across);
  });
});

describe("nearestFragments", () => {
  it("returns other fragments ordered by similarity", () => {
    const near = nearestFragments(fragments, "midfield", 3);
    expect(near).toHaveLength(3);
    expect(near.map((fragment) => fragment.id)).not.toContain("midfield");
    expect(near[0].kind).toBe("sport");
  });

  it("returns nothing for an unknown id", () => {
    expect(nearestFragments(fragments, "missing")).toEqual([]);
  });
});

describe("layouts", () => {
  it("relaxes overlapping boxes apart and keeps them in bounds", () => {
    const stacked = Array.from({ length: 6 }, (_, index) => ({ id: String(index), x: 300, y: 300, width: 100, height: 40, rotate: 0 }));
    const relaxed = relaxBoxes(stacked, bounds, 8, 200);
    for (let i = 0; i < relaxed.length; i += 1) {
      expect(insideBounds(relaxed[i])).toBe(true);
      for (let j = i + 1; j < relaxed.length; j += 1) expect(overlaps(relaxed[i], relaxed[j])).toBe(false);
    }
  });

  it("lays out the latent map without overlaps", () => {
    const boxes = latentLayout(sizes, projectFragments(fragments), bounds);
    expect(boxes).toHaveLength(fragments.length);
    for (let i = 0; i < boxes.length; i += 1) {
      expect(insideBounds(boxes[i])).toBe(true);
      for (let j = i + 1; j < boxes.length; j += 1) expect(overlaps(boxes[i], boxes[j])).toBe(false);
    }
  });

  it("scatters reproducibly within bounds", () => {
    const first = scatterLayout(sizes, bounds, 7);
    expect(scatterLayout(sizes, bounds, 7)).toEqual(first);
    for (const box of first) expect(insideBounds(box)).toBe(true);
  });

  it("groups every fragment into its kind's region", () => {
    const { boxes, regions } = groupLayout(fragments, sizes, bounds);
    expect(boxes).toHaveLength(fragments.length);
    expect(regions.map((region) => region.kind)).toEqual(["music", "sport", "make", "life"]);
    for (const box of boxes) expect(box.rotate).toBe(0);
  });

  it("stacks groups by content height on a narrow canvas without overlaps", () => {
    const narrow: Bounds = { width: 370, height: 820, inset: 10 };
    const shapeSize = { round: [88, 88], pill: [140, 40], card: [150, 60] } as const;
    const realistic = fragments.map((fragment) => {
      const [width, height] = shapeSize[fragment.shape];
      return { id: fragment.id, width, height };
    });
    const { boxes } = groupLayout(fragments, realistic, narrow);
    for (let i = 0; i < boxes.length; i += 1) {
      for (let j = i + 1; j < boxes.length; j += 1) expect(overlaps(boxes[i], boxes[j]), `${boxes[i].id} × ${boxes[j].id}`).toBe(false);
    }
  });
});

describe("weather", () => {
  it("maps WMO codes to labels and day/night icons", () => {
    expect(describeWeatherCode(0, true)).toEqual({ label: "晴", icon: "sun" });
    expect(describeWeatherCode(0, false)).toEqual({ label: "晴", icon: "moon" });
    expect(describeWeatherCode(3, true).label).toBe("阴");
    expect(describeWeatherCode(63, true).icon).toBe("rain");
    expect(describeWeatherCode(95, true).icon).toBe("storm");
  });

  it("parses Open-Meteo current conditions", () => {
    const weather = parseOpenMeteo({ current: { temperature_2m: 22.5, weather_code: 3, is_day: 1 } });
    expect(weather).toEqual({ temperature: 23, code: 3, isDay: true, label: "阴", icon: "cloud" });
    expect(isShanghaiWeather(weather)).toBe(true);
  });

  it("rejects malformed responses", () => {
    expect(parseOpenMeteo(null)).toBeNull();
    expect(parseOpenMeteo({ current: { temperature_2m: "hot", weather_code: 3 } })).toBeNull();
    expect(isShanghaiWeather({ temperature: 20, code: 0, isDay: true, label: "晴", icon: "<script>" })).toBe(false);
  });
});
