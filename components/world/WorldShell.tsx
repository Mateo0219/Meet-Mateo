"use client";

import { AnimatePresence, MotionConfig } from "motion/react";
import OSProvider, { useOS } from "../os/OSProvider";
import Sheet from "../os/Sheet";
import Spotlight from "../os/Spotlight";
import WindowLayer from "../os/WindowLayer";
import World from "./World";
import "./world.css";

function Shell() {
  const { ready, isMobile, activeId } = useOS();
  return (
    <div className={`os is-space${isMobile ? " is-mobile" : ""}`} data-theme="light" data-ready={ready}>
      <div className="os-session">
        <World />
        {isMobile ? <AnimatePresence>{activeId && <Sheet key={activeId} id={activeId} />}</AnimatePresence> : <WindowLayer />}
        <Spotlight />
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
