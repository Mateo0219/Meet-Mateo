"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { CornerDownLeft, Search } from "lucide-react";
import { buildSpotlightIndex, searchSpotlight, type SpotlightItem } from "@/lib/spotlight";
import { swatches } from "@/lib/poster";
import { useOS } from "./OSProvider";

const index = buildSpotlightIndex();

/** Opened from the keyboard many times a day, so it appears instantly — no animation. */
export default function Spotlight() {
  const { spotlightOpen, setSpotlightOpen, openApp, regenerate, playToday, lock } = useOS();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const results = useMemo(() => searchSpotlight(index, query), [query]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSpotlightOpen(!spotlightOpen);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [spotlightOpen, setSpotlightOpen]);

  useLayoutEffect(() => {
    if (!spotlightOpen) return;
    // Reset before the input is painted, so fast typing is not erased by a
    // deferred effect from opening Spotlight.
    setQuery("");
    setSelected(0);
    inputRef.current?.focus();
  }, [spotlightOpen]);

  useEffect(() => setSelected(0), [query]);

  if (!spotlightOpen) return null;

  const run = (item: SpotlightItem | undefined) => {
    if (!item) return;
    setSpotlightOpen(false);
    const { action } = item;
    if (action.type === "app") openApp(action.id, { payload: action.payload, origin: null });
    else if (action.type === "link") window.open(action.href, "_blank", "noopener,noreferrer");
    else if (action.command === "regenerate") regenerate();
    else if (action.command === "playToday") playToday(null);
    else if (action.command === "lock") lock();
  };

  return (
    <div className="spotlight-layer" onPointerDown={() => setSpotlightOpen(false)}>
      <div
        className="spotlight"
        role="dialog"
        aria-label="Spotlight 搜索"
        onPointerDown={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === "Escape") setSpotlightOpen(false);
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setSelected((current) => Math.min(current + 1, results.length - 1));
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setSelected((current) => Math.max(current - 1, 0));
          }
          if (event.key === "Enter") run(results[selected]);
        }}
      >
        <label className="spotlight-input">
          <Search size={22} strokeWidth={2} aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索应用、备忘录、碎片…"
            aria-label="搜索"
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls="spotlight-results"
            aria-activedescendant={results[selected] ? `spotlight-${results[selected].id}` : undefined}
          />
        </label>
        {results.length > 0 ? (
          <ul className="spotlight-results" id="spotlight-results" role="listbox">
            {results.map((item, position) => (
              <li
                key={item.id}
                id={`spotlight-${item.id}`}
                role="option"
                aria-selected={position === selected}
                className={position === selected ? "is-selected" : undefined}
                onPointerEnter={() => setSelected(position)}
                onClick={() => run(item)}
              >
                <span className="spotlight-swatch" style={{ backgroundColor: swatches[item.swatch].bg }} aria-hidden="true" />
                <span className="spotlight-copy">
                  <strong>{item.title}</strong>
                  <small>{item.subtitle}</small>
                </span>
                {position === selected && <CornerDownLeft size={15} className="spotlight-enter" aria-hidden="true" />}
              </li>
            ))}
          </ul>
        ) : (
          <p className="spotlight-empty">没有找到「{query}」</p>
        )}
      </div>
    </div>
  );
}
