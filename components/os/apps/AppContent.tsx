"use client";

import type { AppId } from "@/lib/os-apps";
import AboutApp from "./AboutApp";
import FragmentsApp from "./FragmentsApp";
import MomentsApp from "./MomentsApp";
import NotesApp from "./NotesApp";
import NowApp from "./NowApp";
import PingPongApp from "./PingPongApp";
import ProjectsApp from "./ProjectsApp";
import TerminalApp from "./TerminalApp";
import TextApp from "./TextApp";

export default function AppContent({ id, payload, navigationId, compact = false }: { id: AppId; payload?: string; navigationId: number; compact?: boolean }) {
  switch (id) {
    case "projects":
      return <ProjectsApp />;
    case "now":
      return <NowApp />;
    case "fragments":
      return <FragmentsApp payload={payload} navigationId={navigationId} />;
    case "pingpong":
      return <PingPongApp />;
    case "moments":
      return <MomentsApp />;
    case "notes":
      return <NotesApp payload={payload} navigationId={navigationId} compact={compact} />;
    case "terminal":
      return <TerminalApp />;
    case "llms":
      return <TextApp />;
    case "about":
      return <AboutApp />;
    default:
      return null;
  }
}
