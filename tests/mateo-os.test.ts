import { describe, expect, it } from "vitest";
import { noteById, notes } from "../lib/notes";
import { appById, apps, type AppId } from "../lib/os-apps";
import { buildSpotlightIndex, searchSpotlight } from "../lib/spotlight";
import { runCommand, terminalCommands, type TerminalContext } from "../lib/terminal";
import {
  activeWindowId,
  clampRect,
  initialWindowState,
  rubberband,
  TITLE_BAR,
  transformFromOrigin,
  VISIBLE_GRIP,
  windowReducer,
  type Rect,
  type WindowManagerState,
} from "../lib/window-manager";

const area: Rect = { x: 0, y: 30, width: 1440, height: 778 };

const open = (state: WindowManagerState, id: AppId, payload?: string) => windowReducer(state, { type: "open", id, area, payload });

describe("app registry", () => {
  it("has unique ids and sane sizes", () => {
    expect(new Set(apps.map((app) => app.id)).size).toBe(apps.length);
    for (const app of apps) {
      expect(app.size.width).toBeGreaterThanOrEqual(app.minSize.width);
      expect(app.size.height).toBeGreaterThanOrEqual(app.minSize.height);
    }
  });
});

describe("window manager", () => {
  it("never cascades a new window past the work area", () => {
    const short: Rect = { x: 0, y: 54, width: 1440, height: 742 };
    let state = initialWindowState;
    for (const app of apps) {
      state = windowReducer(state, { type: "open", id: app.id, area: short });
      const { rect } = state.windows[state.windows.length - 1];
      expect(rect.y + rect.height).toBeLessThanOrEqual(short.y + short.height);
      expect(rect.x + rect.width).toBeLessThanOrEqual(short.x + short.width);
    }
  });

  it("keeps maximized windows maximized when the viewport changes", () => {
    let state = windowReducer(open(initialWindowState, "now"), { type: "toggleMaximize", id: "now", area });
    const larger: Rect = { ...area, width: 1920, height: 1000 };
    state = windowReducer(state, { type: "reflow", area: larger });
    expect(state.windows[0].maximized).toBe(true);
    expect(state.windows[0].rect).toEqual(larger);
    expect(windowReducer(state, { type: "reflow", area: larger })).toBe(state);
  });

  it("opens a window once and brings it to the front", () => {
    let state = open(initialWindowState, "now");
    state = open(state, "pingpong");
    expect(activeWindowId(state)).toBe("pingpong");
    state = open(state, "now");
    expect(state.windows).toHaveLength(2);
    expect(activeWindowId(state)).toBe("now");
  });

  it("updates the payload when an open window is asked for something else", () => {
    let state = open(initialWindowState, "notes", "about");
    state = open(state, "notes", "football");
    expect(state.windows.find((window) => window.id === "notes")?.payload).toBe("football");
  });

  it("passes focus on when the front window is minimized, and restores it on open", () => {
    let state = open(open(initialWindowState, "now"), "pingpong");
    state = windowReducer(state, { type: "minimize", id: "pingpong" });
    expect(activeWindowId(state)).toBe("now");
    expect(state.windows.find((window) => window.id === "pingpong")?.minimized).toBe(true);
    state = open(state, "pingpong");
    expect(activeWindowId(state)).toBe("pingpong");
    expect(state.windows.find((window) => window.id === "pingpong")?.minimized).toBe(false);
  });

  it("toggles maximize and restores the previous rect", () => {
    let state = open(initialWindowState, "notes");
    const before = state.windows[0].rect;
    state = windowReducer(state, { type: "toggleMaximize", id: "notes", area });
    expect(state.windows[0].rect).toEqual(area);
    state = windowReducer(state, { type: "toggleMaximize", id: "notes", area });
    expect(state.windows[0].rect).toEqual(before);
  });

  it("closes windows and clears them from the order", () => {
    let state = open(open(initialWindowState, "now"), "terminal");
    state = windowReducer(state, { type: "close", id: "terminal" });
    expect(state.order).toEqual(["now"]);
    expect(activeWindowId(windowReducer(state, { type: "close", id: "now" }))).toBeNull();
  });

  it("never lets a window hide under the menu bar or lose its title bar", () => {
    const clamped = clampRect({ x: -5000, y: -200, width: 800, height: 600 }, area);
    expect(clamped.y).toBe(area.y);
    expect(clamped.x + clamped.width).toBeGreaterThanOrEqual(area.x + VISIBLE_GRIP);
    const low = clampRect({ x: 200, y: 5000, width: 800, height: 600 }, area);
    expect(low.y).toBeLessThanOrEqual(area.y + area.height - TITLE_BAR);
  });

  it("opens new windows inside the work area", () => {
    let state = initialWindowState;
    for (const app of apps) state = open(state, app.id);
    for (const window of state.windows) {
      expect(window.rect.y).toBeGreaterThanOrEqual(area.y);
      expect(window.rect.width).toBeLessThanOrEqual(area.width);
    }
  });
});

