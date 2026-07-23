# 冉暖科技 RanNuan Tech — 官方网站

> 用技术创造温暖。专注鞋服零售与音乐领域的软件开发团队。

[![GitHub stars](https://img.shields.io/github/stars/AARONWEI97/RuanNuan-Tech-Website?style=social)](https://github.com/AARONWEI97/RuanNuan-Tech-Website)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 在线预览

[[https://rannuan.tech](https://ranuan.netlify.app/)](https://ranuan.netlify.app/) 

## 项目简介

冉暖科技官方网站是一个纯静态前端项目，采用原生 HTML5 / CSS3 / JavaScript 构建，零构建工具、零框架依赖，追求极致的加载性能与细腻的交互动效。

网站展示团队旗下的三款核心产品：

| 产品 | 说明 | 页面 |
|------|------|------|
| **冉暖订货系统** | AI 智能订货管理工具，鞋服零售行业专用 | [order.html](order.html) |
| **冉暖音乐播放器** | 跨平台移动音乐播放器，多源聚合 | [music.html](music.html) |
| **冉暖收银系统** | 轻量级 ePOS 收银方案，双系统全链路 | [epos.html](epos.html) |

## 技术栈

- **HTML5** — 语义化标签、无障碍访问（`skip-link`、ARIA）
- **CSS3** — CSS 自定义属性（Design Tokens）、`backdrop-filter` 毛玻璃、Grid/Flexbox 布局、`@keyframes` 动画、圆锥渐变边框
- **Vanilla JavaScript** — `IntersectionObserver` 滚动动画、事件委托、本地存储交互
- **Font Awesome 6** — 图标系统
- **Google Fonts** — Syne / DM Sans / Noto Sans SC 字体组合

> 不使用 React、Vue、Tailwind 等任何前端框架或构建工具，所有代码手写可控。

## 项目结构

```
.
├── index.html              # 首页（产品展示 + 关于 + 联系）
├── order.html              # 冉暖订货系统产品页
├── music.html              # 冉暖音乐播放器产品页
├── epos.html               # 冉暖收银系统产品页
├── pricing.html            # 定价方案页
├── tutorials.html          # 使用教程页
├── faq.html                # 常见问题页
├── changelog.html          # 更新日志页
├── roadmap.html            # 功能路线图页
├── privacy.html            # 隐私政策页
├── terms.html              # 使用条款页
├── css/
│   ├── style.css           # 全局样式、导航、页脚、通用组件
│   ├── home.css            # 首页专属样式（Hero、产品卡片、关于区块）
│   └── product.css         # 产品页专属样式（Hero、功能特性、技术架构）
├── js/
│   ├── main.js             # 全局脚本（导航滚动、滚动动画、返回顶部、弹窗）
│   └── home.js             # 首页脚本（3D 卡片倾斜、粒子特效）
├── assets/
│   ├── logo.ico            # 品牌 Logo
│   ├── wechat-qr.jpg       # 微信二维码
│   ├── QQ-qr.png           # QQ 二维码
│   ├── screenshot-*.png    # 产品截图
│   └── epos/               # ePOS 独立截图目录
└── README.md               # 本文件
```

## 核心特性

### 视觉设计

- **品牌色系统** — 以暖色琥珀金 `#D4943A` 为主色，搭配珊瑚红 `#F06B5E`、品牌绿 `#7BAE7F`，形成温暖科技感
- **自定义光标** — 独创「狗爪」形状光标（默认/指针双版本），强化品牌记忆
- **毛玻璃导航栏** — 固定顶部导航，滚动时自动收缩高度并增加阴影
- **3D 卡片倾斜** — 首页产品卡片支持鼠标跟随的透视旋转效果，并附带粒子拖尾
- **呼吸发光边框** — 产品页截图容器采用旋转圆锥渐变边框 + 呼吸 glow 动画

### 交互动效

- **滚动触发显示** — 基于 `IntersectionObserver` 的 `.reveal` 类动画，支持方向（上/左/右/缩放）和延迟级联
- **数字计数器** — 数据指标栏的统计数字在滚动进入视口时从 0 动态递增到目标值
- **模态弹窗** — 微信/QQ 联系弹窗，支持复制到剪贴板
- **移动端汉堡菜单** — 三横线平滑变形为 X 的动画

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

### Netlify / Vercel

直接拖拽项目文件夹到 [Netlify Drop](https://app.netlify.com/drop) 即可一键部署。

## 浏览器兼容性

| 浏览器 | 支持情况 |
|--------|----------|
| Chrome 90+ | ✅ 完全支持 |
| Edge 90+ | ✅ 完全支持 |
| Firefox 88+ | ✅ 完全支持 |
| Safari 15+ | ✅ 完全支持（部分 backdrop-filter 需 `-webkit-` 前缀）|
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
