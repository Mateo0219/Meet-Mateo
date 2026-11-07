# Meet Mateo

用 Next.js App Router 构建的个人空间。首页以暖白色背景、蓝色细节和四个立体场景呈现代码、乒乓球、音乐与生活。点击场景或底部 Dock 打开内容，保留 Mac 风格的窗口与交互。

## 功能

- 空间首页：四个独立透明场景、中心 MATEO 字标、蓝色连接线；电脑上可拖动画布和缩放，点击总览复位并收起窗口
- 顶栏：上海实时天气、时钟、搜索、关于；Mateo OS 菜单提供其他应用入口、窗口恢复与手动锁屏。默认直接进入首页
- 底部 Dock：总览、作品、音乐、乒乓球、生活
- 窗口：从被点击的图标位置弹开、最小化时收回 Dock；标题栏 1:1 拖动并在边缘橡皮筋回弹；八个方向缩放；双击标题栏放大
- Spotlight（⌘K / Ctrl K）：搜索应用、备忘录正文和每一个碎片
- 此刻：根据上海时间、天气、今天抽到的歌、生日倒计时生成的海报；自我介绍像模型输出一样逐个 token 流出，可换词、调 temperature（候选与概率为手写预设）
- 碎片：同一组贴纸三种整理方式——散落（可拖拽甩出）、隐空间（12 维标签向量按余弦距离做 MDS 摊到二维）、归类
- 作品：当前的 Mateo OS 项目介绍和源码入口
- 音乐：网易云歌单、封面拖拽切歌、LRC 歌词同步；首页浮条显示真实歌曲和进度，窗口最小化后仍可暂停与继续播放
- 备忘录：关于我、足球笔记、乒乓、记录、使用说明
- 终端：help、open、play、weather、sample 等预设命令
- `/llms.txt`：给 AI 代理阅读的个人简介
- 手机上四个场景纵向排列，Dock 固定在底部，应用以可下拉关闭的全屏面板打开
- 支持减少动态、减少透明度与增强对比偏好

网站运行时不调用任何大模型；「此刻」保留可见的采样过程，「碎片」保留语义向量布局。首页场景为预先生成的静态图片。
歌单与歌词通过服务端路由访问固定的网易云接口，音频使用网易云外链，不依赖第三方 Meting 服务。默认歌单在 `lib/music-config.ts` 中配置，当前为「Mateo_0219喜欢的音乐」（539209250）。服务端根据歌曲 ID 分批补齐详情、保留原顺序，每 10 分钟按访问触发缓存更新；后台刷新失败时保留上次成功的数据。歌单声明数量与公开可读取数量不一致时，播放器会分别显示。音频仅在播放时请求，受限曲目提供网易云收听入口。服务端只接受数字资源 ID，并包含重定向阻止、请求超时和流式响应大小限制，避免成为任意网络代理。天气路由只请求固定的上海坐标，同样带超时、重定向阻止和大小限制。

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
├── api/music/          # 歌单与歌词服务端接口
├── api/weather/        # 上海天气（Open-Meteo）
├── football/           # 足球主题页
├── moments/            # 生活动态页
├── layout.tsx          # 根布局
└── page.tsx            # 首页
components/os/          # 空间首页、窗口、Spotlight、锁屏、手机面板与 apps/
components/             # 播放器与详情页导航
lib/                    # 窗口管理、Spotlight、终端命令、海报生成、token 采样、碎片向量布局、信号与安全校验
public/scenes/          # 四个透明 WebP 场景与生成提示词
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

浏览器回归覆盖场景与 Dock 导航、画布拖动缩放、手机滚动、真实音频元素的迷你播放器控制、锁屏深链接、重复打开备忘录/碎片、详情页返回、最小化后的键盘焦点和不同屏幕尺寸的候选词选择。
测试会自动在 `127.0.0.1:3107` 启动本地服务，并使用固定的歌单与天气数据，避免外部接口波动影响交互验证。

## 页面

- `/`：首页
- `/football`：足球与我
- `/moments`：生活动态

## 视觉系统

按确认的 UI 参考图实现：暖白背景、石材与木材的场景质感、克制的玻璃浮层，交互色使用蓝色。首页固定浅色；窗口沿用现有拖动、缩放和最小化行为，并适配减少动态、减少透明度偏好。

`components/os/SpaceHome.tsx` 负责场景布局与交互，`app/space.css` 负责视觉样式。文字、按钮、连接线和播放器均为网页元素，场景图片可独立替换。

### 场景素材

当前使用 2.5D 透明图片图层，并非实时 3D 模型。四张图通过内置 `image_gen` 的参考图编辑模式生成，输入为确认的 UI 图，设置 `transparent_background: true`。完整提示词保存在 `public/scenes/prompts.json`。

产物为 `public/scenes/{work,pingpong,music,life}.webp`，保留 1536 × 1024 分辨率与 Alpha 通道，合计约 806 KiB。WebP 压缩只用于部署，场景和阴影均与背景独立。后续替换模型时可沿用现有场景入口、Dock 和播放器逻辑。

## 相关链接

- GitHub: <https://github.com/Mateo0219/Meet-Mateo>

Private - 个人项目
