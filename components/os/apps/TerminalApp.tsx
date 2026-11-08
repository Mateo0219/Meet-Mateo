"use client";

import { useEffect, useRef, useState } from "react";
import { runCommand, terminalCommands, type TerminalLine } from "@/lib/terminal";
import { useOS } from "../OSProvider";

type Entry = { kind: "input"; text: string } | { kind: "output"; line: TerminalLine };

const PROMPT = "mateo@beijing ~ %";
const commandNames = terminalCommands.map(([name]) => name.split(" ")[0]);

export default function TerminalApp() {
  const { clock, weather, birthday, openApp, regenerate, lock, closeApp } = useOS();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [input, setInput] = useState("");
  const history = useRef<string[]>([]);
  const historyIndex = useRef(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const welcomed = useRef(false);

  useEffect(() => {
    if (welcomed.current || !clock) return;
    welcomed.current = true;
    setEntries([
      { kind: "output", line: { text: `Last login: ${clock.weekday} ${clock.date} ${clock.time} on ttys001`, tone: "muted" } },
      { kind: "output", line: { text: "欢迎来到 Mateo OS。输入 help 查看可用命令。", tone: "lime" } },
    ]);
  }, [clock]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [entries]);

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  const submit = () => {
    const text = input;
    setInput("");
    if (text.trim()) history.current = [...history.current, text];
    historyIndex.current = -1;

    const result = runCommand(text, {
      clock,
      weather,
      birthday,
      random: Math.random,
    });

    if (result.effect?.type === "clear") {
      setEntries([]);
      return;
    }
    setEntries((current) => [...current, { kind: "input", text }, ...result.lines.map((line) => ({ kind: "output" as const, line }))]);

    const effect = result.effect;
    if (!effect) return;
    if (effect.type === "open") openApp(effect.app, { payload: effect.payload, origin: null });
    if (effect.type === "regenerate") regenerate();
    if (effect.type === "link") window.open(effect.href, "_blank", "noopener,noreferrer");
    if (effect.type === "lock") lock();
    if (effect.type === "close") closeApp("terminal");
  };

  return (
    <div className="terminal-app" onClick={() => inputRef.current?.focus({ preventScroll: true })}>
      <div ref={scrollRef} className="terminal-scroll" aria-live="polite">
        {entries.map((entry, index) =>
          entry.kind === "input" ? (
            <p key={index} className="terminal-line">
              <span className="terminal-prompt">{PROMPT}</span> {entry.text}
            </p>
          ) : (
            <p key={index} className={`terminal-line term-${entry.line.tone ?? "plain"}`}>
              {entry.line.text || " "}
            </p>
          ),
        )}
        <form
          className="terminal-input-row"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <label htmlFor="terminal-input" className="terminal-prompt">{PROMPT}</label>
          <input
            id="terminal-input"
            ref={inputRef}
            value={input}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "ArrowUp") {
                event.preventDefault();
                const next = historyIndex.current < 0 ? history.current.length - 1 : Math.max(0, historyIndex.current - 1);
                if (history.current[next] !== undefined) {
                  historyIndex.current = next;
                  setInput(history.current[next]);
                }
              }
              if (event.key === "ArrowDown") {
                event.preventDefault();
                if (historyIndex.current < 0) return;
                const next = historyIndex.current + 1;
                historyIndex.current = next >= history.current.length ? -1 : next;
                setInput(historyIndex.current < 0 ? "" : history.current[next]);
              }
              if (event.key === "Tab") {
                event.preventDefault();
                const match = commandNames.filter((name) => name.startsWith(input.trim()));
                if (input.trim() && match.length === 1) setInput(`${match[0]} `);
              }
            }}
          />
        </form>
      </div>
    </div>
  );
}
