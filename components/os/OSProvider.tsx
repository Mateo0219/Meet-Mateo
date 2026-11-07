"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from "react";
import type { MusicControls, TrackRequest } from "../MusicPlayer";
import { appById, type AppId } from "@/lib/os-apps";
import { composePoster, type PosterComposition } from "@/lib/poster";
import { createRandom, randomSeed } from "@/lib/random";
import { readShanghaiClock, type ShanghaiClock } from "@/lib/signals";
import { getBirthdayProgress, type BirthdayProgress } from "@/lib/time-progress";
import { greedySentence, sampleSentence, type SentenceChoice } from "@/lib/token-sentence";
import { usePlaylist, type LibraryTrack, type PlaylistLibrary } from "@/lib/use-playlist";
import { isShanghaiWeather, type ShanghaiWeather } from "@/lib/weather";
import {
  activeWindowId,
  initialWindowState,
  windowReducer,
  type Rect,
  type WindowAction,
  type WindowManagerState,
} from "@/lib/window-manager";

export const MENU_BAR_HEIGHT = 54;
export const DOCK_SPACE = 92;
const UNLOCK_KEY = "mateo-os-unlocked";
const DEFAULT_TEMPERATURE = 0.7;

export interface NowPlaying {
  track: Pick<LibraryTrack, "id" | "name" | "artist" | "cover">;
  playing: boolean;
}

interface OpenOptions {
  origin?: Rect | null;
  payload?: string;
}

interface OSContextValue {
  ready: boolean;
  isMobile: boolean;
  locked: boolean;
  /** True when the session was already unlocked, so the lock screen leaves without a transition. */
  restoredSession: boolean;
  unlock: () => void;
  lock: () => void;

  clock: ShanghaiClock | null;
  isNight: boolean;
  birthday: BirthdayProgress | null;
  weather: ShanghaiWeather | null;
  library: PlaylistLibrary | null;
  todaySong: LibraryTrack | null;

  seed: number;
  composition: PosterComposition;
  choice: SentenceChoice;
  temperature: number;
  setTemperature: (value: number) => void;
  swapToken: (slotId: string, index: number) => void;
  regenerate: () => void;

  windows: WindowManagerState;
  dispatch: (action: WindowAction) => void;
  activeId: AppId | null;
  workArea: Rect;
  openApp: (id: AppId, options?: OpenOptions) => void;
  closeApp: (id: AppId) => void;
  minimizeApp: (id: AppId) => void;
  toggleMaximize: (id: AppId) => void;
  dockIcons: MutableRefObject<Map<AppId, HTMLElement>>;

  trackRequest: TrackRequest | null;
  musicControls: MutableRefObject<MusicControls | null>;
  consumeTrackRequest: (nonce: number) => void;
  playToday: (origin?: Rect | null) => void;
  nowPlaying: NowPlaying | null;
  setNowPlaying: (value: NowPlaying | null) => void;

  spotlightOpen: boolean;
  setSpotlightOpen: (open: boolean) => void;
}

const OSContext = createContext<OSContextValue | null>(null);

export function useOS(): OSContextValue {
  const value = useContext(OSContext);
  if (!value) throw new Error("useOS must be used inside <OSProvider>");
  return value;
}

export function rectOf(element: Element | null | undefined): Rect | null {
  if (!element) return null;
  const { x, y, width, height } = element.getBoundingClientRect();
  return { x, y, width, height };
}

