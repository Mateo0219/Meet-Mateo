import { Camera, CircleDot, FileText, Github, NotebookPen, Shapes, Sparkles, TerminalSquare, UserRound, type LucideIcon } from "lucide-react";
import type { AppIconName } from "@/lib/os-apps";
import { swatches, type SwatchName } from "@/lib/poster";

const glyphs: Record<AppIconName | "github", LucideIcon> = {
  sparkles: Sparkles,
  shapes: Shapes,
  pingpong: CircleDot,
  moments: Camera,
  notes: NotebookPen,
  terminal: TerminalSquare,
  file: FileText,
  user: UserRound,
  github: Github,
};

interface AppIconProps {
  icon: AppIconName | "github";
  swatch: SwatchName;
  className?: string;
}

/** Squircle app icon: flat dopamine fill, a light top edge and a soft drop. */
export default function AppIcon({ icon, swatch, className }: AppIconProps) {
  const Glyph = glyphs[icon];
  const { bg, ink } = swatches[swatch];
  return (
    <span className={`app-icon${className ? ` ${className}` : ""}`} style={{ backgroundColor: bg, color: ink }} aria-hidden="true">
      <Glyph strokeWidth={2.1} />
    </span>
  );
}
