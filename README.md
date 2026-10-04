# 冉暖科技 RanNuan Tech — 官方网站

> 用技术创造温暖。专注鞋服零售与音乐领域的软件开发团队。

[![GitHub stars](https://img.shields.io/github/stars/AARONWEI97/RuanNuan-Tech-Website?style=social)](https://github.com/AARONWEI97/RuanNuan-Tech-Website)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 在线预览

<https://ranuan.netlify.app/>

## 项目简介

冉暖科技官方网站是一个纯静态前端项目，采用原生 HTML5 / CSS3 / JavaScript 构建，**零构建工具、零框架依赖**，追求极致的加载性能与细腻的交互动效。

网站展示团队旗下的四款核心产品：

| 产品 | 说明 | 页面 |
|------|------|------|
| **冉暖订货系统** | AI 智能订货管理工具，鞋服零售行业专用 | [order.html](order.html) |
| **冉暖音乐播放器** | 跨平台音乐播放器，7 音源聚合 + 3D 宇宙相册 | [music.html](music.html) |
| **冉暖收银系统** | 轻量级 ePOS 收银方案，双系统全链路 | [epos.html](epos.html) |
| **冉暖视频播放器** | 桌面端 + Android 双端视频聚合平台 | [tv.html](tv.html) |

## 技术栈

- **HTML5** — 语义化标签、无障碍访问（`skip-link`、`main` 地标、ARIA、焦点管理）
- **CSS3** — CSS 自定义属性（Design Tokens）、`backdrop-filter` 毛玻璃、Grid/Flexbox、`@keyframes`、圆锥渐变边框、`@property` 注册自定义属性
- **Vanilla JavaScript** — `IntersectionObserver` 滚动动画、事件委托、`requestAnimationFrame` 调度、Canvas 粒子、本地存储
- **Font Awesome 6** — 图标系统
- **Google Fonts** — Syne / DM Sans / Noto Sans SC 字体组合
- **SEO / 结构化数据** — Open Graph、Twitter Card、canonical、JSON-LD、`sitemap.xml`、`robots.txt`、`site.webmanifest`

> 不使用 React、Vue、Tailwind 等任何前端框架或构建工具，所有代码手写可控。

## 项目结构

```
.
├── index.html              # 首页（Hero + 产品矩阵 + 关于 + 联系）
├── order.html              # 冉暖订货系统产品页
├── music.html              # 冉暖音乐播放器产品页
├── epos.html               # 冉暖收银系统产品页
├── tv.html                 # 冉暖视频播放器产品页
├── pricing.html            # 价格方案页
├── tutorials.html          # 使用教程页
├── faq.html                # 常见问题页
├── changelog.html          # 更新日志页
├── roadmap.html            # 功能路线图页
├── privacy.html            # 隐私政策页
├── terms.html              # 使用条款页
├── 404.html                # 错误页（唯一使用根绝对路径的页面）
├── epos_dump.html          # 历史转储文件 → 已改为跳转存根（noindex）
├── robots.txt              # 抓取指引
├── sitemap.xml             # 站点地图（12 个页面）
├── site.webmanifest        # PWA 清单
├── UPGRADE-CONTRACT.md     # 升级改造接口契约（设计规范单一事实来源）
├── ANIMATION-GUIDE.md      # 动效层说明
├── css/
│   ├── style.css           # 设计令牌 + 重置 + 通用组件（导航/按钮/页脚/弹窗/显露/错误页）
│   ├── home.css            # 首页专属样式
│   ├── product.css         # 产品页专属样式（含从 music.html 抽出的内联样式）
│   ├── pages.css           # 内容页样式（教程/FAQ/更新日志/路线图）
│   ├── legal.css           # 价格与条款页样式
│   └── effects.css         # 全站特效层（fx- 命名空间）
├── js/
│   ├── main.js             # 核心运行时：导航、菜单、显露、计数器、弹窗、复制、表单
│   ├── effects.js          # 特效引擎：进度条、光晕、粒子、倾斜、视差、懒加载
│   ├── home.js             # 首页：Hero 星座粒子 + 3D 卡片
│   ├── pages.js            # 内容页：更新日志筛选等（按需加载）
│   └── product.js          # 产品页：网盘密码解锁（按需加载）
├── assets/
│   ├── logo.ico            # 品牌 Logo
│   ├── wechat-qr.jpg       # 微信二维码
│   ├── QQ-qr.png           # QQ 二维码
│   ├── screenshot-*.png    # 产品截图
│   ├── epos/               # ePOS 独立截图目录
│   ├── music/              # 音乐播放器截图
│   └── video/              # 视频播放器截图
└── README.md               # 本文件
```

## 核心特性

### 视觉设计

- **品牌色系统** — 以暖色琥珀金 `#D4943A` 为主色，搭配珊瑚红 `#F06B5E`、品牌绿 `#7BAE7F`，形成温暖科技感
- **自定义光标** — 独创「狗爪」形状光标（默认/指针双版本），强化品牌记忆；触屏设备与输入控件自动回退系统光标
- **毛玻璃导航栏** — 固定顶部导航，滚动时自动收缩高度并增加阴影，当前页高亮（`aria-current="page"`）
- **3D 卡片倾斜** — 产品卡片支持鼠标跟随的透视旋转效果
- **呼吸发光边框** — 产品页截图容器采用旋转圆锥渐变边框 + 呼吸 glow 动画

### 交互动效

- **滚动触发显示** — 基于 `IntersectionObserver` 的 `.reveal` 类动画，支持方向（上/左/右/缩放）和延迟级联
- **数字计数器** — 数据指标在滚动进入视口时从 0 动态递增到目标值，**支持后缀**（`+`、`%+`）
- **模态弹窗** — 微信/QQ 联系弹窗，完整的焦点陷阱、`Esc` 关闭、焦点归还与剪贴板复制
- **移动端汉堡菜单** — 三横线平滑变形为 X，`aria-expanded` 同步、`Esc` 关闭
- **滚动进度条** — 顶部暖金→珊瑚流光进度指示

### 无障碍

- 每页唯一 `<h1>`、`main#main` 地标、`skip-link` 跳转
- 弹窗 `role="dialog"` + `aria-modal` + `aria-labelledby` + 焦点锁
- 全站 `prefers-reduced-motion` 降级
- 图标 `aria-hidden`、图片 `alt`、键盘可达、可见焦点环

### 性能

- 首屏以下图片全部 `loading="lazy"` + `decoding="async"`，并锁定宽高比防 CLS
- Canvas 粒子数按设备能力分级（桌面 ≤60 / 触屏 ≤24），页面隐藏时暂停
- 滚动监听统一 `{ passive: true }` + `requestAnimationFrame` 节流
- 字体字重收敛至必要集合，`display=swap`
- **零内联事件处理器**，所有交互走 `data-*` 委托

### 响应式适配

全站支持桌面端 → 平板 → 手机的完整响应式断点：

- `≥1280px` — 大屏桌面
- `≥992px` — 标准桌面
- `768px ~ 991px` — 平板
- `≤767px` — 手机
- `≤480px` — 小屏手机

## 本地运行

本项目为纯静态网站，无需 Node.js 或构建步骤，任何 Web 服务器均可运行。

### 方式一：VS Code Live Server

1. 安装 [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) 插件
2. 在 `index.html` 上右键 → **Open with Live Server**
3. 浏览器自动打开 `http://127.0.0.1:5500`

### 方式二：Python 简易服务器

```bash
# Python 3
cd "Official website"
python -m http.server 8080

# 浏览器访问 http://localhost:8080
```

### 方式三：Nginx / Apache

将项目目录映射到 Web 服务器的根目录或子目录即可。

## 部署

### GitHub Pages

1. Fork 本仓库
2. 进入仓库 Settings → Pages
3. Source 选择「Deploy from a branch」→ `main` / `master` branch → `/ (root)`
4. 等待几分钟后访问 `https://<你的用户名>.github.io/RuanNuan-Tech-Website`

> 全站资源均使用**相对路径**，因此可部署在任意子路径下（`404.html` 除外 —— 错误页会被服务器在任意深度返回，必须使用根绝对路径，详见 `UPGRADE-CONTRACT.md` §2）。

### Netlify / Vercel

直接拖拽项目文件夹到 [Netlify Drop](https://app.netlify.com/drop) 即可一键部署。

## 版本一览

| 产品 | 版本 |
|------|------|
| 冉暖订货系统 | V 3.3.2 |
| 冉暖音乐播放器 | v3.5.0 |
| 冉暖收银系统 | V 2.1.2 |
| RanNuan TV | 桌面端 v2.1.1 / 移动端 v2.1.6 |

## 浏览器兼容性

| 浏览器 | 支持情况 |
|--------|----------|
| Chrome 90+ | ✅ 完全支持 |
| Edge 90+ | ✅ 完全支持 |
| Firefox 88+ | ✅ 完全支持 |
| Safari 15+ | ✅ 完全支持（部分 `backdrop-filter` 需 `-webkit-` 前缀）|
| IE 11 | ❌ 不支持 |

## 开发者

- **Aaron Wei** — 全栈开发、UI 设计
- 联系方式：微信 `AaronWei24` / QQ `249861749`
- 添加请注明：**冉暖科技咨询**

## 许可证

[MIT](LICENSE) © 2025 冉暖科技 RanNuan Tech

---

<p align="center">
  <a href="https://github.com/AARONWEI97/RuanNuan-Tech-Website">
    <img src="https://img.shields.io/badge/⭐%20Star%20支持一下-FFD700?style=for-the-badge&logo=github&logoColor=black" alt="Star">
  </a>
</p>
