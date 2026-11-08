"use client";

import { AnimatePresence, MotionConfig } from "motion/react";
import { Sheet } from "../os/MobileHome";
import { Windows } from "../os/MateoOS";
import OSProvider, { useOS } from "../os/OSProvider";
import World from "./World";
import "./world.css";

function Shell() {
  const { ready, isMobile, activeId } = useOS();
  return (
    <div className={`os is-space${isMobile ? " is-mobile" : ""}`} data-theme="light" data-ready={ready}>
      <div className="os-session">
        <World />
        {isMobile ? <AnimatePresence>{activeId && <Sheet key={activeId} id={activeId} />}</AnimatePresence> : <Windows />}
      </div>
    </div>
  );
}

export default function WorldShell() {
  return (
    <MotionConfig reducedMotion="user">
      <OSProvider>
        <Shell />
      </OSProvider>
    </MotionConfig>
  );
}
