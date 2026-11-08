"use client";

import { useCallback } from "react";
import { AnimatePresence } from "motion/react";
import { appById, type AppId } from "@/lib/os-apps";
import type { Rect } from "@/lib/window-manager";
import AppContent from "./apps/AppContent";
import { useOS } from "./OSProvider";
import Window from "./Window";

export default function WindowLayer() {
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
