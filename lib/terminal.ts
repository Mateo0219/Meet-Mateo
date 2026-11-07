import { noteById } from "./notes";
import { GITHUB_URL, type AppId } from "./os-apps";
import type { ShanghaiClock } from "./signals";
import type { BirthdayProgress } from "./time-progress";
import { applyTemperature, heroSentence, sampleSentence, sentenceText } from "./token-sentence";
import type { ShanghaiWeather } from "./weather";

export type LineTone = "plain" | "muted" | "error" | "pink" | "lime" | "yellow" | "blue";

export interface TerminalLine {
  text: string;
  tone?: LineTone;
}

export type TerminalEffect =
  | { type: "open"; app: AppId; payload?: string }
  | { type: "play" }
  | { type: "regenerate" }
  | { type: "clear" }
  | { type: "link"; href: string }
  | { type: "lock" }
  | { type: "close" };

export interface TerminalResult {
  lines: TerminalLine[];
  effect?: TerminalEffect;
}

export interface TerminalContext {
  clock: ShanghaiClock | null;
  weather: ShanghaiWeather | null;
  birthday: BirthdayProgress | null;
  playlistTotal: number | null;
  todaySong: { name: string; artist: string } | null;
  random: () => number;
}

export const terminalCommands = [
  ["help", "列出所有命令"],
  ["whoami", "我是谁"],
  ["ls", "列出桌面上的文件"],
  ["cat <文件>", "读一个文件，比如 cat 关于我.md"],
  ["open <应用>", "打开应用：此刻 碎片 音乐 备忘录 足球 记录 llms"],
  ["play", "播放今天抽到的歌"],
  ["weather", "上海现在的天气"],
  ["date", "上海现在的时间"],
  ["birthday", "离下一次生日还有多久"],
  ["sample [温度]", "按温度采样一句自我介绍，比如 sample 1.2"],
  ["regenerate", "重新生成此刻的配色和版式"],
  ["github", "打开 GitHub"],
  ["lock", "锁定屏幕"],
  ["clear", "清屏"],
  ["exit", "关闭终端"],
] as const;

const openTargets: Record<string, { app: AppId; payload?: string }> = {
  此刻: { app: "now" },
  now: { app: "now" },
  碎片: { app: "fragments" },
  fragments: { app: "fragments" },
  音乐: { app: "music" },
  music: { app: "music" },
  备忘录: { app: "notes" },
  notes: { app: "notes" },
  关于: { app: "notes", payload: "about" },
  about: { app: "about" },
  足球: { app: "notes", payload: "football" },
  football: { app: "notes", payload: "football" },
  记录: { app: "notes", payload: "moments" },
  moments: { app: "notes", payload: "moments" },
  llms: { app: "llms" },
  "llms.txt": { app: "llms" },
  终端: { app: "terminal" },
  terminal: { app: "terminal" },
};

const files: Record<string, string | { app: AppId; payload?: string }> = {
  "关于我.md": "about",
  "足球笔记.md": "football",
  "llms.txt": { app: "llms" },
};

function noteLines(noteId: string): TerminalLine[] {
  const note = noteById[noteId];
  if (!note) return [];
  return [
    { text: `# ${note.title}`, tone: "yellow" },
    ...note.blocks.flatMap((block): TerminalLine[] => {
      if (block.type === "list") return block.items.map((item) => ({ text: `- ${item.title}：${item.text}` }));
      if (block.type === "h") return [{ text: `## ${block.text}`, tone: "blue" }];
      if (block.type === "quote") return [{ text: `> ${block.text}`, tone: "pink" }];
      return [{ text: block.text }];
    }),
  ];
}

