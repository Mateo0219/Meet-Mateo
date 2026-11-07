"use client";

import { useCallback } from "react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { appById, type AppId } from "@/lib/os-apps";
import type { Rect } from "@/lib/window-manager";
import AppContent from "./apps/AppContent";
import LockScreen from "./LockScreen";
import { Sheet } from "./MobileHome";
import OSProvider, { useOS } from "./OSProvider";
import Spotlight from "./Spotlight";
import SpaceHome from "./SpaceHome";
import Window from "./Window";

function Windows() {
  const { windows, activeId, workArea, dispatch, closeApp, minimizeApp, toggleMaximize } = useOS();
  const commit = useCallback((id: AppId, rect: Rect) => dispatch({ type: "commitRect", id, rect, area: workArea }), [dispatch, workArea]);

  return (
    <div className="os-windows">
      <AnimatePresence>
        {windows.windows.map((win) => {
          const app = appById[win.id];
          return (
            <Window
              key={win.id}
              win={win}
              app={app}
              title={app.title}
              z={10 + windows.order.indexOf(win.id)}
              active={activeId === win.id}
              area={workArea}
              toolbar={
                win.id === "llms" ? (
                  <a className="titlebar-link" href="/llms.txt" target="_blank" rel="noopener noreferrer">
                    在新标签页打开
                  </a>
                ) : undefined
              }
              onFocus={() => dispatch({ type: "focus", id: win.id })}
              onClose={() => closeApp(win.id)}
              onMinimize={() => minimizeApp(win.id)}
              onToggleMaximize={() => toggleMaximize(win.id)}
              onCommit={(rect) => commit(win.id, rect)}
            >
              <AppContent id={win.id} payload={win.payload} navigationId={win.navigationId} />
            </Window>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function Shell() {
  const { ready, isMobile, locked, activeId } = useOS();

  return (
    <div className={`os is-space${isMobile ? " is-mobile" : ""}`} data-theme="light" data-ready={ready}>
      <AnimatePresence>{locked && <LockScreen key="lock" />}</AnimatePresence>
      {!locked && (
        <motion.div
          className="os-session"
          initial={false}
          animate={{ opacity: 1 }}
          transition={{ type: "spring", bounce: 0, duration: 0.5 }}
        >
          <SpaceHome />
          {isMobile ? <AnimatePresence>{activeId && <Sheet key={activeId} id={activeId} />}</AnimatePresence> : <Windows />}
          <Spotlight />
        </motion.div>
      )}
    </div>
  );
}

export default function MateoOS() {
  return (
    <MotionConfig reducedMotion="user">
      <OSProvider>
        <Shell />
      </OSProvider>
    </MotionConfig>
  );
}
