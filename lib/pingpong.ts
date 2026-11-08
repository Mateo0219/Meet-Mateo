/**
 * Table tennis against the computer. Pure simulation (metres, seconds) so it can
 * be tested without a canvas. x runs across the table, z from the player's end
 * (0) to the computer's end (TABLE.length), y is height above the table.
 */
export const TABLE = { width: 1.525, length: 2.74, netHeight: 0.1525 } as const;
export const PLAYER_Z = -0.06;
export const CPU_Z = TABLE.length + 0.06;
export const PADDLE_LIMIT = 1.05;
export const WIN_SCORE = 11;

const HALF = TABLE.width / 2;
const NET_Z = TABLE.length / 2;
const GRAVITY = 5.4;
const BOUNCE = 0.84;
const CURVE = 0.55;
const KICK = 0.18;
const PLAYER_REACH = 0.17;
const CPU_REACH = 0.2;
const FLOOR = -0.55;
const SUBSTEP = 1 / 240;
/** Swinging harder than this can send the ball off the table. */
const WILD_SWING = 5;

export type Side = "player" | "cpu";
export type Phase = "serve" | "rally" | "point" | "over";

export interface Ball { x: number; y: number; z: number; vx: number; vy: number; vz: number; spin: number }

export interface GameState {
  phase: Phase;
  ball: Ball;
  playerX: number;
  playerVX: number;
  cpuX: number;
  cpuTarget: number;
  score: Record<Side, number>;
  server: Side;
  lastHitter: Side;
  /** Bounces on the receiver's half since the last hit. */
  bounces: number;
  rally: number;
  bestRally: number;
  timer: number;
  message: string;
  winner: Side | null;
}

export interface GameInput { x: number; serve: boolean }
export type GameEvent = { type: "hit"; by: Side } | { type: "bounce" } | { type: "point"; winner: Side } | { type: "over"; winner: Side };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const other = (side: Side): Side => (side === "player" ? "cpu" : "player");

export function createGame(bestRally = 0): GameState {
  return {
    phase: "serve",
    ball: { x: 0, y: 0.22, z: 0.02, vx: 0, vy: 0, vz: 0, spin: 0 },
    playerX: 0,
    playerVX: 0,
    cpuX: 0,
    cpuTarget: 0,
    score: { player: 0, cpu: 0 },
    server: "player",
    lastHitter: "player",
    bounces: 0,
    rally: 0,
    bestRally,
    timer: 0.9,
    message: "",
    winner: null,
  };
}

/** Aims the ball so it lands on `target` after `flight` seconds, spin included. */
export function launch(ball: Ball, target: { x: number; z: number }, flight: number, spin: number) {
  ball.vz = (target.z - ball.z) / flight;
  ball.vy = (-ball.y + 0.5 * GRAVITY * flight * flight) / flight;
  ball.vx = (target.x - ball.x - 0.5 * spin * CURVE * flight * flight) / flight;
  ball.spin = spin;
}

function advance(ball: Ball, dt: number) {
  ball.vx += ball.spin * CURVE * dt;
  ball.vy -= GRAVITY * dt;
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;
  ball.z += ball.vz * dt;
}

const onTable = (ball: Ball) => Math.abs(ball.x) <= HALF && ball.z >= 0 && ball.z <= TABLE.length;

function reflect(ball: Ball) {
  ball.y = 0;
  ball.vy = Math.abs(ball.vy) * BOUNCE;
  ball.vz *= 0.96;
  ball.vx += ball.spin * KICK;
  ball.spin *= 0.5;
}

/** Where the ball will cross the computer's plane. */
export function predictCpuX(ball: Ball): number {
  const copy = { ...ball };
  for (let t = 0; t < 3 && copy.z < CPU_Z; t += SUBSTEP) {
    advance(copy, SUBSTEP);
    if (copy.y <= 0 && copy.vy < 0 && onTable(copy)) reflect(copy);
  }
  return copy.x;
}

function score(state: GameState, winner: Side, message: string, events: GameEvent[]) {
  state.score[winner] += 1;
  state.message = message;
  state.timer = 1;
  events.push({ type: "point", winner });
  const { player, cpu } = state.score;
  if (Math.max(player, cpu) >= WIN_SCORE && Math.abs(player - cpu) >= 2) {
    state.phase = "over";
    state.winner = winner;
    events.push({ type: "over", winner });
  } else {
    state.phase = "point";
  }
}

function nextServer({ player, cpu }: Record<Side, number>): Side {
  const total = player + cpu;
  // Two serves each, then alternate every point at deuce.
  if (player >= WIN_SCORE - 1 && cpu >= WIN_SCORE - 1) return total % 2 === 0 ? "player" : "cpu";
  return Math.floor(total / 2) % 2 === 0 ? "player" : "cpu";
}

function afterHit(state: GameState, by: Side, random: () => number, events: GameEvent[]) {
  state.lastHitter = by;
  state.bounces = 0;
  events.push({ type: "hit", by });
  if (by === "cpu") {
    state.cpuTarget = state.cpuX * 0.3;
  } else {
    const accuracy = Math.max(0.05, 0.16 - state.rally * 0.008);
    state.cpuTarget = predictCpuX(state.ball) + (random() - 0.5) * 2 * accuracy;
  }
}

