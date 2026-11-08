/**
 * The portfolio. To add a project, add an entry here; to add a screenshot or
 * screen recording, put the file in public/projects/ and list it under `media`.
 */
export type ProjectMedia =
  | { type: "image"; src: string; alt: string }
  | { type: "video"; src: string; poster?: string; label: string };

export type ProjectLink =
  | { kind: "external"; label: string; href: string; primary?: boolean }
  | { kind: "note"; label: string; noteId: string };

export interface Project {
  id: string;
  name: string;
  tagline: string;
  status: string;
  tags: string[];
  media: ProjectMedia[];
  links: ProjectLink[];
}

export const projects: Project[] = [
  {
    id: "meet-mateo",
    name: "Mateo 岛",
    tagline: "把灵感、爱好和日常，收进一个可以探索的个人空间。全程 vibe coding。",
    status: "持续迭代",
    tags: ["Vibe Coding", "Next.js", "TypeScript", "Motion"],
    media: [{ type: "image", src: "/scenes/work.webp", alt: "Mateo 的工作台场景" }],
    links: [
      { kind: "external", label: "GitHub", href: "https://github.com/Mateo0219/Meet-Mateo", primary: true },
      { kind: "note", label: "这个网站是怎么做的", noteId: "site" },
    ],
  },
  {
    id: "mateo-fit",
    name: "mateo-fit",
    tagline: "自用的 iPhone 健身 Agent：聊天记忆、训练饮食记录和后台任务。",
    status: "自用中",
    tags: ["Vibe Coding", "SwiftUI", "HealthKit"],
    media: [],
    links: [{ kind: "external", label: "GitHub", href: "https://github.com/Mateo0219/mateo-fit", primary: true }],
  },
];
