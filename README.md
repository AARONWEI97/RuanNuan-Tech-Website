# 冉暖科技 RanNuan Tech — 官方网站

> 用技术创造温暖。专注鞋服零售、视频娱乐平台与音乐领域的软件开发团队。

[![GitHub stars](https://img.shields.io/github/stars/AARONWEI97/RuanNuan-Tech-Website?style=social)](https://github.com/AARONWEI97/RuanNuan-Tech-Website)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

在线访问：<https://ranuan.netlify.app/>

## 项目简介

基于 [Astro](https://astro.build) 的静态官网，构建产物是纯 HTML/CSS/JS，部署在 Netlify。动效用 GSAP + Lenis，首页与产品页背景是手写 WebGL 着色器。

展示四款产品：

| 产品 | 说明 | 页面 |
|------|------|------|
| 冉暖订货系统 | AI 智能订货管理工具，鞋服零售行业专用 | `/order.html` |
| 冉暖音乐播放器 | 桌面 + 移动双平台，7 音源聚合 + 3D 宇宙相册 | `/music.html` |
| 冉暖收银系统 | 轻量级 ePOS 收银方案 | `/epos.html` |
| 冉暖视频播放器 | 桌面 / Android / 电视多端视频聚合 | `/tv.html` |

另有价格方案、使用教程、常见问题、更新日志、路线图、隐私政策、使用条款和 404 页，共 13 页。

各产品的当前版本号以 [`src/data/products.ts`](src/data/products.ts) 为准。

## 技术栈

- Astro 6（静态输出）+ TypeScript strict
- GSAP 3 / ScrollTrigger + Lenis 平滑滚动
- 手写 WebGL 背景（不用 Three.js）
- 自托管字体：Syne / DM Sans / JetBrains Mono（`@fontsource-variable`）
- Font Awesome 6 图标，构建期内联为 SVG（Iconify）

## 本地开发

需要 Node.js 22.12 或更高版本。

```bash
npm install
```

```bash
npm run dev
```

开发服务器默认在 <http://localhost:4321>。

| 命令 | 作用 |
|------|------|
| `npm run dev` | 本地开发，改动热更新 |
| `npm run build` | 类型检查（`astro check`）后构建到 `dist/` |
| `npm run preview` | 本地预览 `dist/` 构建结果 |
| `npm run check` | 只跑类型检查 |

## 项目结构

```
.
├── src/
│   ├── pages/        # 每个 .astro 对应一个页面（order.astro → /order.html）
│   ├── layouts/      # BaseLayout / ProductLayout / ContentLayout
│   ├── components/   # 导航、页脚、弹窗、宠物挂件；home/ 首页区块；product/ 产品页区块
│   ├── data/         # products / changelog / faq / site —— 版本号与文案在这里改
│   ├── scripts/      # 全站运行时、页面脚本、动效与 WebGL
│   ├── styles/       # 设计令牌、通用样式、各页样式
│   └── lib/url.ts    # 站内路径辅助
├── public/           # 原样发布：assets/、robots.txt、sitemap.xml、site.webmanifest
├── astro.config.mjs
├── netlify.toml      # Netlify 构建命令、缓存头、旧网址跳转
└── UPGRADE-CONTRACT.md  # 开发契约：目录约定、数据源、data-* 钩子、无障碍与性能规则
```

改代码前先看 [UPGRADE-CONTRACT.md](UPGRADE-CONTRACT.md)。

## 常见改动

- 发新版本：改 `src/data/products.ts` 的版本号，在 `src/data/changelog.ts` 加一条更新记录。首页、产品页、更新日志会一起更新。
- 加 FAQ：编辑 `src/data/faq.ts`。
- 改联系方式 / 导航 / 页脚：编辑 `src/data/site.ts`。
- 换截图：放进 `public/assets/`，在对应页面或 `products.ts` 里改路径和宽高。

## 部署（Netlify）

仓库已连接 Netlify，流程和以前一样：把代码推到 GitHub 的部署分支（`main`），Netlify 自动构建并上线。

区别在于 Netlify 现在要先构建。`netlify.toml` 已经写好：

- 构建命令 `npm run build`
- 发布目录 `dist`
- Node 版本 22

`dist/` 和 `node_modules/` 不提交，Netlify 会自己安装依赖并构建。推送其他分支或开 PR 时，Netlify 会生成预览链接（需在 Netlify 后台开启 Deploy Previews）。

## 浏览器兼容性

支持近两年的 Chrome、Edge、Firefox、Safari。不支持 IE。

## 开发者

- Aaron Wei — 全栈开发、UI 设计
- 微信 `AaronWei24` / QQ `249861749`（添加请注明：冉暖科技咨询）

## 许可证

[MIT](LICENSE) © 2025 冉暖科技 RanNuan Tech
