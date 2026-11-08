"use client";

/* eslint-disable @next/next/no-img-element -- small local SVG avatar, no optimisation needed */

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { ARRIVAL_LINES, followRoute, maps, THOUGHT_REACH, TODOS, WALK_SPEED, type GameMap, type MapId, type Place, type Point, type TodoId } from "@/lib/world";
import { AVATAR_SRC } from "@/lib/os-apps";
import { useOS } from "../os/OSProvider";
import { buildGround, buildSprites, drawClockHands, drawFlames, drawMateo, drawSteam, drawThought, drawTrain, lightsFor, RENDER_SCALE, type Actor, type Light, type Sprite } from "./art";

const STORAGE_KEY = "mateo-world-day";
const LOOK = { width: 1250, height: 800 };
const MINIMAP = { width: 196, height: 126 };
const TRAVEL_MS = 1000;

type Period = "day" | "dusk" | "night";
const periodOf = (hour: number): Period => (hour >= 19 || hour < 6 ? "night" : hour >= 17 ? "dusk" : "day");
interface Talk { speaker: string; lines: string[]; index: number; after?: () => void }
interface Assets { ground: HTMLCanvasElement; sprites: Sprite[]; lights: Light[] }

const scaleFor = (width: number, height: number) => Math.max(0.62, Math.min(1.2, Math.min(width / LOOK.width, height / LOOK.height)));
const clampCamera = (value: number, half: number, size: number) => (half * 2 >= size ? size / 2 : Math.max(half, Math.min(size - half, value)));

