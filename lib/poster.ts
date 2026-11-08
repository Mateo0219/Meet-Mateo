import { createRandom } from "./random";

export interface Swatch {
  bg: string;
  ink: string;
}

export const swatches = {
  pink: { bg: "#F0B8A3", ink: "#4A1F10" },
  lime: { bg: "#CBD8A4", ink: "#27330F" },
  blue: { bg: "#355BFF", ink: "#F5F7FF" },
  yellow: { bg: "#F6DCA3", ink: "#3F2E08" },
  orange: { bg: "#E9AE72", ink: "#3A2106" },
  lavender: { bg: "#C7CFF7", ink: "#1B2563" },
  mint: { bg: "#B6DCCB", ink: "#103326" },
  night: { bg: "#252B42", ink: "#FBF7F1" },
  cream: { bg: "#FBF7F1", ink: "#1E2233" },
} satisfies Record<string, Swatch>;

export type SwatchName = keyof typeof swatches;
export type PosterBlock = "title" | "orbit" | "weather";
export const posterLayouts = ["split", "banner", "column"] as const;
export type PosterLayout = (typeof posterLayouts)[number];

// Curated sets: every block gets a colour that still reads next to its neighbours.
const dayPalettes: SwatchName[][] = [
  ["blue", "pink", "yellow"],
  ["pink", "blue", "lime"],
  ["orange", "lime", "blue"],
  ["lavender", "yellow", "pink"],
  ["mint", "blue", "yellow"],
];

const nightPalettes: SwatchName[][] = [
  ["night", "lime", "blue"],
  ["night", "lavender", "orange"],
  ["blue", "yellow", "night"],
  ["night", "pink", "yellow"],
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
  const [title, orbit, weather] = palette;

  return {
    seed,
    layout,
    colors: { title, orbit, weather },
    chipColors: [orbit, weather].filter((name) => name !== "night"),
  };
}
