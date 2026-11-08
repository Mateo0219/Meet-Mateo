"use client";

/* eslint-disable @next/next/no-img-element -- user photos of unknown size from local or Supabase storage */

import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Camera, ChevronLeft, ChevronRight, Heart, ImagePlus, LogOut, MapPin, Trash2, X } from "lucide-react";
import { formatMomentTime, MAX_IMAGES, MAX_LOCATION, MAX_TEXT, type Moment, type MomentsPage } from "@/lib/moments";
import { AVATAR_SRC } from "../Widgets";

const LIKED_KEY = "mateo-moments-liked";
const MAX_EDGE = 1600;

const readLiked = (): Set<string> => {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(LIKED_KEY) ?? "[]");
    return new Set(Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []);
  } catch {
    return new Set();
  }
};

async function errorText(response: Response, fallback: string) {
  const body = (await response.json().catch(() => null)) as { error?: unknown } | null;
  return typeof body?.error === "string" ? body.error : fallback;
}

/** Re-encoding keeps uploads small and strips location data from phone photos. */
async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file).catch(() => { throw new Error("这张图读不了，换一张试试"); });
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const encode = (type: string) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.84));
  const webp = await encode("image/webp");
  // Safari quietly falls back to PNG for WebP; JPEG is far smaller for photos.
  const blob = webp?.type === "image/webp" ? webp : await encode("image/jpeg");
  if (!blob) throw new Error("图片处理失败");
  return blob;
}

function Modal({ label, onClose, className, children }: { label: string; onClose: () => void; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    return () => previous?.focus?.({ preventScroll: true });
  }, []);
  return (
    <div className={`moments-overlay${className ? ` ${className}` : ""}`} data-modal onPointerDown={(event) => { if (event.target === event.currentTarget) onClose(); }} onKeyDown={(event) => { if (event.key === "Escape") { event.stopPropagation(); onClose(); } }}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={label} className="moments-dialog">{children}</div>
    </div>
  );
}

