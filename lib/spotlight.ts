import { fragmentKinds, fragments } from "./fragments";
import { notes } from "./notes";
import { apps, GITHUB_URL, type AppId } from "./os-apps";
import type { SwatchName } from "./poster";

export type SpotlightAction =
  | { type: "app"; id: AppId; payload?: string }
  | { type: "link"; href: string }
  | { type: "command"; command: "regenerate" | "lock" };

export interface SpotlightItem {
  id: string;
  title: string;
  subtitle: string;
  group: "应用" | "备忘录" | "碎片" | "操作";
  keywords: string[];
  swatch: SwatchName;
  action: SpotlightAction;
}

export function buildSpotlightIndex(): SpotlightItem[] {
  return [
    ...apps.map((app) => ({
      id: `app:${app.id}`,
      title: app.name,
      subtitle: "应用",
      group: "应用" as const,
      keywords: app.keywords,
      swatch: app.swatch,
      action: { type: "app" as const, id: app.id },
    })),
    ...notes.map((note) => ({
      id: `note:${note.id}`,
      title: note.title,
      subtitle: `备忘录 · ${note.preview}`,
      group: "备忘录" as const,
      // Index the full body so content words ("足球") find the note, not just its title.
      keywords: [
        note.folder,
        ...note.blocks.flatMap((block) => (block.type === "list" ? block.items.flatMap((item) => [item.title, item.text]) : [block.text])),
      ],
      swatch: "orange" as const,
      action: { type: "app" as const, id: "notes" as const, payload: note.id },
    })),
    ...fragments.map((fragment) => ({
      id: `fragment:${fragment.id}`,
      title: fragment.label,
      subtitle: `碎片 · ${fragmentKinds[fragment.kind].label}`,
      group: "碎片" as const,
      keywords: [fragment.detail, ...Object.keys(fragment.tags)],
      swatch: fragmentKinds[fragment.kind].swatch,
      action: { type: "app" as const, id: "fragments" as const, payload: fragment.id },
    })),
    { id: "cmd:regenerate", title: "重新生成此刻", subtitle: "操作 · 换一个随机种子", group: "操作", keywords: ["regenerate", "seed", "壁纸", "配色"], swatch: "yellow", action: { type: "command", command: "regenerate" } },
    { id: "cmd:lock", title: "锁定屏幕", subtitle: "操作", keywords: ["lock", "锁屏"], group: "操作", swatch: "night", action: { type: "command", command: "lock" } },
    { id: "link:github", title: "GitHub", subtitle: "链接 · @mateo0219", group: "操作", keywords: ["github", "code", "源码"], swatch: "night", action: { type: "link", href: GITHUB_URL } },
  ];
}

function scoreItem(item: SpotlightItem, terms: string[]): number {
  const title = item.title.toLowerCase();
  const haystack = [item.title, item.subtitle, ...item.keywords].join(" ").toLowerCase();
  if (!terms.every((term) => haystack.includes(term))) return 0;
  const first = terms[0];
  if (title === first) return 120;
  if (title.startsWith(first)) return 100;
  if (title.includes(first)) return 80;
  if (item.keywords.some((keyword) => keyword.toLowerCase().startsWith(first))) return 60;
  return 30;
}

const groupWeight: Record<SpotlightItem["group"], number> = { 应用: 4, 操作: 3, 备忘录: 2, 碎片: 1 };

export function searchSpotlight(index: readonly SpotlightItem[], query: string, limit = 8): SpotlightItem[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return index.filter((item) => item.group === "应用").slice(0, limit);
  return index
    .map((item, position) => ({ item, position, score: scoreItem(item, terms) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || groupWeight[b.item.group] - groupWeight[a.item.group] || a.position - b.position)
    .slice(0, limit)
    .map((entry) => entry.item);
}
