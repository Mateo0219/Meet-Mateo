import { appById, type AppId } from "./os-apps";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WindowState {
  id: AppId;
  rect: Rect;
  /** Where the window should grow from / shrink back to (icon on screen). */
  origin: Rect | null;
  restoreRect: Rect | null;
  minimized: boolean;
  maximized: boolean;
  /** App-specific argument, e.g. which note to show. */
  payload?: string;
  /** A new explicit content request, even when its payload is unchanged. */
  navigationId: number;
}

export interface WindowManagerState {
  windows: WindowState[];
  /** Back to front. */
  order: AppId[];
}

export type WindowAction =
  | { type: "open"; id: AppId; area: Rect; origin?: Rect | null; payload?: string }
  | { type: "close"; id: AppId }
  | { type: "focus"; id: AppId }
  | { type: "minimize"; id: AppId; target?: Rect | null }
  | { type: "toggleMaximize"; id: AppId; area: Rect }
  | { type: "commitRect"; id: AppId; rect: Rect; area: Rect }
  | { type: "reflow"; area: Rect };

export const initialWindowState: WindowManagerState = { windows: [], order: [] };

/** Keep at least a grabbable strip of the title bar on screen. */
export const VISIBLE_GRIP = 96;
export const TITLE_BAR = 40;

export function clampRect(rect: Rect, area: Rect): Rect {
  const width = Math.min(rect.width, area.width);
  const height = Math.min(rect.height, area.height);
  return {
    width,
    height,
    x: Math.min(Math.max(rect.x, area.x - width + VISIBLE_GRIP), area.x + area.width - VISIBLE_GRIP),
    y: Math.min(Math.max(rect.y, area.y), area.y + area.height - TITLE_BAR),
  };
}

/** Apple's rubber-band: the further past the edge, the less it follows. */
export function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  if (dimension <= 0) return 0;
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

export function defaultRect(id: AppId, area: Rect, stackIndex: number): Rect {
  const { size } = appById[id];
  const width = Math.min(size.width, area.width - 32);
  const height = Math.min(size.height, area.height - 24);
  const offset = (stackIndex % 6) * 28;
  // Cascade, but never open past the work area.
  const x = Math.min(area.x + (area.width - width) / 2 + offset - 70, area.x + area.width - width);
  const y = Math.min(area.y + Math.max(12, (area.height - height) / 2 - 20) + offset, area.y + area.height - height);
  return clampRect({ width, height, x, y }, area);
}

const sameRect = (a: Rect, b: Rect) => a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;

const bringToFront = (order: AppId[], id: AppId) => [...order.filter((item) => item !== id), id];

export function windowReducer(state: WindowManagerState, action: WindowAction): WindowManagerState {
  switch (action.type) {
    case "open": {
      const existing = state.windows.find((window) => window.id === action.id);
      if (existing) {
        return {
          windows: state.windows.map((window) =>
            window.id === action.id
              ? {
                  ...window,
                  minimized: false,
                  payload: action.payload ?? window.payload,
                  navigationId: window.navigationId + (action.payload !== undefined ? 1 : 0),
                  origin: window.minimized ? window.origin : action.origin ?? window.origin,
                }
              : window,
          ),
          order: bringToFront(state.order, action.id),
        };
      }
      const rect = defaultRect(action.id, action.area, state.windows.length);
      return {
        windows: [
          ...state.windows,
          { id: action.id, rect, origin: action.origin ?? null, restoreRect: null, minimized: false, maximized: false, payload: action.payload, navigationId: 0 },
        ],
        order: bringToFront(state.order, action.id),
      };
    }
    case "close":
      return {
        windows: state.windows.filter((window) => window.id !== action.id),
        order: state.order.filter((id) => id !== action.id),
      };
    case "focus":
      if (state.order[state.order.length - 1] === action.id) return state;
      return { ...state, order: bringToFront(state.order, action.id) };
    case "minimize":
      return {
        windows: state.windows.map((window) =>
          window.id === action.id ? { ...window, minimized: true, origin: action.target ?? window.origin } : window,
        ),
        // Minimized windows sink to the back so focus passes to the next one.
        order: [action.id, ...state.order.filter((id) => id !== action.id)],
      };
    case "toggleMaximize":
      return {
        ...state,
        windows: state.windows.map((window) => {
          if (window.id !== action.id) return window;
          if (window.maximized) {
            return { ...window, maximized: false, rect: window.restoreRect ?? defaultRect(window.id, action.area, 0), restoreRect: null };
          }
          return { ...window, maximized: true, restoreRect: window.rect, rect: { ...action.area } };
        }),
        order: bringToFront(state.order, action.id),
      };
    case "commitRect":
      return {
        ...state,
        windows: state.windows.map((window) =>
          window.id === action.id ? { ...window, rect: clampRect(action.rect, action.area), maximized: false, restoreRect: null } : window,
        ),
      };
    case "reflow": {
      // The viewport changed: maximized windows keep filling it, others stay reachable.
      const windows = state.windows.map((window) => {
        const rect = window.maximized ? { ...action.area } : clampRect(window.rect, action.area);
        return sameRect(rect, window.rect) ? window : { ...window, rect };
      });
      return windows.every((window, index) => window === state.windows[index]) ? state : { ...state, windows };
    }
    default:
      return state;
  }
}

export function activeWindowId(state: WindowManagerState): AppId | null {
  for (let index = state.order.length - 1; index >= 0; index -= 1) {
    const id = state.order[index];
    if (!state.windows.find((window) => window.id === id)?.minimized) return id;
  }
  return null;
}

/** Transform that places a window of `rect` over `origin`, scaled uniformly, from a top-left origin. */
export function transformFromOrigin(rect: Rect, origin: Rect | null): { x: number; y: number; scale: number } {
  if (!origin) return { x: 0, y: rect.height * 0.04, scale: 0.94 };
  const scale = Math.max(0.06, Math.min(1, origin.width / rect.width));
  return {
    scale,
    x: origin.x + origin.width / 2 - (rect.x + (rect.width * scale) / 2),
    y: origin.y + origin.height / 2 - (rect.y + (rect.height * scale) / 2),
  };
}
