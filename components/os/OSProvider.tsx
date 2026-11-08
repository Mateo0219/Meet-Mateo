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
import { appById, type AppId } from "@/lib/os-apps";
import { composePoster, type PosterComposition } from "@/lib/poster";
import { createRandom, randomSeed } from "@/lib/random";
import { readBeijingClock, type BeijingClock } from "@/lib/signals";
import { getBirthdayProgress, type BirthdayProgress } from "@/lib/time-progress";
import { greedySentence, sampleSentence, type SentenceChoice } from "@/lib/token-sentence";
import { isBeijingWeather, type BeijingWeather } from "@/lib/weather";
import {
  activeWindowId,
  initialWindowState,
  windowReducer,
  type Rect,
  type WindowAction,
  type WindowManagerState,
} from "@/lib/window-manager";

export const MENU_BAR_HEIGHT = 54;
export const DOCK_SPACE = 104;
const UNLOCK_KEY = "mateo-os-unlocked";
const DEFAULT_TEMPERATURE = 0.7;

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

  clock: BeijingClock | null;
  isNight: boolean;
  birthday: BirthdayProgress | null;
  weather: BeijingWeather | null;

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
  const [clock, setClock] = useState<BeijingClock | null>(null);
  const [birthday, setBirthday] = useState<BirthdayProgress | null>(null);
  const [weather, setWeather] = useState<BeijingWeather | null>(null);
  const [seed, setSeed] = useState(1000);
  const [choice, setChoice] = useState<SentenceChoice>(greedySentence);
  const [temperature, setTemperature] = useState(DEFAULT_TEMPERATURE);
  const [windows, dispatch] = useReducer(windowReducer, initialWindowState);
  const [viewport, setViewport] = useState({ width: 1440, height: 900 });
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const dockIcons = useRef(new Map<AppId, HTMLElement>());
  const handledHash = useRef<string | null>(null);

  // Time, chance and viewport are client-only; the server renders the space overview.
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(readBeijingClock(now));
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
    // Tick on the minute boundary so the clock never lags what it displays.
    let timer = 0;
    const schedule = () => {
      timer = window.setTimeout(() => {
        tick();
        schedule();
      }, 60_000 - (Date.now() % 60_000) + 30);
    };
    schedule();
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("resize", measure);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const load = () =>
      fetch("/api/weather", { signal: controller.signal })
        .then((response) => (response.ok ? response.json() : null))
        .then((data: unknown) => {
          if (isBeijingWeather(data)) setWeather(data);
        })
        .catch(() => undefined);
    load();
    const interval = window.setInterval(load, 30 * 60_000);
    return () => {
      window.clearInterval(interval);
      controller.abort();
    };
  }, []);

  const isNight = clock?.isNight ?? false;
  const composition = useMemo(() => composePoster(seed, isNight), [seed, isNight]);

  const workArea = useMemo<Rect>(
    () => ({ x: 0, y: MENU_BAR_HEIGHT, width: viewport.width, height: Math.max(320, viewport.height - MENU_BAR_HEIGHT - DOCK_SPACE) }),
    [viewport],
  );

  useEffect(() => dispatch({ type: "reflow", area: workArea }), [workArea]);

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
      else if (hash === "#pingpong") openApp("pingpong");
      else if (hash === "#moments") openApp("moments");
    };
    navigate();
    window.addEventListener("hashchange", navigate);
    return () => window.removeEventListener("hashchange", navigate);
  }, [ready, locked, openApp]);

  // The focused control is about to disappear; hand focus to where the app can be reopened.
  // Apps outside the Dock can be restored through the Mateo OS menu.
  const focusLauncher = useCallback((id: AppId) => {
    const launcher = dockIcons.current.get(id) ?? document.querySelector<HTMLElement>(".space-brand");
    launcher?.focus({ preventScroll: true });
  }, []);

  const closeApp = useCallback((id: AppId) => {
    dispatch({ type: "close", id });
    focusLauncher(id);
  }, [focusLauncher]);

  const minimizeApp = useCallback((id: AppId) => {
    dispatch({ type: "minimize", id, target: rectOf(dockIcons.current.get(id)) });
    focusLauncher(id);
  }, [focusLauncher]);

  const toggleMaximize = useCallback((id: AppId) => dispatch({ type: "toggleMaximize", id, area: workArea }), [workArea]);

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
    spotlightOpen,
    setSpotlightOpen,
  };

  return <OSContext.Provider value={value}>{children}</OSContext.Provider>;
}
