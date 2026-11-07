import { createRandom } from "./random";

export interface Swatch {
  bg: string;
  ink: string;
}

export const swatches = {
  pink: { bg: "#FF3EA5", ink: "#2B0418" },
  lime: { bg: "#C6FF3D", ink: "#1B2A00" },
  blue: { bg: "#3D5AFE", ink: "#F3F5FF" },
  yellow: { bg: "#FFD23F", ink: "#3A2B00" },
  orange: { bg: "#FF7A1A", ink: "#2E1200" },
  lavender: { bg: "#B69CFF", ink: "#1D0E47" },
  mint: { bg: "#3DE8B0", ink: "#00301F" },
  night: { bg: "#231D36", ink: "#FFF6E9" },
  cream: { bg: "#FFF6E9", ink: "#16131F" },
} satisfies Record<string, Swatch>;

export type SwatchName = keyof typeof swatches;
export type PosterBlock = "title" | "song" | "orbit" | "weather";
export const posterLayouts = ["split", "banner", "column"] as const;
export type PosterLayout = (typeof posterLayouts)[number];

// Curated sets: every block gets a colour that still reads next to its neighbours.
const dayPalettes: SwatchName[][] = [
  ["blue", "lime", "pink", "yellow"],
  ["pink", "yellow", "blue", "lime"],
  ["orange", "lavender", "lime", "blue"],
  ["lavender", "orange", "yellow", "pink"],
  ["mint", "pink", "blue", "yellow"],
];

const nightPalettes: SwatchName[][] = [
  ["night", "pink", "lime", "blue"],
  ["night", "lime", "lavender", "orange"],
  ["blue", "pink", "yellow", "night"],
  ["night", "mint", "pink", "yellow"],
];

export interface PosterComposition {
  seed: number;
  layout: PosterLayout;
  colors: Record<PosterBlock, SwatchName>;
  /** Swatches used for token chips on the title block. */
  chipColors: SwatchName[];
}

export function composePoster(seed: number, isNight: boolean): PosterComposition {
  const random = createRandom(seed);
  const palettes = isNight ? nightPalettes : dayPalettes;
  const palette = palettes[Math.floor(random() * palettes.length)];
  const layout = posterLayouts[Math.floor(random() * posterLayouts.length)];
  const [title, song, orbit, weather] = palette;

  return {
    seed,
    layout,
    colors: { title, song, orbit, weather },
    chipColors: [song, orbit, weather].filter((name) => name !== "night"),
  };
}
