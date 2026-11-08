import { describe, expect, it } from "vitest";
import { createGame, launch, PADDLE_LIMIT, predictCpuX, stepGame, TABLE, WIN_SCORE, type Ball, type GameState, type Side } from "../lib/pingpong";
import { createRandom } from "../lib/random";

const DT = 1 / 60;
const ball = (x: number, y: number, z: number): Ball => ({ x, y, z, vx: 0, vy: 0, vz: 0, spin: 0 });

function runUntilPoint(game: GameState, chooseX: (game: GameState) => number, random: () => number) {
  for (let i = 0; i < 60 * 30; i += 1) {
    const events = stepGame(game, DT, { x: chooseX(game), serve: true }, random);
    const point = events.find((event) => event.type === "point");
    if (point?.type === "point") return point.winner;
  }
  throw new Error("point never ended");
}

describe("launch", () => {
  it("lands the ball on its target even with spin", () => {
    const b = ball(0.2, 0.2, 0);
    launch(b, { x: -0.4, z: 2.2 }, 0.7, 2);
    const G = 5.4;
    const land = { x: b.x + b.vx * 0.7 + 0.5 * 2 * 0.55 * 0.49, z: b.z + b.vz * 0.7, y: b.y + b.vy * 0.7 - 0.5 * G * 0.49 };
    expect(land.x).toBeCloseTo(-0.4);
    expect(land.z).toBeCloseTo(2.2);
    expect(land.y).toBeCloseTo(0);
  });

  it("clears the net on the lowest, fastest allowed shot", () => {
    const b = ball(0, 0.05, -0.06);
    launch(b, { x: 0, z: TABLE.length * 0.72 }, 0.5, 0);
    const t = (TABLE.length / 2 - b.z) / b.vz;
    expect(b.y + b.vy * t - 0.5 * 5.4 * t * t).toBeGreaterThan(TABLE.netHeight);
  });
});

describe("predictCpuX", () => {
  it("does not disturb the live ball", () => {
    const b = ball(0, 0.2, 0);
    launch(b, { x: 0.3, z: 2.3 }, 0.8, 1);
    const before = { ...b };
    predictCpuX(b);
    expect(b).toEqual(before);
  });
});

describe("rally rules", () => {
  it("gives the computer the point when the player doesn't move to the ball", () => {
    const game = createGame();
    game.server = "cpu";
    game.timer = 0;
    // Stand far from anywhere the computer can serve.
    expect(runUntilPoint(game, () => PADDLE_LIMIT, createRandom(3))).toBe("cpu");
  });

  it("returns the ball when the player tracks it, and counts the rally", () => {
    const game = createGame();
    game.server = "cpu";
    game.timer = 0;
    let best = 0;
    runUntilPoint(game, (g) => { best = Math.max(best, g.rally); return g.ball.x; }, createRandom(11));
    expect(best).toBeGreaterThan(0);
    expect(game.bestRally).toBeGreaterThan(0);
  });

  it("keeps the ball held until the player serves", () => {
    const game = createGame();
    stepGame(game, DT, { x: 0.3, serve: false }, createRandom(1));
    expect(game.phase).toBe("serve");
    expect(game.ball.x).toBeCloseTo(0.3);
    stepGame(game, DT, { x: 0.3, serve: true }, createRandom(1));
    expect(game.phase).toBe("rally");
  });
});

describe("match", () => {
  const play = (seed: number) => {
    const game = createGame();
    const random = createRandom(seed);
    for (let i = 0; i < 60 * 60 * 30 && game.phase !== "over"; i += 1) {
      stepGame(game, DT, { x: game.ball.x, serve: true }, random);
      for (const value of [game.ball.x, game.ball.y, game.ball.z, game.cpuX, game.playerX]) expect(Number.isFinite(value)).toBe(true);
    }
    return game;
  };

  it("finishes at 11 with a two point lead and never produces NaN", () => {
    const game = play(5);
    expect(game.phase).toBe("over");
    const { player, cpu } = game.score;
    expect(Math.max(player, cpu)).toBeGreaterThanOrEqual(WIN_SCORE);
    expect(Math.abs(player - cpu)).toBeGreaterThanOrEqual(2);
  });

  it("is winnable by a player who tracks every ball", () => {
    const winners: Side[] = [1, 2, 3, 4, 5].map((seed) => play(seed).winner!);
    expect(winners.filter((winner) => winner === "player").length).toBeGreaterThan(0);
  });

  it("does not let a stationary player win", () => {
    const game = createGame();
    const random = createRandom(9);
    for (let i = 0; i < 60 * 60 * 10 && game.phase !== "over"; i += 1) stepGame(game, DT, { x: PADDLE_LIMIT, serve: true }, random);
    expect(game.winner).toBe("cpu");
  });
});
