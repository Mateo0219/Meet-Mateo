# Meet Mateo

用 Next.js App Router 构建的个人空间。首页以暖白色背景、蓝色细节和三个立体场景呈现 vibe coding、乒乓球与生活。点击场景或底部 Dock 打开内容，保留 Mac 风格的窗口与交互。

## 功能

- 空间首页：三个独立透明场景、中心 MATEO 字标、蓝色连接线；电脑上可拖动（带惯性）、滚轮或双指移动、捏合缩放，点击总览复位并收起窗口
- 顶栏：北京实时天气、时钟、搜索、关于；Mateo OS 菜单提供其他应用入口、窗口恢复与手动锁屏。默认直接进入首页
- 底部 Dock：总览、作品、乒乓球、生活
- 窗口：从被点击的图标位置弹开、最小化时收回 Dock；标题栏 1:1 拖动并在边缘橡皮筋回弹；八个方向缩放；双击标题栏放大
- Spotlight（⌘K / Ctrl K）：搜索应用、备忘录正文和每一个碎片
- 此刻：根据北京时间、天气、生日倒计时生成的海报；自我介绍像模型输出一样逐个 token 流出，可换词、调 temperature（候选与概率为手写预设）
- 碎片：同一组贴纸三种整理方式——散落（可拖拽甩出）、隐空间（12 维标签向量按余弦距离做 MDS 摊到二维）、归类
- 作品：作品集，支持截图、录屏和 GitHub 链接，内容在 `lib/projects.ts`
- 乒乓球：「打一局」与电脑对打（带旋转弧线和最长回合记录）；「我的球」放 B 站视频，内容在 `lib/pingpong-videos.ts`
- 朋友圈：Mateo 登录后发图文，访客可点赞，见下方「朋友圈配置」
- 备忘录：关于我、足球笔记、乒乓、使用说明
- 终端：help、open、play、weather、sample 等预设命令
- `/llms.txt`：给 AI 代理阅读的个人简介
- 手机上三个场景纵向排列，Dock 固定在底部，应用以可下拉关闭的全屏面板打开
- 支持减少动态、减少透明度与增强对比偏好

网站运行时不调用任何大模型；「此刻」保留可见的采样过程，「碎片」保留语义向量布局。首页场景为预先生成的静态图片。
天气路由只请求固定的北京坐标，同样带超时、重定向阻止和大小限制。

## 技术栈

- Next.js 15（App Router）
- React 18 与 TypeScript
- Motion for React
- 手写响应式 CSS
- Lucide React
- Vitest 与 Playwright

## 项目结构

```text
app/
├── api/moments/        # 朋友圈：动态、图片、登录、点赞
├── api/weather/        # 北京天气（Open-Meteo）
├── football/           # 足球主题页
├── moments/            # 旧链接，跳转到朋友圈
├── layout.tsx          # 根布局
└── page.tsx            # 首页
components/os/          # 空间首页、窗口、Spotlight、锁屏、手机面板与 apps/
components/             # 详情页导航
lib/                    # 窗口管理、Spotlight、终端命令、海报生成、token 采样、碎片向量布局、信号与安全校验
public/scenes/          # 三个透明 WebP 场景与生成提示词
public/projects/        # 作品集的截图和录屏（按需创建）
supabase/schema.sql     # 朋友圈数据库结构
public/llms.txt         # 给 AI 代理读的简介
tests/                  # 单元测试
e2e/                    # 浏览器交互回归测试
```

## 本地开发

需要 Node.js 20.19 或更高版本。

```bash
npm install
npm run dev
```

打开 <http://localhost:3000>。

## 验证

```bash
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium  # 首次运行浏览器测试时安装
npm run test:e2e
```

浏览器回归覆盖场景与 Dock 导航、画布拖动缩放、手机滚动、乒乓球发球、朋友圈点赞与发布入口、锁屏深链接、重复打开备忘录/碎片、详情页返回、最小化后的键盘焦点和不同屏幕尺寸的候选词选择。
测试会自动在 `127.0.0.1:3107` 启动本地服务，并使用固定的天气与朋友圈数据，避免外部接口波动影响交互验证。

## 页面

- `/`：首页
- `/football`：足球与我
- `/moments`：跳转到朋友圈

## 视觉系统

按确认的 UI 参考图实现：暖白背景、石材与木材的场景质感、克制的玻璃浮层，交互色使用蓝色。首页固定浅色；窗口沿用现有拖动、缩放和最小化行为，并适配减少动态、减少透明度偏好。

`components/os/SpaceHome.tsx` 负责场景布局与交互，`app/space.css` 负责视觉样式。文字、按钮和连接线均为网页元素，场景图片可独立替换。

### 场景素材

当前使用 2.5D 透明图片图层，并非实时 3D 模型。场景图通过内置 `image_gen` 的参考图编辑模式生成，输入为确认的 UI 图，设置 `transparent_background: true`。完整提示词保存在 `public/scenes/prompts.json`。

产物为 `public/scenes/{work,pingpong,life}.webp`，保留 1536 × 1024 分辨率与 Alpha 通道，合计约 675 KiB。WebP 压缩只用于部署，场景和阴影均与背景独立。`work` 和 `life` 中的北京地标（中国尊、央视大楼）是在生成图上后期绘制的；`prompts.json` 已改为北京版本，重新生成时会直接画出来。后续替换模型时可沿用现有场景入口和 Dock 逻辑。

## 朋友圈配置

本地开发不需要账号：数据存在 `.data/`，密码写在 `.env.local` 的 `MOMENTS_PASSWORD`。点朋友圈封面上的头像登录。

部署到线上需要持久存储：

1. 在 Supabase 新建项目，到 SQL Editor 运行 `supabase/schema.sql`。
2. 在部署平台设置环境变量 `MOMENTS_PASSWORD`、`SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`（见 `.env.example`）。

没有配置时，线上朋友圈显示为空，也无法发布。

## 相关链接

- GitHub: <https://github.com/Mateo0219/Meet-Mateo>

Private - 个人项目