export function runCommand(raw: string, context: TerminalContext): TerminalResult {
  const input = raw.trim();
  if (!input) return { lines: [] };
  const [command, ...args] = input.split(/\s+/);
  const argument = args.join(" ");

  switch (command.toLowerCase()) {
    case "help":
      return {
        lines: [
          { text: "可用命令：", tone: "muted" },
          ...terminalCommands.map(([name, description]) => ({ text: `${name.padEnd(14, " ")}${description}` })),
        ],
      };
    case "whoami":
      return { lines: [{ text: "mateo", tone: "lime" }, { text: "在上海写代码、踢球、听歌。", tone: "muted" }] };
    case "ls":
      return { lines: [{ text: "关于我.md   足球笔记.md   记录/   llms.txt   Meet-Mateo@", tone: "blue" }] };
    case "cat": {
      if (!argument) return { lines: [{ text: "用法：cat <文件>", tone: "muted" }] };
      const file = files[argument];
      if (!file) return { lines: [{ text: `cat: ${argument}: 没有这个文件`, tone: "error" }] };
      if (typeof file === "string") return { lines: noteLines(file) };
      return { lines: [{ text: `正在打开 ${argument}…`, tone: "muted" }], effect: { type: "open", ...file } };
    }
    case "open": {
      if (!argument) return { lines: [{ text: "用法：open <应用>", tone: "muted" }] };
      if (argument.toLowerCase() === "github") return { lines: [{ text: "正在打开 GitHub…", tone: "muted" }], effect: { type: "link", href: GITHUB_URL } };
      const target = openTargets[argument.toLowerCase()] ?? openTargets[argument];
      if (!target) return { lines: [{ text: `open: 找不到「${argument}」`, tone: "error" }, { text: "试试：此刻 碎片 音乐 备忘录 足球 记录 llms", tone: "muted" }] };
      return { lines: [{ text: `正在打开 ${argument}…`, tone: "muted" }], effect: { type: "open", ...target } };
    }
    case "play":
      if (!context.todaySong) return { lines: [{ text: "歌单还在读取，稍等一下再试。", tone: "muted" }] };
      return { lines: [{ text: `▶ ${context.todaySong.name} — ${context.todaySong.artist}`, tone: "pink" }], effect: { type: "play" } };
    case "weather":
      if (!context.weather) return { lines: [{ text: "天气暂时读不到。", tone: "muted" }] };
      return { lines: [{ text: `上海 · ${context.weather.temperature}° · ${context.weather.label}`, tone: "blue" }] };
    case "date":
    case "time":
      if (!context.clock) return { lines: [{ text: "时钟还没准备好。", tone: "muted" }] };
      return { lines: [{ text: `${context.clock.weekday} ${context.clock.date} ${context.clock.time} · 上海（${context.clock.moment}）` }] };
    case "birthday":
      if (!context.birthday) return { lines: [{ text: "时钟还没准备好。", tone: "muted" }] };
      return {
        lines: [
          { text: `离下一次生日还有 ${context.birthday.daysUntilBirthday} 天`, tone: "yellow" },
          { text: `这一圈走了 ${context.birthday.birthdayPercent.toFixed(1)}%`, tone: "muted" },
        ],
      };
    case "sample": {
      const parsed = argument ? Number(argument) : 0.7;
      if (!Number.isFinite(parsed) || parsed <= 0) return { lines: [{ text: "用法：sample [温度]，温度要大于 0", tone: "muted" }] };
      const temperature = Math.min(parsed, 2);
      const choice = sampleSentence(context.random, temperature);
      const picks = heroSentence.flatMap((part) => {
        if (typeof part === "string") return [];
        const probabilities = applyTemperature(part.candidates.map((candidate) => candidate.weight), temperature);
        const index = choice[part.id] ?? 0;
        return [`${part.candidates[index].text} ${Math.round(probabilities[index] * 100)}%`];
      });
      return {
        lines: [
          { text: sentenceText(choice), tone: "lime" },
          { text: `temperature ${temperature.toFixed(1)} · ${picks.join(" · ")}`, tone: "muted" },
          { text: "候选和概率是预设的分布，不是实时模型输出。", tone: "muted" },
        ],
      };
    }
    case "regenerate":
      return { lines: [{ text: "已换一个随机种子。", tone: "yellow" }], effect: { type: "regenerate" } };
    case "github":
      return { lines: [{ text: "正在打开 GitHub…", tone: "muted" }], effect: { type: "link", href: GITHUB_URL } };
    case "lock":
      return { lines: [], effect: { type: "lock" } };
    case "clear":
      return { lines: [], effect: { type: "clear" } };
    case "exit":
      return { lines: [], effect: { type: "close" } };
    case "echo":
      return { lines: [{ text: argument }] };
    case "sudo":
      return { lines: [{ text: "Mateo 没有给你 root 权限 :)", tone: "pink" }] };
    default:
      return {
        lines: [
          { text: `zsh: command not found: ${command}`, tone: "error" },
          { text: "输入 help 查看可用命令", tone: "muted" },
        ],
      };
  }
}