function playerReturn(state: GameState, random: () => number, events: GameEvent[]) {
  const { ball, playerX, playerVX } = state;
  const offset = (ball.x - playerX) / PLAYER_REACH;
  let x = clamp(ball.x * 0.15 + playerVX * 0.28 + offset * 0.45, -(HALF - 0.06), HALF - 0.06);
  if (Math.abs(playerVX) > WILD_SWING) x *= 1.35;
  const flight = Math.max(0.5, 0.82 - 0.05 * Math.min(state.rally, 6) - Math.abs(playerVX) * 0.03);
  launch(ball, { x, z: TABLE.length * (0.72 + 0.22 * random()) }, flight, clamp(playerVX * 0.9, -3.5, 3.5));
  state.rally += 1;
  state.bestRally = Math.max(state.bestRally, state.rally);
  afterHit(state, "player", random, events);
}

function cpuReturn(state: GameState, random: () => number, events: GameEvent[]) {
  // The longer the rally, the likelier the computer is to crack, so patience also wins points.
  const fumbles = random() < Math.min(0.35, 0.02 + state.rally * 0.012);
  const aimed = clamp(-state.playerX * 0.55 + (random() - 0.5) * 0.9, -(HALF - 0.1), HALF - 0.1);
  const x = fumbles ? (aimed < 0 ? -1 : 1) * (HALF + 0.25) : aimed;
  launch(state.ball, { x, z: 0.2 + 0.45 * random() }, Math.max(0.62, 0.9 - 0.025 * state.rally), (random() - 0.5) * 2.4);
  state.rally += 1;
  state.bestRally = Math.max(state.bestRally, state.rally);
  afterHit(state, "cpu", random, events);
}

function serve(state: GameState, by: Side, random: () => number, events: GameEvent[]) {
  state.phase = "rally";
  state.rally = 0;
  state.message = "";
  if (by === "player") {
    const x = clamp(state.playerX * 0.4 + state.playerVX * 0.2 + (random() - 0.5) * 0.5, -(HALF - 0.1), HALF - 0.1);
    launch(state.ball, { x, z: TABLE.length * (0.75 + 0.2 * random()) }, 0.85, clamp(state.playerVX * 0.6, -2.5, 2.5));
  } else {
    launch(state.ball, { x: (random() - 0.5) * (TABLE.width - 0.3), z: TABLE.length * (0.08 + 0.17 * random()) }, 0.95, (random() - 0.5) * 2.4);
  }
  afterHit(state, by, random, events);
}

function holdForServe(state: GameState) {
  const { ball } = state;
  const player = state.server === "player";
  ball.x = player ? state.playerX : state.cpuX;
  ball.y = 0.22;
  ball.z = player ? 0.02 : TABLE.length - 0.02;
  ball.vx = ball.vy = ball.vz = ball.spin = 0;
}

function flightStep(state: GameState, random: () => number, events: GameEvent[]) {
  const { ball } = state;
  advance(ball, SUBSTEP);

  if (ball.y <= 0 && ball.vy < 0 && onTable(ball)) {
    reflect(ball);
    events.push({ type: "bounce" });
    const side: Side = ball.z < NET_Z ? "player" : "cpu";
    if (side === state.lastHitter) { score(state, other(state.lastHitter), "落在了自己这边", events); return; }
    state.bounces += 1;
    if (state.bounces >= 2) { score(state, state.lastHitter, "两跳", events); return; }
  }

  if (state.lastHitter === "cpu" && state.bounces === 1 && ball.vz < 0 && ball.z <= PLAYER_Z && ball.z > PLAYER_Z - 0.1 && Math.abs(ball.x - state.playerX) <= PLAYER_REACH && ball.y < 0.9) {
    playerReturn(state, random, events);
    return;
  }
  if (state.lastHitter === "player" && state.bounces === 1 && ball.vz > 0 && ball.z >= CPU_Z && ball.z < CPU_Z + 0.1 && Math.abs(ball.x - state.cpuX) <= CPU_REACH && ball.y < 0.9) {
    cpuReturn(state, random, events);
    return;
  }

  if (ball.y < FLOOR || ball.z < -1.1 || ball.z > TABLE.length + 1.1) {
    if (state.bounces === 0) score(state, other(state.lastHitter), state.lastHitter === "player" ? "出界了" : "对方出界", events);
    else score(state, state.lastHitter, state.lastHitter === "player" ? "好球" : "没接住", events);
  }
}

/** Advances the game. Mutates `state` for speed and returns what happened this frame. */
export function stepGame(state: GameState, dt: number, input: GameInput, random: () => number): GameEvent[] {
  const events: GameEvent[] = [];
  const x = clamp(input.x, -PADDLE_LIMIT, PADDLE_LIMIT);
  if (dt > 0) state.playerVX += ((x - state.playerX) / dt - state.playerVX) * (1 - Math.exp(-dt * 22));
  state.playerX = x;

  if (state.phase === "over") return events;

  const speed = 1.15 + 0.09 * Math.min(state.rally, 10);
  const away = state.cpuTarget - state.cpuX;
  state.cpuX += clamp(away, -speed * dt, speed * dt);

  if (state.phase === "point") {
    state.timer -= dt;
    if (state.timer <= 0) {
      state.phase = "serve";
      state.server = nextServer(state.score);
      state.cpuTarget = 0;
      state.message = "";
      state.timer = 0.9;
    }
    return events;
  }

  if (state.phase === "serve") {
    holdForServe(state);
    if (state.server === "player") {
      if (input.serve) serve(state, "player", random, events);
    } else {
      state.timer -= dt;
      if (state.timer <= 0) serve(state, "cpu", random, events);
    }
    return events;
  }

  for (let t = 0; t < dt && state.phase === "rally"; t += SUBSTEP) flightStep(state, random, events);
  return events;
}
