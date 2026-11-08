import type { SwatchName } from "./poster";

export type AppId = "now" | "fragments" | "notes" | "terminal" | "llms" | "about" | "projects" | "pingpong" | "moments";

export type AppIconName = "sparkles" | "shapes" | "pingpong" | "moments" | "notes" | "terminal" | "file" | "user";

export interface AppMeta {
  id: AppId;
  name: string;
  title: string;
  icon: AppIconName;
  swatch: SwatchName;
  size: { width: number; height: number };
  minSize: { width: number; height: number };
  inDock: boolean;
  keywords: string[];
}

export const apps: AppMeta[] = [
  {
    id: "projects", name: "作品", title: "Vibe Coding", icon: "terminal", swatch: "blue",
    size: { width: 880, height: 680 }, minSize: { width: 480, height: 400 }, inDock: true,
    keywords: ["work", "projects", "vibe coding", "代码", "产品", "作品"],
  },
  {
    id: "now",
    name: "此刻",
    title: "此刻",
    icon: "sparkles",
    swatch: "yellow",
    size: { width: 980, height: 660 },
    minSize: { width: 560, height: 440 },
    inDock: true,
    keywords: ["poster", "海报", "时间", "天气", "生成", "token", "temperature", "now"],
  },
  {
    id: "fragments",
    name: "碎片",
    title: "碎片",
    icon: "shapes",
    swatch: "lime",
    size: { width: 1000, height: 680 },
    minSize: { width: 560, height: 480 },
    inDock: true,
    keywords: ["fragments", "隐空间", "向量", "贴纸", "mds", "归类", "latent"],
  },
  {
    id: "pingpong", name: "乒乓球", title: "乒乓球", icon: "pingpong", swatch: "blue",
    size: { width: 900, height: 640 }, minSize: { width: 460, height: 460 }, inDock: true,
    keywords: ["pingpong", "table tennis", "乒乓", "球台", "游戏", "打一局", "视频"],
  },
  {
    id: "moments", name: "朋友圈", title: "朋友圈", icon: "moments", swatch: "orange",
    size: { width: 620, height: 720 }, minSize: { width: 380, height: 420 }, inDock: true,
    keywords: ["moments", "朋友圈", "动态", "记录", "生活", "照片"],
  },
  {
    id: "notes",
    name: "备忘录",
    title: "备忘录",
    icon: "notes",
    swatch: "orange",
    size: { width: 860, height: 600 },
    minSize: { width: 520, height: 400 },
    inDock: true,
    keywords: ["notes", "关于", "足球", "记录", "about", "football"],
  },
  {
    id: "terminal",
    name: "终端",
    title: "mateo — zsh",
    icon: "terminal",
    swatch: "night",
    size: { width: 680, height: 440 },
    minSize: { width: 420, height: 260 },
    inDock: true,
    keywords: ["terminal", "shell", "命令", "zsh", "cli"],
  },
  {
    id: "llms",
    name: "llms.txt",
    title: "llms.txt",
    icon: "file",
    swatch: "lavender",
    size: { width: 640, height: 560 },
    minSize: { width: 380, height: 300 },
    inDock: false,
    keywords: ["llms", "agent", "ai", "给 AI 读"],
  },
  {
    id: "about",
    name: "关于 Mateo",
    title: "",
    icon: "user",
    swatch: "blue",
    size: { width: 520, height: 360 },
    minSize: { width: 520, height: 360 },
    inDock: false,
    keywords: ["about", "关于本机", "mateo os"],
  },
];

export const appById = Object.fromEntries(apps.map((app) => [app.id, app])) as Record<AppId, AppMeta>;

export const GITHUB_URL = "https://github.com/mateo0219";
export const PROJECT_URL = "https://github.com/Mateo0219/Meet-Mateo";