export default function OSProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [locked, setLocked] = useState(false);
  const [restoredSession, setRestoredSession] = useState(false);
  const [clock, setClock] = useState<ShanghaiClock | null>(null);
  const [birthday, setBirthday] = useState<BirthdayProgress | null>(null);
  const [weather, setWeather] = useState<ShanghaiWeather | null>(null);
  const [seed, setSeed] = useState(1000);
  const [choice, setChoice] = useState<SentenceChoice>(greedySentence);
  const [temperature, setTemperature] = useState(DEFAULT_TEMPERATURE);
  const [windows, dispatch] = useReducer(windowReducer, initialWindowState);
  const [viewport, setViewport] = useState({ width: 1440, height: 900 });
  const [trackRequest, setTrackRequest] = useState<TrackRequest | null>(null);
  const consumeTrackRequest = useCallback((nonce: number) => setTrackRequest((current) => current?.nonce === nonce ? null : current), []);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const dockIcons = useRef(new Map<AppId, HTMLElement>());
  const musicControls = useRef<MusicControls | null>(null);
  const handledHash = useRef<string | null>(null);
  const library = usePlaylist();

  // Time, chance and viewport are client-only; the server renders the space overview.
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(readShanghaiClock(now));
      setBirthday(getBirthdayProgress(now));
    };
    tick();
    const firstSeed = randomSeed();
    setSeed(firstSeed);
    setChoice(sampleSentence(createRandom(firstSeed + 1), DEFAULT_TEMPERATURE));
    if (window.sessionStorage.getItem(UNLOCK_KEY) === "1") {
      setRestoredSession(true);
      setLocked(false);
    }

    const media = window.matchMedia("(max-width: 760px)");
    const measure = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
      setIsMobile(media.matches);
    };
    measure();
    window.addEventListener("resize", measure);
    setReady(true);
    const interval = window.setInterval(tick, 20_000);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("resize", measure);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/weather", { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: unknown) => {
        if (isShanghaiWeather(data)) setWeather(data);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  const isNight = clock?.isNight ?? false;
  const composition = useMemo(() => composePoster(seed, isNight), [seed, isNight]);

  const todaySong = useMemo(() => {
    if (!library) return null;
    const random = createRandom(seed * 31 + 7);
    return library.tracks[Math.floor(random() * library.tracks.length)] ?? null;
  }, [library, seed]);

  const workArea = useMemo<Rect>(
    () => ({ x: 0, y: MENU_BAR_HEIGHT, width: viewport.width, height: Math.max(320, viewport.height - MENU_BAR_HEIGHT - DOCK_SPACE) }),
    [viewport],
  );

  const unlock = useCallback(() => {
    setLocked(false);
    window.sessionStorage.setItem(UNLOCK_KEY, "1");
  }, []);

  const lock = useCallback(() => {
    setRestoredSession(false);
    setLocked(true);
    window.sessionStorage.removeItem(UNLOCK_KEY);
  }, []);

  const regenerate = useCallback(() => {
    const next = randomSeed();
    setSeed(next);
    setChoice(sampleSentence(createRandom(next + 1), temperature));
  }, [temperature]);

  const swapToken = useCallback((slotId: string, index: number) => {
    setChoice((current) => ({ ...current, [slotId]: index }));
  }, []);

  const openApp = useCallback(
    (id: AppId, options: OpenOptions = {}) => {
      if (!appById[id]) return;
      dispatch({ type: "open", id, area: workArea, origin: options.origin ?? rectOf(dockIcons.current.get(id)), payload: options.payload });
    },
    [workArea],
  );

  // Detail-page links remain meaningful on both fresh and restored sessions.
  // Consume each URL change once; resizing or unlocking again must not reopen it.
  useEffect(() => {
    if (!ready || locked) return;
    const navigate = () => {
      const hash = window.location.hash;
      if (handledHash.current === hash) return;
      handledHash.current = hash;
      if (hash === "#fragments") openApp("fragments");
      else if (hash === "#listen") openApp("music");
    };
    navigate();
    window.addEventListener("hashchange", navigate);
    return () => window.removeEventListener("hashchange", navigate);
  }, [ready, locked, openApp]);

  const closeApp = useCallback((id: AppId) => {
    dispatch({ type: "close", id });
    if (id === "music") { setNowPlaying(null); setTrackRequest(null); }
  }, []);

  const minimizeApp = useCallback((id: AppId) => {
    dispatch({ type: "minimize", id, target: rectOf(dockIcons.current.get(id)) });
    // Apps outside the Dock can be restored through the Mateo OS menu.
    const launcher = dockIcons.current.get(id) ?? document.querySelector<HTMLElement>('.space-brand, .menubar-trigger[aria-label="窗口菜单"]');
    launcher?.focus({ preventScroll: true });
  }, []);

  const toggleMaximize = useCallback((id: AppId) => dispatch({ type: "toggleMaximize", id, area: workArea }), [workArea]);

  const playToday = useCallback(
    (origin?: Rect | null) => {
      if (!todaySong) return;
      openApp("music", { origin });
      setTrackRequest({ id: todaySong.id, nonce: Date.now(), autoplay: true });
    },
    [openApp, todaySong],
  );

  const value: OSContextValue = {
    ready,
    isMobile,
    locked,
    restoredSession,
    unlock,
    lock,
    clock,
    isNight,
    birthday,
    weather,
    library,
    todaySong,
    seed,
    composition,
    choice,
    temperature,
    setTemperature,
    swapToken,
    regenerate,
    windows,
    dispatch,
    activeId: activeWindowId(windows),
    workArea,
    openApp,
    closeApp,
    minimizeApp,
    toggleMaximize,
    dockIcons,
    trackRequest,
    musicControls,
    consumeTrackRequest,
    playToday,
    nowPlaying,
    setNowPlaying,
    spotlightOpen,
    setSpotlightOpen,
  };

  return <OSContext.Provider value={value}>{children}</OSContext.Provider>;
}
