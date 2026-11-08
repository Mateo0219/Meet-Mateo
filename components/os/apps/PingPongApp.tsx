"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Play, RotateCcw, Video } from "lucide-react";
import { motion } from "motion/react";
import { createGame, CPU_Z, PADDLE_LIMIT, PLAYER_Z, stepGame, TABLE, type Ball, type GameState, type Phase, type Side } from "@/lib/pingpong";
import { bilibiliPlayerUrl, isValidBvid, pingpongVideos, type PingPongVideo } from "@/lib/pingpong-videos";
import { useOS } from "../OSProvider";

type Tab = "play" | "videos";
const BEST_KEY = "mateo-pingpong-best";
const NEAR_DEPTH = 1.25;
const CAMERA_HEIGHT = 1.05;
const HALF = TABLE.width / 2;

interface Hud { score: Record<Side, number>; rally: number; best: number; phase: Phase; server: Side; message: string; winner: Side | null }
const hudOf = (game: GameState): Hud => ({ score: { ...game.score }, rally: game.rally, best: game.bestRally, phase: game.phase, server: game.server, message: game.message, winner: game.winner });

function cameraFor(width: number, height: number) {
  const far = NEAR_DEPTH + TABLE.length;
  const focal = Math.min((width * 0.4 * NEAR_DEPTH) / HALF, (height * 0.62) / (CAMERA_HEIGHT * (1 / NEAR_DEPTH - 1 / far)));
  // Centred on tall screens, where the width limits the table and leaves room above it.
  const tableHeight = CAMERA_HEIGHT * focal * (1 / NEAR_DEPTH - 1 / far);
  const horizon = Math.min(height * 0.86, height / 2 + tableHeight / 2 + height * 0.06) - (CAMERA_HEIGHT * focal) / NEAR_DEPTH;
  const project = (x: number, y: number, z: number) => {
    const scale = focal / Math.max(0.25, z + NEAR_DEPTH);
    return { x: width / 2 + x * scale, y: horizon + (CAMERA_HEIGHT - y) * scale, scale };
  };
  return { focal, project };
}
type Camera = ReturnType<typeof cameraFor>;

function polygon(ctx: CanvasRenderingContext2D, points: { x: number; y: number }[]) {
  ctx.beginPath();
  points.forEach((point, index) => (index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y)));
  ctx.closePath();
}

function drawTable(ctx: CanvasRenderingContext2D, { project }: Camera) {
  const L = TABLE.length;
  const corners = [project(-HALF, 0, L), project(HALF, 0, L), project(HALF, 0, 0), project(-HALF, 0, 0)];
  const [, , nearRight, nearLeft] = corners;
  const thickness = nearRight.scale * 0.05;

  ctx.fillStyle = "rgba(70, 55, 40, 0.13)";
  polygon(ctx, [project(-HALF, -0.16, 0.02), project(HALF, -0.16, 0.02), project(HALF + 0.04, -0.24, -0.04), project(-HALF - 0.04, -0.24, -0.04)]);
  ctx.fill();

  ctx.fillStyle = "#23398f";
  ctx.fillRect(nearLeft.x, nearLeft.y, nearRight.x - nearLeft.x, thickness);

  const surface = ctx.createLinearGradient(0, corners[0].y, 0, nearLeft.y);
  surface.addColorStop(0, "#3a5be0");
  surface.addColorStop(1, "#2f4dc9");
  ctx.fillStyle = surface;
  polygon(ctx, corners);
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.92)";
  ctx.lineWidth = Math.max(1.5, nearRight.scale * 0.016);
  polygon(ctx, corners);
  ctx.stroke();
  ctx.lineWidth = Math.max(1, nearRight.scale * 0.006);
  ctx.beginPath();
  const farCenter = project(0, 0, L), nearCenter = project(0, 0, 0);
  ctx.moveTo(farCenter.x, farCenter.y);
  ctx.lineTo(nearCenter.x, nearCenter.y);
  ctx.stroke();
}

function drawNet(ctx: CanvasRenderingContext2D, { project }: Camera) {
  const z = TABLE.length / 2, overhang = 0.06, height = TABLE.netHeight;
  const a = project(-HALF - overhang, height, z), b = project(HALF + overhang, height, z), c = project(HALF + overhang, 0, z), d = project(-HALF - overhang, 0, z);
  ctx.fillStyle = "rgba(245, 241, 235, 0.42)";
  polygon(ctx, [a, b, c, d]);
  ctx.fill();
  ctx.strokeStyle = "rgba(35, 45, 90, 0.2)";
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  for (let i = 1; i < 30; i += 1) { const x = a.x + ((b.x - a.x) * i) / 30; ctx.moveTo(x, a.y); ctx.lineTo(x, d.y); }
  ctx.stroke();
  ctx.strokeStyle = "#fbf7f1";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  ctx.strokeStyle = "#3b3a44";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y); ctx.lineTo(d.x, d.y);
  ctx.moveTo(b.x, b.y); ctx.lineTo(c.x, c.y);
  ctx.stroke();
}

