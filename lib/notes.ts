export type NoteBlock =
  | { type: "p"; text: string }
  | { type: "h"; text: string }
  | { type: "quote"; text: string }
  | { type: "list"; items: { title: string; text: string }[] };

export interface Note {
  id: string;
  title: string;
  folder: "关于" | "运动" | "这座岛";
  preview: string;
  blocks: NoteBlock[];
  link?: { label: string; href: string };
}

// Copy comes from the site's existing pages; edit freely.
export const notes: Note[] = [
  {
    id: "about",
    title: "关于我",
    folder: "关于",
    preview: "在北京 vibe coding、打乒乓、听歌。",
    blocks: [
      { type: "p", text: "我是 Mateo，在北京。vibe coding，打乒乓，收集歌单。" },
      { type: "quote", text: "我把观察到的信号，转译成能被听见、看见和使用的东西。" },
      { type: "h", text: "我在意的事" },
      {
        type: "list",
        items: [
          { title: "先感受，再定义", text: "音乐、街道与日常都是输入。先把注意力放进去，答案才开始成形。" },
          { title: "把模糊，变成界面", text: "把还说不清的念头拆成结构、交互和可以被真实使用的产品。" },
          { title: "保持流动，继续迭代", text: "不把第一版当结论。让东西持续接近它该有的样子。" },
        ],
      },
      { type: "p", text: "永远保留一个没有被答案填满的位置。" },
    ],
    link: { label: "在 GitHub 上找我", href: "https://github.com/mateo0219" },
  },
  {
    id: "pingpong",
    title: "乒乓",
    folder: "运动",
    preview: "旋转很快，注意力要更快。",
    blocks: [{ type: "p", text: "旋转很快，注意力要更快。这一篇还在写。" }],
  },
  {
    id: "how",
    title: "这座岛怎么逛",
    folder: "这座岛",
    preview: "走路、互动、⌘K 搜索。",
    blocks: [
      {
        type: "list",
        items: [
          { title: "走路", text: "电脑用方向键或 WASD，也可以点地面自动走过去；手机和 iPad 用左下角的摇杆。" },
          { title: "互动", text: "走到有牌子的地方，按空格或点屏幕下方的按钮。不想走路就点右上角小地图上的圆点。" },
          { title: "今天的待办", text: "做个东西、打一局球、看看朋友圈。三件都做完，就替 Mateo 过完了一天。" },
          { title: "念头", text: "岛上藏着 9 个发光的念头，集齐后送到工作室。" },
          { title: "搜索", text: "按 ⌘K（Windows 上是 Ctrl K）打开 Spotlight，能搜到备忘录、碎片，还有终端。" },
          { title: "窗口", text: "拖标题栏移动，拖边缘缩放，双击标题栏放大。" },
        ],
      },
    ],
  },
  {
    id: "site",
    title: "这个网站是怎么做的",
    folder: "这座岛",
    preview: "一座全程 vibe coding 做出来的小岛。",
    blocks: [
      { type: "p", text: "这座岛是用 vibe coding 做的。你操控的小人就是 Mateo，岛上每个地方对应 Mateo 的一面。地图、建筑和人物都是代码一笔一笔画出来的，没有用 3D 引擎。" },
      { type: "p", text: "「此刻」海报由北京的时间、天气和生日这些实时信号，加一个随机种子生成。" },
      { type: "p", text: "「此刻」里的自我介绍像模型输出一样逐个 token 流出来。候选词和概率是手写的预设分布，网站不调用任何大模型。" },
      { type: "p", text: "「碎片」的隐空间视图，把每个碎片的 12 维标签向量按余弦距离做多维缩放（MDS），在浏览器里摊到二维。" },
      { type: "p", text: "还有一份给 AI 代理读的简介：llms.txt。" },
    ],
    link: { label: "查看源码", href: "https://github.com/Mateo0219/Meet-Mateo" },
  },
];

export const noteById = Object.fromEntries(notes.map((note) => [note.id, note])) as Record<string, Note>;