export default function World() {
  const { openApp, activeId, clock, isMobile } = useOS();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const miniRef = useRef<HTMLCanvasElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);
  const game = useRef({
    map: maps.island as GameMap,
    actor: { x: maps.island.spawn.x, y: maps.island.spawn.y, facing: "down", walk: 0, moving: false } as Actor,
    route: [] as Point[],
    arrive: null as Place | null,
    camera: { x: maps.island.spawn.x, y: maps.island.spawn.y },
    keys: new Set<string>(),
    stick: { x: 0, y: 0 },
    thoughts: new Set<string>(),
    todos: new Set<TodoId>(),
    revealed: false,
    time: 0,
    view: { width: 0, height: 0, scale: 1 },
    near: null as Place | null,
    stuck: 0,
    travelling: false,
  });
  const assets = useRef(new Map<MapId, Assets>());
  const [mapId, setMapId] = useState<MapId>("island");
  const [near, setNear] = useState<Place | null>(null);
  const [talk, setTalk] = useState<Talk | null>(null);
  const [found, setFound] = useState(0);
  const [done, setDone] = useState<TodoId[]>([]);
  const [opening, setOpening] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [fade, setFade] = useState<string | null>(null);
  const [forcedPeriod, setForcedPeriod] = useState<Period | null>(null);
  const pendingTalk = useRef<Talk | null>(null);
  const period = forcedPeriod ?? (clock ? periodOf(clock.hour) : "day");
  const map = maps[mapId];

  const blocked = useRef(false);
  blocked.current = Boolean(activeId || talk || opening || fade);
  const periodRef = useRef(period);
  periodRef.current = period;
  const clockRef = useRef(clock);
  clockRef.current = clock;

  const assetsFor = useCallback((id: MapId): Assets => {
    let entry = assets.current.get(id);
    if (!entry) {
      entry = { ground: buildGround(maps[id]), sprites: buildSprites(maps[id]), lights: lightsFor(maps[id]) };
      assets.current.set(id, entry);
    }
    return entry;
  }, []);

  const save = useCallback(() => {
    const { thoughts, todos, revealed } = game.current;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ thoughts: [...thoughts], todos: [...todos], revealed }));
  }, []);

  const screenRect = useCallback((point: Point) => {
    const { camera, view } = game.current;
    return { x: (point.x - camera.x) * view.scale + view.width / 2 - 30, y: (point.y - camera.y) * view.scale + view.height / 2 - 60, width: 60, height: 60 };
  }, []);

  const travel = useCallback((to: MapId) => {
    const state = game.current;
    if (state.travelling) return;
    state.travelling = true;
    state.route = [];
    state.arrive = null;
    setFade(to === "eshan" ? "飞往峨山 ✈" : "飞回 Mateo 岛 ✈");
    window.setTimeout(() => {
      assetsFor(to);
      const target = maps[to];
      const returning = to === "island";
      const spot = returning ? target.placeById.airport : target.spawn;
      state.map = target;
      state.actor.x = spot.x;
      state.actor.y = spot.y;
      state.camera = { x: spot.x, y: spot.y };
      state.near = null;
      setNear(null);
      setMapId(to);
      setFade(null);
      state.travelling = false;
      if (ARRIVAL_LINES[to].length) setTalk({ speaker: "Mateo", lines: ARRIVAL_LINES[to], index: 0 });
    }, TRAVEL_MS);
  }, [assetsFor]);

  const completeTodo = useCallback((id: TodoId) => {
    const state = game.current;
    if (state.todos.has(id)) return;
    state.todos.add(id);
    setDone([...state.todos]);
    save();
    if (state.todos.size === TODOS.length) pendingTalk.current = { speaker: "Mateo", lines: ["这就是我的一天。", "谢谢你替我过完。岛上还藏着 9 个念头，想找就继续逛。"], index: 0 };
  }, [save]);

  const interact = useCallback((target: Place) => {
    const state = game.current;
    if (target.id === "workshop" && state.thoughts.size === maps.island.thoughts.length && !state.revealed) {
      state.revealed = true;
      save();
      setTalk({ speaker: "Mateo", lines: ["九个念头凑齐了，它们变成了一个东西。", "就是这座岛。"], index: 0, after: () => openApp("notes", { payload: "site", origin: screenRect(target) }) });
      return;
    }
    if (target.todo) completeTodo(target.todo);
    if (target.action.kind === "app") openApp(target.action.app, { payload: target.action.payload, origin: screenRect(target) });
    else if (target.action.kind === "travel") travel(target.action.to);
    else setTalk({ speaker: target.speaker ?? target.name, lines: target.lines ?? [], index: 0 });
  }, [completeTodo, openApp, save, screenRect, travel]);

  const advanceTalk = useCallback(() => {
    setTalk((current) => {
      if (current && current.index < current.lines.length - 1) return { ...current, index: current.index + 1 };
      current?.after?.();
      return null;
    });
  }, []);

  // Anything said while an app was open waits until the visitor is back on the island.
  useEffect(() => {
    if (!activeId && !talk && pendingTalk.current) {
      setTalk(pendingTalk.current);
      pendingTalk.current = null;
    }
  }, [activeId, talk]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("t");
    if (requested === "day" || requested === "dusk" || requested === "night") setForcedPeriod(requested);
    if (params.has("skip") || window.location.hash) setOpening(false);
    const state = game.current;
    try {
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as { thoughts?: unknown; todos?: unknown; revealed?: unknown };
      if (Array.isArray(saved.thoughts)) for (const id of saved.thoughts) if (maps.island.thoughts.some((item) => item.id === id)) state.thoughts.add(id);
      if (Array.isArray(saved.todos)) for (const id of saved.todos) if (TODOS.some((todo) => todo.id === id)) state.todos.add(id);
      state.revealed = saved.revealed === true;
    } catch { /* A corrupt save just starts a new day. */ }
    setFound(state.thoughts.size);
    setDone([...state.todos]);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current, ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const state = game.current;
    assetsFor("island");
    setLoaded(true);

    let ratio = 1;
    const resize = () => {
      ratio = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.clientWidth, height = canvas.clientHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      state.view = { width, height, scale: scaleFor(width, height) };
    };
    resize();
    window.addEventListener("resize", resize);

    const face = (dx: number, dy: number) => {
      if (Math.abs(dx) > Math.abs(dy)) state.actor.facing = dx > 0 ? "right" : "left";
      else state.actor.facing = dy > 0 ? "down" : "up";
    };

    const update = (dt: number) => {
      state.time += dt;
      const { actor, map: current } = state;
      let dx = 0, dy = 0;
      if (!blocked.current) {
        const keys = state.keys;
        dx = (keys.has("right") ? 1 : 0) - (keys.has("left") ? 1 : 0) + state.stick.x;
        dy = (keys.has("down") ? 1 : 0) - (keys.has("up") ? 1 : 0) + state.stick.y;
      }
      const length = Math.hypot(dx, dy), step = WALK_SPEED * dt;
      actor.moving = false;
      if (length > 0.08) {
        state.route = [];
        state.arrive = null;
        const speed = Math.min(1, length);
        const next = current.moveWithCollision(actor, (dx / length) * step * speed, (dy / length) * step * speed);
        actor.moving = next.x !== actor.x || next.y !== actor.y;
        actor.x = next.x; actor.y = next.y;
        face(dx, dy);
      } else if (state.route.length && !blocked.current) {
        const { position, route, dx: mx, dy: my } = followRoute(current, actor, state.route, step);
        const moved = Math.hypot(position.x - actor.x, position.y - actor.y);
        state.route = route;
        state.stuck = route.length && moved < step * 0.2 && (mx || my) ? state.stuck + dt : 0;
        actor.moving = moved > 0;
        actor.x = position.x; actor.y = position.y;
        if (mx || my) face(mx, my);
        if (state.stuck > 0.5) { state.route = []; state.arrive = null; state.stuck = 0; }
        if (!state.route.length && state.arrive) { const target = state.arrive; state.arrive = null; interact(target); }
      }
      if (actor.moving) actor.walk += dt;

      for (const item of current.thoughts) {
        if (!state.thoughts.has(item.id) && Math.hypot(item.x - actor.x, item.y - actor.y) < THOUGHT_REACH) {
          state.thoughts.add(item.id);
          setFound(state.thoughts.size);
          save();
          if (state.thoughts.size === maps.island.thoughts.length) setTalk({ speaker: "Mateo", lines: ["九个念头都找到了。", "送到工作室去，看看它们能变成什么。"], index: 0 });
        }
      }
      const nextNear = current.nearestPlace(actor);
      if (nextNear !== state.near) { state.near = nextNear; setNear(nextNear); }
    };

    const render = () => {
      const { width, height, scale } = state.view, { actor, map: current } = state;
      const art = assets.current.get(current.id);
      if (!art) return;
      const halfW = width / 2 / scale, halfH = height / 2 / scale;
      state.camera.x += (clampCamera(actor.x, halfW, current.width) - state.camera.x) * 0.13;
      state.camera.y += (clampCamera(actor.y, halfH, current.height) - state.camera.y) * 0.13;
      const left = state.camera.x - halfW, top = state.camera.y - halfH;
      const world = () => ctx.setTransform(ratio * scale, 0, 0, ratio * scale, -left * ratio * scale, -top * ratio * scale);

      world();
      ctx.fillStyle = current.island ? "#8ec2cf" : "#f1e6d2";
      ctx.fillRect(left, top, halfW * 2, halfH * 2);
      const sourceX = Math.max(0, left), sourceY = Math.max(0, top), sourceW = Math.min(current.width - sourceX, halfW * 2), sourceH = Math.min(current.height - sourceY, halfH * 2);
      ctx.drawImage(art.ground, sourceX * RENDER_SCALE, sourceY * RENDER_SCALE, sourceW * RENDER_SCALE, sourceH * RENDER_SCALE, sourceX, sourceY, sourceW, sourceH);

      const items: { y: number; draw: () => void }[] = [];
      for (const sprite of art.sprites) {
        if (sprite.x > left + halfW * 2 || sprite.x + sprite.width < left || sprite.y > top + halfH * 2 || sprite.y + sprite.height < top) continue;
        items.push({ y: sprite.sortY, draw: () => ctx.drawImage(sprite.canvas, sprite.x, sprite.y, sprite.width, sprite.height) });
      }
      for (const item of current.thoughts) if (!state.thoughts.has(item.id)) items.push({ y: item.y, draw: () => drawThought(ctx, item.x, item.y, state.time) });
      for (const s of current.structures) {
        if (s.kind === "firepit") items.push({ y: s.y + 1, draw: () => drawFlames(ctx, s.x, s.y - 8, state.time) });
        if (s.kind === "breakfast") items.push({ y: s.y + 1, draw: () => drawSteam(ctx, s.x + 75, s.y - 60, state.time) });
        if (s.kind === "clocktower" && clockRef.current) { const { hour, minute } = clockRef.current; items.push({ y: s.y + 1, draw: () => drawClockHands(ctx, s.x, s.y - 196, hour, minute) }); }
      }
      items.push({ y: actor.y, draw: () => drawMateo(ctx, actor) });
      if (current.rail && current.train) { const { rail, train } = current; items.push({ y: rail.y, draw: () => drawTrain(ctx, train.headX, rail.y, train.cars) }); }
      items.sort((a, b) => a.y - b.y);
      items.forEach((item) => item.draw());

      const mode = periodRef.current;
      if (mode !== "day") {
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        ctx.fillStyle = mode === "night" ? "rgba(30,36,84,0.5)" : "rgba(226,126,62,0.2)";
        ctx.fillRect(0, 0, width, height);
        ctx.globalCompositeOperation = "lighter";
        for (const light of art.lights) {
          const x = (light.x - left) * scale, y = (light.y - top) * scale, radius = light.r * scale * (mode === "night" ? 1 : 0.7);
          if (x < -radius || y < -radius || x > width + radius || y > height + radius) continue;
          const flicker = light.color === "255,150,70" ? 0.04 * Math.sin(state.time * 11) : 0;
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
          gradient.addColorStop(0, `rgba(${light.color},${(mode === "night" ? 0.42 : 0.16) + flicker})`);
          gradient.addColorStop(1, `rgba(${light.color},0)`);
          ctx.fillStyle = gradient;
          ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
        }
        ctx.globalCompositeOperation = "source-over";
        world();
      }

      ctx.font = '700 15px "Microsoft YaHei","PingFang SC",sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const place of current.places) {
        const y = place.y + 34, boxW = ctx.measureText(place.name).width + 20, active = state.near?.id === place.id;
        // A sign never covers the main character.
        if (Math.abs(place.x - actor.x) < boxW / 2 + 22 && y > actor.y - 78 && y < actor.y + 8) continue;
        ctx.fillStyle = active ? "#2f4dc9" : "rgba(255,250,238,0.92)";
        ctx.strokeStyle = "#3b3029";
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.roundRect(place.x - boxW / 2, y - 13, boxW, 26, 7); ctx.fill(); ctx.stroke();
        ctx.fillStyle = active ? "#ffffff" : "#3b3029";
        ctx.fillText(place.name, place.x, y + 1);
      }

      if (dotRef.current) {
        dotRef.current.style.left = `${(actor.x / current.width) * 100}%`;
        dotRef.current.style.top = `${(actor.y / current.height) * 100}%`;
      }
    };

    let frame = 0, last = performance.now();
    const loop = (now: number) => {
      frame = requestAnimationFrame(loop);
      const dt = Math.min((now - last) / 1000, 1 / 20);
      last = now;
      if (document.hidden) return;
      update(dt);
      render();
    };
    frame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [assetsFor, interact, save]);

  // The minimap mounts with the HUD and follows the current map.
  useEffect(() => {
    const canvas = miniRef.current, art = assets.current.get(mapId);
    if (!canvas || !art) return;
    canvas.width = MINIMAP.width * 2;
    canvas.height = MINIMAP.height * 2;
    canvas.getContext("2d")?.drawImage(art.ground, 0, 0, canvas.width, canvas.height);
  }, [mapId, opening, loaded, activeId]);

  useEffect(() => {
    const direction: Record<string, string> = { ArrowUp: "up", KeyW: "up", ArrowDown: "down", KeyS: "down", ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right" };
    const typing = (event: KeyboardEvent) => event.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName);
    const down = (event: KeyboardEvent) => {
      if (typing(event) || activeId) return;
      if (opening) {
        if (event.code === "Space" || event.code === "Enter") { event.preventDefault(); setOpening(false); }
        return;
      }
      const name = direction[event.code];
      if (name) { game.current.keys.add(name); event.preventDefault(); return; }
      if (event.code === "Escape") { setTalk(null); return; }
      if (event.code === "Space" || event.code === "Enter" || event.code === "KeyE") {
        if (event.target instanceof HTMLButtonElement) return;
        event.preventDefault();
        if (talk) advanceTalk();
        else if (game.current.near && !fade) interact(game.current.near);
      }
    };
    const up = (event: KeyboardEvent) => {
      const name = direction[event.code];
      if (name) game.current.keys.delete(name);
    };
    const release = () => game.current.keys.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", release);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", release);
    };
  }, [activeId, advanceTalk, fade, interact, opening, talk]);

  const onCanvasPointer = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const state = game.current;
    if (blocked.current) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const target = { x: (event.clientX - bounds.left - state.view.width / 2) / state.view.scale + state.camera.x, y: (event.clientY - bounds.top - state.view.height / 2) / state.view.scale + state.camera.y };
    const place = state.map.places.find((item) => Math.hypot(item.x - target.x, item.y - target.y) < 80);
    if (place) { state.route = state.map.routeTo(state.actor, place); state.arrive = place; return; }
    if (state.map.isWalkable(target.x, target.y)) { state.route = state.map.routeTo(state.actor, target); state.arrive = null; }
  };

  const teleport = (place: Place) => {
    const state = game.current;
    state.actor.x = place.x;
    state.actor.y = place.y;
    state.route = [];
    state.arrive = null;
  };

  const stickRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLSpanElement>(null);
  const moveStick = (event: ReactPointerEvent<HTMLDivElement>) => {
    const bounds = stickRef.current!.getBoundingClientRect();
    const dx = event.clientX - bounds.left - bounds.width / 2, dy = event.clientY - bounds.top - bounds.height / 2, reach = bounds.width / 2 - 20, distance = Math.hypot(dx, dy);
    const clamped = Math.min(distance, reach), nx = distance ? (dx / distance) * clamped : 0, ny = distance ? (dy / distance) * clamped : 0;
    game.current.stick = { x: nx / reach, y: ny / reach };
    if (knobRef.current) knobRef.current.style.transform = `translate(${nx}px, ${ny}px)`;
  };
  const stopStick = () => {
    game.current.stick = { x: 0, y: 0 };
    if (knobRef.current) knobRef.current.style.transform = "";
  };

  const showHud = (!activeId || !isMobile) && !opening;
  const onIsland = mapId === "island";
  const total = maps.island.thoughts.length;

  return (
    <main className="world" data-period={period} data-loaded={loaded}>
      <h1 className="sr-only">Mateo 岛：今天换你来当 Mateo</h1>
      <canvas ref={canvasRef} className="world-canvas" aria-label="可以走动的 Mateo 岛地图。可以用方向键走路，也可以用右上角的地点列表直接前往。" onPointerDown={onCanvasPointer} />

      {opening && (
        <div className="world-card" role="dialog" aria-label="开场">
          <img src={AVATAR_SRC} alt="" width={76} height={89} />
          <h2>嗨，我是 Mateo。<br />今天换你来当我。</h2>
          <p>我用 AI 把脑子里的念头做成能用的东西，有空就打乒乓球。这座岛上的一切，都是我。</p>
          <button type="button" autoFocus onClick={() => setOpening(false)}>开始这一天</button>
        </div>
      )}

      {showHud && (
        <>
          <div className="world-side">
            <div className="world-badge"><strong>{onIsland ? "Mateo 岛" : "峨山 · 我长大的地方"}</strong>{onIsland && <span>{found === total ? "念头集齐了" : `念头 ${found} / ${total}`}</span>}</div>
            {onIsland && (
              <ul className="world-todos" aria-label="今天的待办">
                {TODOS.map((todo) => <li key={todo.id} className={done.includes(todo.id) ? "is-done" : undefined}><i aria-hidden="true">{done.includes(todo.id) ? "✓" : ""}</i>{todo.label}</li>)}
              </ul>
            )}
          </div>
          <nav className="world-map" aria-label="小地图">
            <canvas ref={miniRef} style={{ width: MINIMAP.width, height: MINIMAP.height }} aria-hidden="true" />
            <span ref={dotRef} className="world-map-me" aria-hidden="true" />
            {map.places.map((place) => <button key={place.id} type="button" style={{ left: `${(place.x / map.width) * 100}%`, top: `${(place.y / map.height) * 100}%` }} title={`${place.name} · ${place.hint}`} aria-label={`去${place.name}（${place.hint}）`} onClick={(event) => { teleport(place); event.currentTarget.blur(); }} />)}
          </nav>
          {near && !talk && !activeId && !fade && (
            <button type="button" className="world-prompt" onClick={() => { if (game.current.near) interact(game.current.near); }}>
              <span>{near.name}<small>{near.hint}</small></span><b>{near.verb}</b>
            </button>
          )}
          {!near && !talk && !fade && <p className="world-hint">方向键走路 · 点地面自动走过去</p>}
          {!activeId && (
            <div ref={stickRef} className="world-stick" role="presentation" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); moveStick(event); }} onPointerMove={(event) => { if (event.buttons || event.pointerType === "touch") moveStick(event); }} onPointerUp={stopStick} onPointerCancel={stopStick}>
              <span ref={knobRef} />
            </div>
          )}
        </>
      )}
      {talk && (
        <button type="button" className="world-talk" onClick={advanceTalk} autoFocus>
          <strong>{talk.speaker}</strong>
          <span>{talk.lines[talk.index]}</span>
          <small>{talk.index < talk.lines.length - 1 ? "继续 ▸" : "知道了"}</small>
        </button>
      )}
      {fade && <div className="world-fade" role="status">{fade}</div>}
    </main>
  );
}
