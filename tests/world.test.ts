import { describe, expect, it } from "vitest";
import { followRoute, maps, TODOS, WALK_SPEED, type GameMap, type Point } from "../lib/world";

const { island, eshan } = maps;

function walk(map: GameMap, from: Point, to: Point) {
  let position = from, route = map.routeTo(from, to);
  for (let i = 0; i < 60 * 40 && route.length; i += 1) ({ position, route } = followRoute(map, position, route, WALK_SPEED / 60));
  return { position, finished: route.length === 0 };
}

describe.each([["island", island], ["eshan", eshan]] as const)("%s map", (_name, map) => {
  it("starts on open ground, with every place and collectible reachable underfoot", () => {
    expect(map.isWalkable(map.spawn.x, map.spawn.y)).toBe(true);
    for (const point of [...map.places, ...map.thoughts]) expect(map.isWalkable(point.x, point.y), JSON.stringify(point)).toBe(true);
  });

  it("grows the same trees on open ground every visit", () => {
    expect(map.trees.length).toBeGreaterThan(10);
    for (const tree of map.trees) expect(map.isWalkable(tree.x, tree.y)).toBe(true);
  });

  it("recognises each place from its own doorstep", () => {
    for (const place of map.places) expect(map.nearestPlace(place)?.id).toBe(place.id);
  });

  it("reaches every place and collectible on foot from the start", () => {
    for (const target of [...map.places, ...map.thoughts]) {
      const { position, finished } = walk(map, map.spawn, target);
      expect(finished, JSON.stringify(target)).toBe(true);
      expect(Math.hypot(position.x - target.x, position.y - target.y), JSON.stringify(target)).toBeLessThan(60);
    }
  });
});

describe("the island is about Mateo", () => {
  it("has no football, and one place for each side of Mateo", () => {
    expect(JSON.stringify(island.places)).not.toMatch(/足球|football/);
    for (const id of ["workshop", "room", "photowall", "table", "garden", "clock", "airport"]) expect(island.placeById[id]).toBeDefined();
  });

  it("starts Mateo in plain sight, not behind the statue", () => {
    const statue = island.structures.find((s) => s.kind === "statue")!;
    expect(island.spawn.y).toBeLessThan(statue.y - 190);
  });

  it("keeps the shoreline off limits", () => {
    expect(island.isWalkable(120, 120)).toBe(false);
    let position = island.spawn;
    for (let i = 0; i < 600; i += 1) position = island.moveWithCollision(position, 0, 6);
    expect(position.y).toBeLessThan(island.island!.y + island.island!.ry * 1.1);
  });

  it("offers nine thoughts and three todos, each todo tied to a place", () => {
    expect(island.thoughts).toHaveLength(9);
    for (const todo of TODOS) expect(island.places.some((place) => place.todo === todo.id), todo.id).toBe(true);
  });

  it("connects to Eshan in both directions, by plane", () => {
    expect(island.train).toBeUndefined();
    expect(island.placeById.airport.action).toEqual({ kind: "travel", to: "eshan" });
    expect(eshan.placeById.back.action).toEqual({ kind: "travel", to: "island" });
  });
});

describe("eshan is a small side trip", () => {
  it("is much smaller than the island and links to no apps", () => {
    expect(eshan.width * eshan.height).toBeLessThan((island.width * island.height) * 0.6);
    expect(eshan.places.some((place) => place.action.kind === "app")).toBe(false);
  });

  it("can't be waded, only crossed on the bridge", () => {
    expect(eshan.isWalkable(eshan.rivers[0].center(900), 900)).toBe(false);
    expect(eshan.isWalkable(eshan.rivers[0].center(640), 640)).toBe(true);
  });
});

describe("walking", () => {
  it("slides along a wall instead of sticking to it", () => {
    const next = island.moveWithCollision({ x: 1300, y: 698 }, 3, -3);
    expect(next.x).toBeGreaterThan(1300);
  });
});
