"use client";

import { useCallback, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { applyTemperature, heroSentence, type SentenceChoice } from "@/lib/token-sentence";
import { swatches, type SwatchName } from "@/lib/poster";

interface TokenSentenceProps {
  choice: SentenceChoice;
  temperature: number;
  chipColors: SwatchName[];
  onSwap: (slotId: string, index: number) => void;
}

const STREAM_STEP = 0.055;
const PUNCTUATION = /^[，。、！？]$/;

function TokenPopover({ id, anchor, onClose, children }: { id: string; anchor: HTMLButtonElement; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const popup = ref.current;
    if (!popup) return;
    // The browser's top layer escapes card/window clipping while retaining DOM
    // ancestry, inherited styles and the owning window's inert state.
    popup.setAttribute("popover", "auto");
    const onToggle = () => {
      if (!popup.matches(":popover-open")) onClose();
    };
    const onFocus = (event: FocusEvent) => {
      if (event.target instanceof Node && event.target !== anchor && !popup.contains(event.target) && popup.matches(":popover-open")) {
        popup.hidePopover();
      }
    };
    popup.addEventListener("toggle", onToggle);
    popup.showPopover();

    const position = () => {
      const viewport = window.visualViewport;
      const leftEdge = (viewport?.offsetLeft ?? 0) + 8;
      const topEdge = (viewport?.offsetTop ?? 0) + 8;
      const rightEdge = leftEdge + (viewport?.width ?? window.innerWidth) - 16;
      const bottomEdge = topEdge + (viewport?.height ?? window.innerHeight) - 16;
      popup.style.maxWidth = `${rightEdge - leftEdge}px`;
      popup.style.maxHeight = `${bottomEdge - topEdge}px`;
      const trigger = anchor.getBoundingClientRect();
      const { width, height } = popup.getBoundingClientRect();
      const below = trigger.bottom + 8;
      const top = below + height <= bottomEdge ? below : trigger.top - height - 8;
      popup.style.left = `${Math.max(leftEdge, Math.min(trigger.left, rightEdge - width))}px`;
      popup.style.top = `${Math.max(topEdge, Math.min(top, bottomEdge - height))}px`;
    };
    position();
    popup.querySelector<HTMLButtonElement>("button.is-selected, button")?.focus({ preventScroll: true });
    document.addEventListener("focusin", onFocus);
    const observer = new ResizeObserver(position);
    observer.observe(anchor);
    observer.observe(popup);
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    window.visualViewport?.addEventListener("resize", position);
    window.visualViewport?.addEventListener("scroll", position);
    return () => {
      observer.disconnect();
      document.removeEventListener("focusin", onFocus);
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
      window.visualViewport?.removeEventListener("resize", position);
      window.visualViewport?.removeEventListener("scroll", position);
      popup.removeEventListener("toggle", onToggle);
      if (popup.matches(":popover-open")) popup.hidePopover();
    };
  }, [anchor, onClose]);

  return <div ref={ref} id={id} className="token-popover" role="dialog" aria-label="候选词">{children}</div>;
}

// Mounted fresh for every generated poster, so each one streams in from the start.
export default function TokenSentence({ choice, temperature, chipColors, onSwap }: TokenSentenceProps) {
  const reducedMotion = useReducedMotion();
  const [openSlot, setOpenSlot] = useState<string | null>(null);
  const triggers = useRef(new Map<string, HTMLButtonElement>());
  const popupId = useId();
  const close = useCallback(() => setOpenSlot(null), []);

  const streamDuration = heroSentence.length * STREAM_STEP + 0.3;

  return (
    <div className="token-sentence">
      {heroSentence.map((part, index) => {
        const swatch = swatches[chipColors[index % chipColors.length] ?? "yellow"];
        const enter = reducedMotion
          ? { initial: false as const }
          : {
              initial: { opacity: 0, scale: 0.6, y: 8 },
              animate: { opacity: 1, scale: 1, y: 0 },
              transition: { type: "spring" as const, stiffness: 520, damping: 26, delay: index * STREAM_STEP },
            };

        if (typeof part === "string" && PUNCTUATION.test(part)) {
          return (
            <motion.span key={index} className="token-punct" {...enter}>
              {part}
            </motion.span>
          );
        }

        if (typeof part === "string") {
          return (
            <motion.span key={index} className="token" style={{ backgroundColor: swatch.bg, color: swatch.ink }} {...enter}>
              {part}
            </motion.span>
          );
        }

        const selected = choice[part.id] ?? 0;
        const probabilities = applyTemperature(part.candidates.map((candidate) => candidate.weight), temperature);
        const isOpen = openSlot === part.id;

        return (
          <span key={index} className="token-slot">
            <motion.button
              ref={(element) => {
                if (element) triggers.current.set(part.id, element);
                else triggers.current.delete(part.id);
              }}
              type="button"
              className={`token token-sampled${isOpen ? " is-open" : ""}`}
              style={{ backgroundColor: swatch.bg, color: swatch.ink }}
              onClick={() => setOpenSlot(isOpen ? null : part.id)}
              aria-expanded={isOpen}
              aria-controls={isOpen ? popupId : undefined}
              aria-haspopup="dialog"
              aria-label={`${part.candidates[selected].text}，查看候选词`}
              whileTap={{ scale: 0.94 }}
              {...enter}
            >
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={selected}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ type: "spring", stiffness: 500, damping: 32 }}
                >
                  {part.candidates[selected].text}
                </motion.span>
              </AnimatePresence>
            </motion.button>

            {isOpen && triggers.current.get(part.id) && (
              <TokenPopover id={popupId} anchor={triggers.current.get(part.id)!} onClose={close}>
                <div className="token-popover-head">
                  <span>候选</span>
                  <span>temperature {temperature.toFixed(1)}</span>
                </div>
                {part.candidates.map((candidate, candidateIndex) => (
                  <button
                    type="button"
                    key={candidate.text}
                    className={candidateIndex === selected ? "is-selected" : undefined}
                    onClick={() => {
                      onSwap(part.id, candidateIndex);
                      close();
                      triggers.current.get(part.id)?.focus({ preventScroll: true });
                    }}
                  >
                    <span className="candidate-text">{candidate.text}</span>
                    <span className="candidate-bar">
                      <motion.i
                        style={{ backgroundColor: swatches[chipColors[candidateIndex % chipColors.length] ?? "pink"].bg }}
                        animate={{ scaleX: probabilities[candidateIndex] }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    </span>
                    <span className="candidate-value">{Math.round(probabilities[candidateIndex] * 100)}%</span>
                  </button>
                ))}
                <p>候选和概率是预设的分布，不是实时模型输出。</p>
              </TokenPopover>
            )}
          </span>
        );
      })}
      {!reducedMotion && (
        <motion.span
          className="token-caret"
          aria-hidden="true"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ delay: streamDuration, duration: 0.3 }}
        />
      )}
    </div>
  );
}
