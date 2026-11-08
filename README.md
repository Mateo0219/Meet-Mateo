# Mateo 岛

Mateo 的个人网站：一座可以走进去逛的手绘小岛。开场一句“今天换你来当我”，访客操控的就是 Mateo 本人，边玩边认识 Mateo。

## 岛上有什么

| 地方 | 内容 |
|---|---|
| Mateo 工作室 | 作品集，支持截图、录屏和 GitHub 链接 |
| 乒乓球场 | 「打一局」与电脑对打，「我的球」放 B 站视频 |
| 照片墙 | 朋友圈：Mateo 登录后发图文，访客可以点赞 |
| 我的房间 | 关于我和备忘录 |
| 念头花园 | 碎片：散落、隐空间、归类三种整理方式 |
| 钟楼 | 此刻：由时间、天气和生日生成的海报 |
| Mateo 雕像 | 没什么用，但很重要 |
| 小机场 | 飞回峨山：Mateo 长大的地方，一张单独的小地图 |

## 玩法

- 电脑用方向键或 WASD 走路，也可以点地面自动走过去；手机和 iPad 用摇杆。
- 靠近有牌子的地方，按空格或点屏幕下方的按钮进入。右上角小地图可以直接传送。
- 今天的待办：做个东西、打一局球、看看朋友圈。
- 岛上藏着 9 个念头，集齐后送到工作室。
- 按 ⌘K（Windows 上是 Ctrl K）打开搜索，终端也从这里进。
- 光线跟着北京时间变化，分白天、傍晚和夜晚。

世界全部用 Canvas 绘制，不依赖 3D 引擎。网站运行时不调用任何大模型，「此刻」里的候选词和概率是手写的预设分布。

## 怎么改内容

| 想改什么 | 改哪里 |
|---|---|
| 作品 | `lib/projects.ts`，截图和录屏放 `public/projects/` |
| 乒乓球视频 | `lib/pingpong-videos.ts`，填 B 站 BV 号 |
| 关于我和备忘录 | `lib/notes.ts` |
| 碎片 | `lib/fragments.ts` |
| 地图、地点、台词 | `lib/world.ts` |
| 建筑和人物的画法 | `components/world/art.ts` |
| 朋友圈 | 在网站上登录后直接发布 |

## 技术栈

Next.js 15（App Router）、React 18、TypeScript、Canvas 2D、Motion for React、手写 CSS、Lucide React、Supabase（朋友圈）、Vitest、Playwright。

## 项目结构

```text
app/
├── api/moments/        # 朋友圈：动态、图片、登录、点赞
├── api/weather/        # 北京天气（Open-Meteo）
├── moments/            # 旧链接，跳转到朋友圈
├── world/              # 旧链接，跳转到首页
└── page.tsx            # 首页：Mateo 岛
components/world/       # 小岛的绘制、走动和界面
components/os/          # 窗口、手机面板、搜索和各个应用
lib/world.ts            # 两张地图、碰撞和寻路
lib/pingpong.ts         # 乒乓球规则与物理
lib/moments*.ts         # 朋友圈的校验、登录和存储
public/llms.txt         # 给 AI 代理读的简介
supabase/schema.sql     # 朋友圈数据库结构
tests/                  # 单元测试
e2e/                    # 浏览器交互回归测试
```

## 本地开发

需要 Node.js 20.19 或更高版本。

```bash
npm install
npm run dev
```

打开 <http://localhost:3000>。网址加 `?skip=1` 跳过开场，加 `?t=day`、`?t=dusk` 或 `?t=night` 预览不同时段。

## 验证

```bash
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium  # 首次运行浏览器测试时安装
npm run test:e2e
```

浏览器测试会在 `127.0.0.1:3107` 启动本地服务。它和 `npm run dev` 共用 `.next` 目录，不要同时运行。

## 朋友圈配置

本地开发不需要账号：数据存在 `.data/`，在 `.env.local` 里设置 `MOMENTS_PASSWORD`，然后点朋友圈封面上的头像登录。

部署到线上需要持久存储：

1. 在 Supabase 新建项目，到 SQL Editor 运行 `supabase/schema.sql`。
2. 在部署平台设置环境变量 `MOMENTS_PASSWORD`、`SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`（见 `.env.example`）。

没有配置时，线上朋友圈显示为空，也无法发布。

## 页面

- `/`：Mateo 岛
- `/#moments`、`/#pingpong`、`/#fragments`：直接打开对应内容
- `/llms.txt`：给 AI 代理阅读的简介

## 相关链接

- GitHub: <https://github.com/Mateo0219/Meet-Mateo>