function LoginDialog({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const response = await fetch("/api/moments/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) }).catch(() => null);
    setBusy(false);
    if (response?.ok) onDone();
    else setError(response ? await errorText(response, "登录失败") : "网络出错了");
  };
  return (
    <Modal label="登录" onClose={onClose}>
      <form className="moments-login" onSubmit={submit}>
        <h3>我是 Mateo</h3>
        <input data-autofocus type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="发布密码" aria-label="发布密码" autoComplete="current-password" />
        {error && <p role="alert" className="moments-error">{error}</p>}
        <div className="moments-form-actions">
          <button type="button" onClick={onClose}>取消</button>
          <button type="submit" className="is-primary" disabled={busy || !password}>{busy ? "登录中…" : "登录"}</button>
        </div>
      </form>
    </Modal>
  );
}

interface DraftImage { key: string; file: File; preview: string; uploaded?: string }

function Composer({ onClose, onPosted }: { onClose: () => void; onPosted: (moment: Moment) => void }) {
  const [text, setText] = useState("");
  const [location, setLocation] = useState("");
  const [images, setImages] = useState<DraftImage[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const previews = useRef(new Set<string>());
  const busy = status !== null;

  useEffect(() => {
    const urls = previews.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const room = MAX_IMAGES - images.length;
    if (files.length > room) setError(`最多 ${MAX_IMAGES} 张图`);
    const added = Array.from(files).slice(0, room).map((file) => {
      const preview = URL.createObjectURL(file);
      previews.current.add(preview);
      return { key: preview, file, preview };
    });
    setImages((current) => [...current, ...added]);
  };

  const removeImage = (key: string) => {
    URL.revokeObjectURL(key);
    previews.current.delete(key);
    setImages((current) => current.filter((image) => image.key !== key));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      const names: string[] = [];
      for (const [index, image] of images.entries()) {
        // Keep finished uploads, so retrying after a failure doesn't send them twice.
        if (!image.uploaded) {
          setStatus(`上传第 ${index + 1}/${images.length} 张…`);
          const blob = await compressImage(image.file);
          const response = await fetch("/api/moments/images", { method: "POST", headers: { "Content-Type": blob.type }, body: blob });
          if (!response.ok) throw new Error(await errorText(response, "上传失败，请重试"));
          image.uploaded = ((await response.json()) as { name: string }).name;
        }
        names.push(image.uploaded);
      }
      setStatus("发表中…");
      const response = await fetch("/api/moments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, location, images: names }) });
      if (!response.ok) throw new Error(await errorText(response, "发表失败，请重试"));
      onPosted((await response.json()) as Moment);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "发表失败，请重试");
      setStatus(null);
    }
  };

  return (
    <Modal label="发表动态" onClose={() => { if (!busy) onClose(); }} className="is-sheet">
      <form className="moments-composer" onSubmit={submit}>
        <div className="moments-composer-head">
          <button type="button" onClick={onClose} disabled={busy}>取消</button>
          <button type="submit" className="is-primary" disabled={busy || (!text.trim() && images.length === 0)}>{status ?? "发表"}</button>
        </div>
        <textarea data-autofocus value={text} onChange={(event) => setText(event.target.value)} maxLength={MAX_TEXT} placeholder="这一刻的想法…" aria-label="这一刻的想法" />
        <div className="moments-picker">
          {images.map((image) => (
            <div key={image.key} className="moments-picked">
              <img src={image.preview} alt="" />
              <button type="button" aria-label="移除这张图" onClick={() => removeImage(image.key)} disabled={busy}><X size={13} aria-hidden="true" /></button>
            </div>
          ))}
          {images.length < MAX_IMAGES && (
            <label className="moments-add">
              <ImagePlus size={24} strokeWidth={1.4} aria-hidden="true" />
              <span className="sr-only">添加图片</span>
              <input type="file" accept="image/*" multiple disabled={busy} onChange={(event) => { addFiles(event.target.files); event.target.value = ""; }} />
            </label>
          )}
        </div>
        <label className="moments-location">
          <MapPin size={15} aria-hidden="true" />
          <input value={location} onChange={(event) => setLocation(event.target.value)} maxLength={MAX_LOCATION} placeholder="所在位置" aria-label="所在位置" />
        </label>
        {error && <p role="alert" className="moments-error">{error}</p>}
      </form>
    </Modal>
  );
}

function Lightbox({ images, start, onClose }: { images: string[]; start: number; onClose: () => void }) {
  const [index, setIndex] = useState(start);
  const move = (step: number) => setIndex((current) => (current + step + images.length) % images.length);
  return (
    <div onKeyDown={(event) => { if (event.key === "ArrowLeft") move(-1); if (event.key === "ArrowRight") move(1); }}>
      <Modal label="查看图片" onClose={onClose} className="is-lightbox">
        <img src={images[index]} alt={`第 ${index + 1} 张，共 ${images.length} 张`} />
        <button type="button" data-autofocus className="moments-lightbox-close" aria-label="关闭" onClick={onClose}><X size={18} aria-hidden="true" /></button>
        {images.length > 1 && (
          <>
            <button type="button" className="moments-lightbox-nav is-prev" aria-label="上一张" onClick={() => move(-1)}><ChevronLeft size={22} aria-hidden="true" /></button>
            <button type="button" className="moments-lightbox-nav is-next" aria-label="下一张" onClick={() => move(1)}><ChevronRight size={22} aria-hidden="true" /></button>
          </>
        )}
      </Modal>
    </div>
  );
}

function Post({ moment, now, owner, liked, onLike, onDelete, onOpenImage }: { moment: Moment; now: Date; owner: boolean; liked: boolean; onLike: () => void; onDelete: () => Promise<void>; onOpenImage: (index: number) => void }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  return (
    <li className="moments-post">
      <img className="moments-avatar" src={AVATAR_SRC} alt="" width={42} height={49} />
      <div className="moments-body">
        <strong>Mateo</strong>
        {moment.text && <p className="moments-text">{moment.text}</p>}
        {moment.images.length > 0 && (
          <div className="moments-grid" data-count={moment.images.length}>
            {moment.images.map((src, index) => <button key={src} type="button" aria-label={`查看第 ${index + 1} 张图`} onClick={() => onOpenImage(index)}><img src={src} alt="" loading="lazy" /></button>)}
          </div>
        )}
        {moment.location && <span className="moments-place">{moment.location}</span>}
        <div className="moments-meta">
          <time dateTime={moment.createdAt}>{formatMomentTime(moment.createdAt, now)}</time>
          {owner && !confirming && <button type="button" className="moments-delete" onClick={() => setConfirming(true)}><Trash2 size={13} aria-hidden="true" /> 删除</button>}
          {owner && confirming && (
            <span className="moments-confirm">
              <button type="button" disabled={deleting} onClick={async () => { setDeleting(true); await onDelete(); setDeleting(false); setConfirming(false); }}>{deleting ? "删除中…" : "确认删除"}</button>
              <button type="button" disabled={deleting} onClick={() => setConfirming(false)}>取消</button>
            </span>
          )}
          <button type="button" className={`moments-like${liked ? " is-liked" : ""}`} aria-pressed={liked} aria-label={`点赞，当前 ${moment.likes}`} onClick={onLike}>
            <Heart size={15} fill={liked ? "currentColor" : "none"} aria-hidden="true" /> {moment.likes > 0 ? moment.likes : ""}
          </button>
        </div>
      </div>
    </li>
  );
}

export default function MomentsApp() {
  const [moments, setMoments] = useState<Moment[]>([]);
  const [owner, setOwner] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [nextBefore, setNextBefore] = useState<string | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [loadingMore, setLoadingMore] = useState(false);
  const [dialog, setDialog] = useState<"login" | "compose" | null>(null);
  const [viewing, setViewing] = useState<{ images: string[]; index: number } | null>(null);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());

  const load = useCallback(async () => {
    const response = await fetch("/api/moments").catch(() => null);
    if (!response?.ok) { setState("error"); return; }
    const page = (await response.json()) as MomentsPage;
    setMoments(page.moments);
    setOwner(page.owner);
    setEnabled(page.enabled);
    setNextBefore(page.nextBefore);
    setNow(new Date());
    setState("ready");
  }, []);

  useEffect(() => {
    void load();
    setLiked(readLiked());
    const interval = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(interval);
  }, [load]);

  const loadMore = async () => {
    if (!nextBefore) return;
    setLoadingMore(true);
    const response = await fetch(`/api/moments?before=${encodeURIComponent(nextBefore)}`).catch(() => null);
    setLoadingMore(false);
    if (!response?.ok) { setNotice("加载失败，再试一次"); return; }
    const page = (await response.json()) as MomentsPage;
    setMoments((current) => [...current, ...page.moments]);
    setNextBefore(page.nextBefore);
  };

  const toggleLike = async (moment: Moment) => {
    const wasLiked = liked.has(moment.id);
    const delta = wasLiked ? -1 : 1;
    const remember = (on: boolean) => setLiked((current) => {
      const next = new Set(current);
      if (on) next.add(moment.id); else next.delete(moment.id);
      window.localStorage.setItem(LIKED_KEY, JSON.stringify([...next]));
      return next;
    });
    const setLikes = (value: number) => setMoments((current) => current.map((item) => (item.id === moment.id ? { ...item, likes: value } : item)));
    remember(!wasLiked);
    setLikes(Math.max(0, moment.likes + delta));
    const response = await fetch(`/api/moments/${moment.id}/like`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ delta }) }).catch(() => null);
    if (response?.ok) {
      setLikes(((await response.json()) as { likes: number }).likes);
    } else {
      remember(wasLiked);
      setLikes(moment.likes);
      setNotice("点赞失败，再试一次");
    }
  };

  const remove = async (id: string) => {
    const response = await fetch(`/api/moments/${id}`, { method: "DELETE" }).catch(() => null);
    if (response?.ok) setMoments((current) => current.filter((item) => item.id !== id));
    else setNotice(response ? await errorText(response, "删除失败") : "网络出错了");
  };

  const logout = async () => {
    await fetch("/api/moments/session", { method: "DELETE" }).catch(() => null);
    setOwner(false);
  };

  return (
    <div className="moments-app">
      <div className="moments-scroll">
        <header className="moments-cover">
          <div className="moments-cover-art" aria-hidden="true" />
          {owner && (
            <div className="moments-cover-tools">
              <button type="button" onClick={logout} aria-label="退出登录"><LogOut size={16} aria-hidden="true" /></button>
              <button type="button" onClick={() => setDialog("compose")} aria-label="发表动态"><Camera size={18} aria-hidden="true" /></button>
            </div>
          )}
          <div className="moments-identity">
            <strong>Mateo</strong>
            <button type="button" className="moments-identity-avatar" aria-label={owner ? "Mateo" : "登录"} disabled={owner} onClick={() => { if (enabled) setDialog("login"); else setNotice("朋友圈还没有配置"); }}>
              <img src={AVATAR_SRC} alt="" width={68} height={79} />
            </button>
          </div>
        </header>

        {notice && <p className="moments-notice" role="status"><span>{notice}</span><button type="button" aria-label="知道了" onClick={() => setNotice(null)}><X size={14} aria-hidden="true" /></button></p>}

        {state === "loading" && <p className="moments-state">读取中…</p>}
        {state === "error" && <div className="moments-state"><p>暂时读不到动态</p><button type="button" onClick={() => { setState("loading"); void load(); }}>重试</button></div>}
        {state === "ready" && moments.length === 0 && <p className="moments-state">{owner ? "点右上角的相机，发第一条。" : "还没有动态，过段时间再来看看。"}</p>}

        {moments.length > 0 && (
          <ol className="moments-feed">
            {moments.map((moment) => (
              <Post key={moment.id} moment={moment} now={now} owner={owner} liked={liked.has(moment.id)} onLike={() => void toggleLike(moment)} onDelete={() => remove(moment.id)} onOpenImage={(index) => setViewing({ images: moment.images, index })} />
            ))}
          </ol>
        )}
        {nextBefore && <button type="button" className="moments-more" disabled={loadingMore} onClick={() => void loadMore()}>{loadingMore ? "加载中…" : "更早的动态"}</button>}
      </div>

      {dialog === "login" && <LoginDialog onClose={() => setDialog(null)} onDone={() => { setDialog(null); void load(); }} />}
      {dialog === "compose" && <Composer onClose={() => setDialog(null)} onPosted={(moment) => { setMoments((current) => [moment, ...current]); setNow(new Date()); setDialog(null); }} />}
      {viewing && <Lightbox images={viewing.images} start={viewing.index} onClose={() => setViewing(null)} />}
    </div>
  );
}