function drawPaddle(ctx: CanvasRenderingContext2D, { project }: Camera, x: number, z: number, color: string, alpha: number) {
  const center = project(x, 0.17, z), radius = 0.1 * center.scale;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#b98a57";
  ctx.beginPath();
  ctx.roundRect(center.x - radius * 0.17, center.y + radius * 0.8, radius * 0.34, radius * 0.95, radius * 0.1);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(center.x, center.y, radius, radius * 1.05, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

function drawBall(ctx: CanvasRenderingContext2D, { project }: Camera, ball: Ball) {
  if (Math.abs(ball.x) <= HALF && ball.z >= 0 && ball.z <= TABLE.length) {
    const shadow = project(ball.x, 0, ball.z), size = 0.03 * shadow.scale;
    ctx.fillStyle = `rgba(14, 22, 70, ${Math.max(0.12, 0.42 - ball.y * 0.7)})`;
    ctx.beginPath();
    ctx.ellipse(shadow.x, shadow.y, size * 1.25, size * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  const center = project(ball.x, Math.max(ball.y, 0) + 0.02, ball.z), radius = Math.max(2.5, 0.027 * center.scale);
  const fill = ctx.createRadialGradient(center.x - radius * 0.35, center.y - radius * 0.35, radius * 0.1, center.x, center.y, radius);
  fill.addColorStop(0, "#ffffff");
  fill.addColorStop(1, "#e9dfd0");
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function render(ctx: CanvasRenderingContext2D, camera: Camera, game: GameState) {
  drawTable(ctx, camera);
  const netZ = TABLE.length / 2;
  drawPaddle(ctx, camera, game.cpuX, CPU_Z, "#2b2b33", 1);
  if (game.ball.z >= netZ) drawBall(ctx, camera, game.ball);
  drawNet(ctx, camera);
  if (game.ball.z < netZ) drawBall(ctx, camera, game.ball);
  drawPaddle(ctx, camera, game.playerX, PLAYER_Z, "#d8473d", 0.9);
}

function statusText(hud: Hud) {
  if (hud.phase === "over") return hud.winner === "player" ? "你赢了" : "这局输了";
  if (hud.phase === "point") return hud.message;
  if (hud.phase === "serve") return hud.server === "player" ? "点击球台发球" : "对方发球";
  return "";
}

function Game({ paused }: { paused: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameState>(createGame());
  const inputRef = useRef({ x: 0, serve: false });
  const cameraRef = useRef<Camera | null>(null);
  const keysRef = useRef({ left: false, right: false });
  const pausedRef = useRef(paused);
  const [hud, setHud] = useState<Hud>(() => hudOf(gameRef.current));

  useEffect(() => { pausedRef.current = paused; }, [paused]);

  useEffect(() => {
    const stored = Number(window.localStorage.getItem(BEST_KEY));
    if (Number.isFinite(stored) && stored > 0) {
      gameRef.current.bestRally = stored;
      setHud(hudOf(gameRef.current));
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let width = 0, height = 0, frame = 0, last = performance.now();
    const resize = () => {
      // Layout size, not getBoundingClientRect: the window may still be scaled by its opening animation.
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      cameraRef.current = cameraFor(width, height);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const loop = (now: number) => {
      frame = requestAnimationFrame(loop);
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      if (pausedRef.current || document.hidden) return;
      const game = gameRef.current, input = inputRef.current, keys = keysRef.current;
      if (keys.left !== keys.right) input.x = Math.max(-PADDLE_LIMIT, Math.min(PADDLE_LIMIT, input.x + (keys.right ? 1.6 : -1.6) * dt));
      const before = game.phase;
      const events = stepGame(game, dt, input, Math.random);
      input.serve = false;
      if (events.length || game.phase !== before) {
        setHud(hudOf(game));
        if (events.some((event) => event.type === "hit")) window.localStorage.setItem(BEST_KEY, String(game.bestRally));
      }
      ctx.clearRect(0, 0, width, height);
      if (cameraRef.current) render(ctx, cameraRef.current, game);
    };
    frame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  const aim = (event: PointerEvent<HTMLCanvasElement>) => {
    const camera = cameraRef.current;
    if (!camera) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    inputRef.current.x = (event.clientX - bounds.left - bounds.width / 2) / (camera.focal / (NEAR_DEPTH + PLAYER_Z));
  };

  const onKey = (event: KeyboardEvent<HTMLCanvasElement>, down: boolean) => {
    if (event.key === "ArrowLeft") { keysRef.current.left = down; event.preventDefault(); }
    if (event.key === "ArrowRight") { keysRef.current.right = down; event.preventDefault(); }
    if (down && (event.key === " " || event.key === "Enter")) { inputRef.current.serve = true; event.preventDefault(); }
  };

  const restart = () => {
    gameRef.current = createGame(gameRef.current.bestRally);
    setHud(hudOf(gameRef.current));
    canvasRef.current?.focus({ preventScroll: true });
  };

  const status = statusText(hud);
  return (
    <div className="pp-game">
      <div className="pp-hud">
        <div className="pp-score" aria-label={`比分：你 ${hud.score.player}，电脑 ${hud.score.cpu}`}>
          <span>你</span><strong>{hud.score.player}</strong><i>:</i><strong>{hud.score.cpu}</strong><span>电脑</span>
        </div>
        <div className="pp-stats"><span>回合 <b>{hud.rally}</b></span><span>最长 <b>{hud.best}</b></span></div>
        <button type="button" className="pp-restart" onClick={restart} aria-label="重新开始"><RotateCcw size={15} aria-hidden="true" /></button>
      </div>
      <div className="pp-stage">
        <canvas
          ref={canvasRef}
          className="pp-canvas"
          tabIndex={0}
          aria-label="乒乓球台。移动鼠标或手指控制球拍，点击发球；也可以用左右方向键移动，空格发球。"
          onPointerMove={aim}
          onPointerDown={(event) => { aim(event); inputRef.current.serve = true; }}
          onKeyDown={(event) => onKey(event, true)}
          onKeyUp={(event) => onKey(event, false)}
          onBlur={() => { keysRef.current = { left: false, right: false }; }}
        />
        <p className="pp-status" aria-live="polite" data-visible={Boolean(status)}>{status}</p>
        {hud.phase === "over" && <button type="button" className="pp-again" onClick={restart}>再来一局</button>}
      </div>
      <p className="pp-hint">挥拍方向决定落点和旋转，挥太猛会出界。先到 11 分获胜。</p>
    </div>
  );
}

function VideoCard({ video }: { video: PingPongVideo }) {
  const [playing, setPlaying] = useState(false);
  if (!isValidBvid(video.bvid)) return null;
  return (
    <article className="pp-video">
      {playing ? (
        <iframe src={bilibiliPlayerUrl(video.bvid)} title={video.title} allow="autoplay; fullscreen" allowFullScreen sandbox="allow-scripts allow-same-origin allow-popups allow-presentation" />
      ) : (
        <button type="button" className="pp-video-start" aria-label={`播放 ${video.title}`} onClick={() => setPlaying(true)}><Play size={22} fill="currentColor" aria-hidden="true" /></button>
      )}
      <div className="pp-video-copy"><strong>{video.title}</strong>{video.date && <span>{video.date}</span>}</div>
    </article>
  );
}

function Videos({ onPlay }: { onPlay: () => void }) {
  if (pingpongVideos.length === 0) {
    return (
      <div className="pp-empty">
        <Video size={26} strokeWidth={1.4} aria-hidden="true" />
        <strong>打球的片段还在整理</strong>
        <p>等剪好了放在这里。现在可以先来一局。</p>
        <button type="button" onClick={onPlay}>去打一局</button>
      </div>
    );
  }
  return <div className="pp-videos">{pingpongVideos.map((video) => <VideoCard key={video.id} video={video} />)}</div>;
}

const tabs: { id: Tab; label: string }[] = [{ id: "play", label: "打一局" }, { id: "videos", label: "我的球" }];

export default function PingPongApp() {
  const { activeId } = useOS();
  const [tab, setTab] = useState<Tab>("play");
  const showGame = useCallback(() => setTab("play"), []);

  return (
    <div className="pingpong-app">
      <div className="pp-toolbar">
        <div className="lens-switch" role="group" aria-label="乒乓球内容">
          {tabs.map((item) => (
            <button key={item.id} type="button" className={tab === item.id ? "is-active" : undefined} aria-pressed={tab === item.id} onClick={() => setTab(item.id)}>
              {tab === item.id && <motion.span layoutId="pingpong-tab" className="lens-indicator" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
              {item.label}
            </button>
          ))}
        </div>
      </div>
      {tab === "play" ? <Game paused={activeId !== "pingpong"} /> : <Videos onPlay={showGame} />}
    </div>
  );
}
