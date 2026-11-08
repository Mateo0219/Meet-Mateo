"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Moon, Search, Sun, type LucideIcon } from "lucide-react";
import { appById, apps, GITHUB_URL, type AppId } from "@/lib/os-apps";
import type { WeatherIcon } from "@/lib/weather";
import { useOS } from "./OSProvider";

const weatherIcons: Record<WeatherIcon, LucideIcon> = {
  sun: Sun,
  moon: Moon,
  partly: CloudSun,
  cloud: Cloud,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  snow: CloudSnow,
  storm: CloudLightning,
};

type MenuItem =
  | { kind: "item"; label: string; shortcut?: string; checked?: boolean; disabled?: boolean; onSelect: () => void }
  | { kind: "separator" };

interface MenuDefinition {
  id: string;
  label: ReactNode;
  ariaLabel: string;
  bold?: boolean;
  items: MenuItem[];
}

const isMac = () => typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

export default function MenuBar() {
  const os = useOS();
  const { clock, weather, activeId, windows, openApp, closeApp, minimizeApp, toggleMaximize, dispatch, regenerate, lock, setSpotlightOpen } = os;
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const barRef = useRef<HTMLElement>(null);
  const mod = isMac() ? "⌘" : "Ctrl ";

  useEffect(() => {
    if (!openMenu) return;
    const close = (event: PointerEvent) => {
      if (!barRef.current?.contains(event.target as Node)) setOpenMenu(null);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenMenu(null);
    };
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", escape);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", escape);
    };
  }, [openMenu]);

  const activeApp = activeId ? appById[activeId] : null;
  const item = (label: string, onSelect: () => void, extra: Partial<Omit<Extract<MenuItem, { kind: "item" }>, "kind" | "label" | "onSelect">> = {}): MenuItem => ({ kind: "item", label, onSelect, ...extra });
  const separator: MenuItem = { kind: "separator" };
  const go = (id: AppId, payload?: string) => () => openApp(id, { payload });

  const menus: MenuDefinition[] = [
    {
      id: "system",
      label: <span className="menubar-logo">M</span>,
      ariaLabel: "Mateo 菜单",
      items: [
        item("关于 Mateo", go("about")),
        separator,
        item("Spotlight 搜索", () => setSpotlightOpen(true), { shortcut: `${mod}K` }),
        item("重新生成此刻", regenerate),
        separator,
        item("锁定屏幕", lock),
      ],
    },
    {
      id: "app",
      label: activeApp?.name ?? "桌面",
      ariaLabel: `${activeApp?.name ?? "桌面"} 菜单`,
      bold: true,
      items: activeApp
        ? [item(`关于${activeApp.name}`, go("notes", "site")), separator, item(`退出${activeApp.name}`, () => closeApp(activeApp.id))]
        : [item("这台电脑怎么用", go("notes", "how"))],
    },
    {
      id: "go",
      label: "前往",
      ariaLabel: "前往菜单",
      items: [
        ...apps.filter((app) => app.inDock).map((app) => item(app.name, go(app.id))),
        separator,
        item("关于我", go("notes", "about")),
        item("足球笔记", go("notes", "football")),
        item("朋友圈", go("moments")),
        item("llms.txt", go("llms")),
        separator,
        item("GitHub", () => window.open(GITHUB_URL, "_blank", "noopener,noreferrer")),
      ],
    },
    {
      id: "window",
      label: "窗口",
      ariaLabel: "窗口菜单",
      items: [
        item("最小化", () => activeId && minimizeApp(activeId), { disabled: !activeId }),
        item("缩放", () => activeId && toggleMaximize(activeId), { disabled: !activeId }),
        item("关闭窗口", () => activeId && closeApp(activeId), { disabled: !activeId }),
        ...(windows.windows.length ? [separator] : []),
        ...windows.windows.map((window) =>
          item(appById[window.id].name, () => dispatch({ type: "open", id: window.id, area: os.workArea }), { checked: window.id === activeId }),
        ),
      ],
    },
    {
      id: "help",
      label: "帮助",
      ariaLabel: "帮助菜单",
      items: [item("这台电脑怎么用", go("notes", "how")), item("这个网站是怎么做的", go("notes", "site"))],
    },
  ];

  const WeatherGlyph = weather ? weatherIcons[weather.icon] : null;

  return (
    <header ref={barRef} className="os-menubar">
      <nav className="menubar-left" aria-label="菜单栏">
        {menus.map((menu) => (
          <div key={menu.id} className="menubar-menu">
            <button
              type="button"
              className={`menubar-trigger${menu.bold ? " is-bold" : ""}${openMenu === menu.id ? " is-open" : ""}`}
              aria-haspopup="menu"
              aria-expanded={openMenu === menu.id}
              aria-label={menu.ariaLabel}
              onPointerDown={(event) => {
                // Respond on press, like the real menu bar.
                event.preventDefault();
                setOpenMenu((current) => (current === menu.id ? null : menu.id));
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setOpenMenu((current) => (current === menu.id ? null : menu.id));
                }
              }}
              onPointerEnter={() => {
                if (openMenu && openMenu !== menu.id) setOpenMenu(menu.id);
              }}
            >
              {menu.label}
            </button>
            {openMenu === menu.id && (
              <div className="menubar-dropdown" role="menu">
                {menu.items.map((entry, index) =>
                  entry.kind === "separator" ? (
                    <span key={index} className="menu-separator" role="separator" />
                  ) : (
                    <button
                      key={index}
                      type="button"
                      role="menuitem"
                      className="menu-item"
                      disabled={entry.disabled}
                      onClick={() => {
                        setOpenMenu(null);
                        entry.onSelect();
                      }}
                    >
                      <span className="menu-check">{entry.checked && <Check size={13} strokeWidth={2.6} aria-hidden="true" />}</span>
                      <span className="menu-label">{entry.label}</span>
                      {entry.shortcut && <span className="menu-shortcut">{entry.shortcut}</span>}
                    </button>
                  ),
                )}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="menubar-right">
        {weather && WeatherGlyph && (
          <span className="menubar-status" title={`北京 · ${weather.label}`}>
            <WeatherGlyph size={15} strokeWidth={2} aria-hidden="true" />
            {weather.temperature}°
          </span>
        )}
        <button type="button" className="menubar-status" onClick={() => setSpotlightOpen(true)} aria-label="Spotlight 搜索">
          <Search size={15} strokeWidth={2.2} aria-hidden="true" />
        </button>
        <span className="menubar-status menubar-clock">
          {clock ? `${clock.date.split("/").map(Number).join("月")}日 ${clock.weekday} ${clock.time}` : ""}
        </span>
      </div>
    </header>
  );
}