describe("motion helpers", () => {
  it("rubber-bands with diminishing returns", () => {
    const small = rubberband(50, 800);
    const large = rubberband(500, 800);
    expect(small).toBeLessThan(50);
    expect(large).toBeLessThan(500);
    expect(large / 500).toBeLessThan(small / 50);
    expect(rubberband(-50, 800)).toBeCloseTo(-small);
  });

  it("maps a window onto the icon it came from", () => {
    const rect = { x: 400, y: 100, width: 800, height: 600 };
    const origin = { x: 700, y: 820, width: 54, height: 54 };
    const { x, y, scale } = transformFromOrigin(rect, origin);
    expect(scale).toBeCloseTo(54 / 800);
    expect(rect.x + x + (rect.width * scale) / 2).toBeCloseTo(origin.x + origin.width / 2);
    expect(rect.y + y + (rect.height * scale) / 2).toBeCloseTo(origin.y + origin.height / 2);
  });
});

describe("spotlight", () => {
  const index = buildSpotlightIndex();

  it("suggests apps when the query is empty", () => {
    expect(searchSpotlight(index, "").every((item) => item.group === "应用")).toBe(true);
  });

  it("ranks an exact app name first", () => {
    expect(searchSpotlight(index, "朋友圈")[0].id).toBe("app:moments");
  });

  it("finds notes and fragments by their content", () => {
    expect(searchSpotlight(index, "足球").some((item) => item.id === "note:football")).toBe(true);
    expect(searchSpotlight(index, "中场").some((item) => item.id === "fragment:midfield")).toBe(true);
  });

  it("requires every term to match", () => {
    expect(searchSpotlight(index, "朋友圈 不存在的词")).toEqual([]);
  });
});

describe("terminal", () => {
  const context: TerminalContext = {
    clock: { hour: 1, minute: 10, time: "01:10", date: "10/15", weekday: "周四", moment: "凌晨一点", isNight: true },
    weather: { temperature: 22, code: 3, isDay: false, label: "阴", icon: "cloud" },
    birthday: { birthdayPercent: 76.2, daysUntilBirthday: 86 },
    random: () => 0,
  };

  it("documents every command in help", () => {
    const help = runCommand("help", context).lines.map((line) => line.text).join("\n");
    for (const [name] of terminalCommands) expect(help).toContain(name);
  });

  it("opens apps and notes", () => {
    expect(runCommand("open 乒乓球", context).effect).toEqual({ type: "open", app: "pingpong" });
    expect(runCommand("open 朋友圈", context).effect).toEqual({ type: "open", app: "moments" });
    expect(runCommand("open 足球", context).effect).toEqual({ type: "open", app: "notes", payload: "football" });
    expect(runCommand("open nowhere", context).lines[0].tone).toBe("error");
  });

  it("reads files from the desktop", () => {
    expect(runCommand("cat 关于我.md", context).lines[0].text).toContain("关于我");
    expect(runCommand("cat llms.txt", context).effect).toEqual({ type: "open", app: "llms" });
    expect(runCommand("cat secrets.txt", context).lines[0].tone).toBe("error");
  });

  it("reports live signals", () => {
    expect(runCommand("weather", context).lines[0].text).toBe("北京 · 22° · 阴");
    expect(runCommand("date", context).lines[0].text).toContain("凌晨一点");
    expect(runCommand("birthday", context).lines[0].text).toContain("86");
  });

  it("samples a sentence and labels it as preset", () => {
    const result = runCommand("sample 0.1", context);
    expect(result.lines[0].text).toBe("我在北京vibe coding，也做界面。喜欢把模糊的念头变成能用的东西。");
    expect(result.lines.some((line) => line.text.includes("预设"))).toBe(true);
    expect(runCommand("sample -1", context).lines[0].tone).toBe("muted");
  });

  it("handles unknown and empty input", () => {
    expect(runCommand("", context).lines).toEqual([]);
    expect(runCommand("rm -rf /", context).lines[0].text).toContain("command not found");
  });
});

describe("notes", () => {
  it("has unique ids that the rest of the OS can link to", () => {
    expect(new Set(notes.map((note) => note.id)).size).toBe(notes.length);
    for (const id of ["about", "football", "how", "site"]) expect(noteById[id]).toBeDefined();
    expect(appById.notes).toBeDefined();
  });
});
