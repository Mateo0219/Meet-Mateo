"use client";

/* eslint-disable @next/next/no-img-element -- small local SVG avatar, no optimisation needed */

import { useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { useOS } from "./OSProvider";
import { AVATAR_SRC } from "./Widgets";

export default function LockScreen() {
  const { clock, unlock, ready, restoredSession } = useOS();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        unlock();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [unlock]);

  const [month, day] = clock ? clock.date.split("/").map(Number) : [0, 0];

  return (
    <motion.div
      className="lock-screen"
      onClick={unlock}
      initial={false}
      exit={restoredSession ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, scale: 1.04, filter: "blur(8px)" }}
      transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
    >
      <div className="lock-clock">
        <span>{clock ? `${month}月${day}日 ${clock.weekday}` : " "}</span>
        <strong>{clock?.time ?? " "}</strong>
        <small>{clock ? `上海 · ${clock.moment}` : " "}</small>
      </div>
      <div className="lock-user">
        <img src={AVATAR_SRC} alt="" className="lock-avatar" width={96} height={112} />
        <strong>Mateo</strong>
        <button
          type="button"
          className="lock-enter"
          disabled={!ready}
          onClick={(event) => {
            event.stopPropagation();
            unlock();
          }}
        >
          进入 <ArrowRight size={15} aria-hidden="true" />
        </button>
        <span className="lock-hint">点击任意位置或按回车</span>
      </div>
    </motion.div>
  );
}
