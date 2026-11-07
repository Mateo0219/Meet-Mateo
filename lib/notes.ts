export type NoteBlock =
  | { type: "p"; text: string }
  | { type: "h"; text: string }
  | { type: "quote"; text: string }
  | { type: "list"; items: { title: string; text: string }[] };

export interface Note {
  id: string;
  title: string;
  folder: "关于" | "运动" | "这台电脑";
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
    preview: "在上海写代码、踢球、听歌。",
    blocks: [
      { type: "p", text: "我是 Mateo，在上海。写代码，踢中场，打乒乓，收集歌单。" },
      { type: "quote", text: "我把观察到的信号，转译成能被听见、看见和使用的东西。" },
      { type: "h", text: "我在意的事" },
      {
        type: "list",
        items: [
          { title: "先感受，再定义", text: "音乐、球场、街道与日常都是输入。先把注意力放进去，答案才开始成形。" },
          { title: "把模糊，变成界面", text: "把还说不清的念头拆成结构、交互和可以被真实使用的产品。" },
          { title: "保持流动，继续迭代", text: "不把第一版当结论。像在场上判断下一次跑位，让东西持续接近它该有的样子。" },
        ],
      },
      { type: "p", text: "永远保留一个没有被答案填满的位置。" },
    ],
    link: { label: "在 GitHub 上找我", href: "https://github.com/mateo0219" },
  },
  {
    id: "football",
    title: "我为什么喜欢踢球",
    folder: "运动",
    preview: "场上没有人能独自完成一切。",
    blocks: [
      {
        type: "p",
        text: "我喜欢足球，不是因为它总有漂亮的结果，而是因为场上没有人能独自完成一切。判断、沟通、跑动和信任，会在九十分钟里变得非常诚实。",
      },
      { type: "h", text: "位置：中场" },
      {
        type: "list",
        items: [
          { title: "先看空间", text: "先观察空当、队友与对手，再决定下一步。好的跑位往往发生在拿球之前。" },
          { title: "相信队友", text: "一次回追、一脚传球、一次主动补位。信任在球场上从来不是抽象词。" },
          { title: "留在节奏里", text: "比分会变，体力会掉。真正稳定的是注意力，以及完成下一次跑动的意愿。" },
        ],
      },
      { type: "quote", text: "有失误也没关系，下一次继续跑。" },
    ],
    link: { label: "打开足球页面", href: "/football" },
  },
  {
    id: "pingpong",
    title: "乒乓",
    folder: "运动",
    preview: "旋转很快，注意力要更快。",
    blocks: [{ type: "p", text: "旋转很快，注意力要更快。这一篇还在写。" }],
  },
  {
    id: "moments",
    title: "记录",
    folder: "关于",
    preview: "这里暂时还是空的。",
    blocks: [{ type: "p", text: "这里暂时还是空的。等遇到想留下来的照片和文字，再从这里开始更新。不赶时间。" }],
  },
  {
    id: "how",
    title: "这台电脑怎么用",
    folder: "这台电脑",
    preview: "点击场景、⌘K 搜索、拖动探索。",
    blocks: [
      {
        type: "list",
        items: [
          { title: "打开", text: "点击工作台、球台、音乐角或生活照片，也可以从底部 Dock 进入。左上角 Mateo OS 菜单里还有此刻、备忘录和终端。" },
          { title: "探索", text: "在电脑上拖动画布，右下角可以缩放。点击总览会收起窗口并回到初始视角；手机上向下滚动浏览四个场景。" },
          { title: "搜索", text: "按 ⌘K（Windows 上是 Ctrl K）打开 Spotlight，能搜到应用、备忘录和每一个碎片。" },
          { title: "窗口", text: "拖标题栏移动，拖边缘缩放，双击标题栏放大。黄色按钮会把窗口收回 Dock。" },
          { title: "终端", text: "输入 help 看看能做什么。" },
        ],
      },
    ],
  },
  {
    id: "site",
    title: "这个网站是怎么做的",
    folder: "这台电脑",
    preview: "四个场景，一个持续生长的个人空间。",
    blocks: [
      { type: "p", text: "工作台、球台、音乐角和生活照片，是这个空间的四个入口。暖白色背景和蓝色细节把它们连在一起，点击场景就能打开对应的内容。" },
      { type: "p", text: "「此刻」海报由上海的时间、天气、歌单和生日这些实时信号，加一个随机种子生成。首页的音乐浮条与播放器同步，收起窗口后仍能继续听歌。" },
      { type: "p", text: "「此刻」里的自我介绍像模型输出一样逐个 token 流出来。候选词和概率是我手写的预设分布，网站不调用任何大模型。" },
      { type: "p", text: "「碎片」的隐空间视图，把每个碎片的 12 维标签向量按余弦距离做多维缩放（MDS），在浏览器里摊到二维。" },
      { type: "p", text: "还有一份给 AI 代理读的简介：llms.txt。" },
    ],
    link: { label: "查看源码", href: "https://github.com/Mateo0219/Meet-Mateo" },
  },
];

export const noteById = Object.fromEntries(notes.map((note) => [note.id, note])) as Record<string, Note>;
