"use client";

/* eslint-disable @next/next/no-img-element -- small local SVG avatar, no optimisation needed */

import { useRef, useState, type KeyboardEvent } from "react";
import { Github } from "lucide-react";
import { motion } from "motion/react";
import { PROJECT_URL, type AppId } from "@/lib/os-apps";
import { rectOf, useOS } from "./OSProvider";
import { AVATAR_SRC, OrbitWidget, ProfileWidget, WeatherWidget } from "./Widgets";

interface DesktopFile {
  id: string;
  label: string;
  kind: "doc" | "folder" | "alias";
  tag?: string;
  tone?: string;
  open?: { app: AppId; payload?: string };
  href?: string;
}

const desktopFiles: DesktopFile[] = [
  { id: "about", label: "关于我.md", kind: "doc", tag: "MD", tone: "var(--orange)", open: { app: "notes", payload: "about" } },
  { id: "football", label: "足球笔记.md", kind: "doc", tag: "MD", tone: "var(--lime)", open: { app: "notes", payload: "football" } },
  { id: "moments", label: "朋友圈", kind: "folder", open: { app: "moments" } },
  { id: "llms", label: "llms.txt", kind: "doc", tag: "TXT", tone: "var(--lavender)", open: { app: "llms" } },
  { id: "repo", label: "Meet-Mateo", kind: "alias", href: PROJECT_URL },
];

function FileArt({ file }: { file: DesktopFile }) {
  if (file.kind === "folder") return <span className="file-folder" aria-hidden="true" />;
  if (file.kind === "alias") {
    return (
      <span className="file-alias" aria-hidden="true">
        <Github size={28} strokeWidth={2} />
      </span>
    );
  }
  return (
    <span className="file-doc" aria-hidden="true">
      <span className="file-lines" />
      <span className="file-tag" style={{ backgroundColor: file.tone }}>{file.tag}</span>
    </span>
  );
}

export default function Desktop() {
  const { openApp } = useOS();
  const desktopRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const openFile = (file: DesktopFile, element: HTMLElement) => {
    if (file.href) {
      window.open(file.href, "_blank", "noopener,noreferrer");
      return;
    }
    if (file.open) openApp(file.open.app, { origin: rectOf(element), payload: file.open.payload });
  };

  return (
    <div ref={desktopRef} className="os-desktop" onPointerDown={() => setSelected(null)}>
      <div className="desktop-widgets" onPointerDown={(event) => event.stopPropagation()}>
        <ProfileWidget />
        <div className="widget-row">
          <WeatherWidget />
          <OrbitWidget />
        </div>
      </div>

      <div className="desktop-icons" role="list" aria-label="桌面文件">
        {desktopFiles.map((file) => (
          <button
            key={file.id}
            type="button"
            role="listitem"
            className={`desktop-file${selected === file.id ? " is-selected" : ""}`}
            onPointerDown={(event) => {
              event.stopPropagation();
              setSelected(file.id);
            }}
            onDoubleClick={(event) => openFile(file, event.currentTarget)}
            onClick={(event) => {
              // Touch has no double-click; a tap opens.
              if (window.matchMedia("(pointer: coarse)").matches) openFile(file, event.currentTarget);
            }}
            onKeyDown={(event: KeyboardEvent<HTMLButtonElement>) => {
              if (event.key === "Enter") openFile(file, event.currentTarget);
            }}
          >
            <FileArt file={file} />
            <span className="desktop-file-label">{file.label}</span>
          </button>
        ))}
      </div>

      <motion.button
        type="button"
        className="desktop-avatar"
        aria-label="关于 Mateo"
        drag
        dragConstraints={desktopRef}
        dragElastic={0.18}
        dragTransition={{ power: 0.35, timeConstant: 260, bounceStiffness: 380, bounceDamping: 26 }}
        whileHover={{ rotate: -2, scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        whileDrag={{ scale: 1.06, rotate: 4 }}
        onPointerDown={(event) => event.stopPropagation()}
        onDoubleClick={(event) => openApp("about", { origin: rectOf(event.currentTarget) })}
      >
        <img src={AVATAR_SRC} alt="" draggable={false} width={180} height={210} />
      </motion.button>
    </div>
  );
}
