# Meet Mateo - 个人主页

一个现代化的个人主页网站，展示我的生活、兴趣和经历。

## 🌟 项目简介

这是我的个人主页，记录着我的生活、兴趣和思考。网站采用现代化的设计风格，包含粒子动画、实时时间显示、时光进度追踪等功能模块，让访问者能够更好地了解我。

## ✨ 主要功能

### 🏠 首页 (Hero)
- **粒子动画背景**：动态粒子效果围绕标题，营造科技感
- **实时时间组件**：显示当前日期、时间和星期
- **时光进度**：追踪年度进度和生日进度
- **音乐播放器**：在线音乐播放功能

### 📖 关于我 (About)
- 个人介绍和特点
- 个人经历时间线（教育、工作、荣誉等）

### 🏃 日常生活 (Lifestyle)
- **足球队经历**：详细展示足球运动经历（独立页面 `/football`）
- **乒乓球经历**：展示乒乓球运动成就和经历
- **朋友圈**：生活动态分享（独立页面 `/moments`）

### 📞 联系方式 (Contact)
- 社交媒体链接
- 联系方式展示

## 🛠️ 技术栈

- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **图标**: Lucide React
- **动画**: Canvas API (粒子动画)

## 📦 项目结构

```
personal-portfolio/
├── app/
│   ├── layout.tsx          # 根布局
│   ├── page.tsx            # 首页
│   ├── globals.css         # 全局样式
│   ├── football/           # 足球队页面
│   │   └── page.tsx
│   └── moments/            # 朋友圈页面
│       └── page.tsx
├── components/
│   ├── Header.tsx          # 导航栏
│   ├── Hero.tsx            # 首页主区域
│   ├── About.tsx           # 关于我
│   ├── Lifestyle.tsx       # 日常生活
│   ├── Contact.tsx         # 联系方式
│   ├── DateTime.tsx        # 时间组件
│   ├── TimeProgress.tsx   # 时光进度
│   ├── MusicPlayer.tsx     # 音乐播放器
│   └── ParticleAnimation.tsx # 粒子动画
└── ...
```

## 🚀 快速开始

### 前置要求

- Node.js 18+ 
- npm / yarn / pnpm

### 安装依赖

```bash
npm install
# 或
yarn install
# 或
pnpm install
```

### 开发模式

```bash
npm run dev
# 或
yarn dev
# 或
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看效果。

### 构建生产版本

```bash
npm run build
npm start
```

## 🎨 设计特色

- **极光渐变背景**：深邃的紫色、蓝色、青色、粉色渐变，营造梦幻氛围
- **毛玻璃效果**：半透明背景 + 模糊效果，现代感十足
- **粒子动画**：Canvas 实现的动态粒子网络，围绕标题展示
- **实时组件**：时间、进度等实时更新的交互组件
- **响应式设计**：完美适配桌面端和移动端

## 📄 页面说明

- **首页** (`/`): 个人介绍、时间组件、时光进度、音乐播放器
- **足球队** (`/football`): 详细的足球运动经历和成就
- **朋友圈** (`/moments`): 生活动态和分享

## 🔗 相关链接

- GitHub: [https://github.com/Mateo0219/Meet-Mateo](https://github.com/Mateo0219/Meet-Mateo)

## 📝 许可证

Private - 个人项目

---

Made with ❤️ by Mateo
