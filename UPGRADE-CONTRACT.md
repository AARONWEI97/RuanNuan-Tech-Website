# 冉暖科技官网 — 开发契约（v2，Astro 版）

> 本文件是官网改动的单一规范来源，取代 2025-10 的「冻结版 v1」（零构建、禁第三方库、相对路径）。
> v1 的规定已全部作废；旧代码可在 git 历史里找到。

## 1. 技术栈

| 项 | 选型 | 说明 |
|----|------|------|
| 框架 | Astro 6（`output: static`） | 构建期渲染，产物是纯静态 HTML/CSS/JS |
| 语言 | TypeScript strict | `npm run build` 先跑 `astro check`，有类型错误就构建失败 |
| 动效 | GSAP 3（含 ScrollTrigger）+ Lenis | Lenis 平滑滚动与 ScrollTrigger 在 `scripts/lib/scroll.ts` 里同步 |
| 背景 | 手写 WebGL（`scripts/lib/heatfield.ts`） | 不引入 Three.js |
| 字体 | `@fontsource-variable` 的 Syne / DM Sans / JetBrains Mono | 自托管，不走 Google Fonts |
| 图标 | `@iconify-json/fa6-solid`、`fa6-brands` | `Icon.astro` 在构建期内联 SVG，运行时零请求；没装 `fa6-regular` |
| 运行环境 | Node ≥ 22.12 | 本地与 Netlify 一致 |

不用 React / Vue / Tailwind。新增依赖前先确认能否用现有手段解决。

## 2. 目录

```
src/
├── pages/          # 一个 .astro 对应一个页面，文件名即网址（order.astro → /order.html）
├── layouts/        # BaseLayout（所有页）、ProductLayout（产品页）、ContentLayout（内容/条款页）
├── components/     # 全站组件：Nav、Footer、Modals、Pet、Seo、Icon、SectionHead、LegalDoc
│   ├── home/       # 首页区块
│   └── product/    # 产品页区块：PHero、SubNav、PSection、FeatureGrid、Gallery、Downloads …
├── data/           # 数据源：products / changelog / faq / site
├── lib/url.ts      # 站内路径辅助函数
├── scripts/
│   ├── site.ts     # 全站运行时入口（BaseLayout 引入）
│   ├── home.ts、product.ts、pages/*.ts   # 页面级脚本
│   ├── modules/    # nav、modals、reveal、pointer、forms、pet、anchors
│   └── lib/        # scroll（Lenis+GSAP）、heatfield（WebGL）、env
└── styles/
    ├── tokens.css  # 设计令牌
    ├── base.css、ui.css、motion.css
    └── components/、home/、product/、pages/
public/             # 原样拷贝：assets/、robots.txt、sitemap.xml、site.webmanifest
```

## 3. 网址与路径

- `astro.config.mjs` 设 `build.format: 'file'`，产物是 `order.html` 这种扁平文件，旧网址和外链不失效。
- 站内链接、图片一律写 `url('order.html')`（`src/lib/url.ts`）。它会拼上 `BASE_URL`，并把 `index.html` 规范成站点根 `/`。外链、`mailto:`、纯锚点原样返回。
- 不要手写 `../` 相对路径。404 页会在任意深度被返回，用 `url()` 生成的根绝对路径才不会断。
- 删除或改名页面时，在 `netlify.toml` 加 301 跳转（参考 `/epos_dump.html` → `/epos.html`），并同步 `public/sitemap.xml`。

## 4. 布局与页面

| 布局 | 用于 | 关键 Props |
|------|------|-----------|
| `BaseLayout` | 所有页面 | `title`、`description`、`path`、`page`、`keywords?`、`jsonLd?`、`footerCta?`（默认 true）、`noindex?` |
| `ProductLayout` | order / music / epos / tv | `product`、`category`、`os`、`ldDescription`；自动生成 SoftwareApplication JSON-LD，版本号取自 `products.ts` |
| `ContentLayout` | tutorials / faq / changelog / roadmap / pricing / privacy / terms | `eyebrow`、`badge`、`heading`、`highlight?`、`desc`、`graph?`（额外 JSON-LD 节点）；`slot="hero"` 放进头图区 |

- 每页只有一个 `<h1>`。`path` 写产物文件名（`faq.html`），用来生成 canonical 和导航高亮。
- 404 用 `noindex`：输出 `robots noindex`，不输出 canonical。
- 产品页区块用 `components/product/*` 组合，不要在页面里复制一份区块标记。

## 5. 数据源（只在这里改）

| 文件 | 内容 | 影响到 |
|------|------|--------|
| `data/products.ts` | 产品名、版本号、多端版本、状态、截图、技术栈 | 首页产品区、导航大菜单、产品页 Hero、JSON-LD、404 入口 |
| `data/changelog.ts` | 更新条目（`highlights` 是首页摘要） | 更新日志页、首页「最近更新」（取最新 3 条） |
| `data/faq.ts` | 分组问答，分组 id 即锚点（`#order` `#music` `#epos` `#purchase`） | FAQ 页、FAQPage JSON-LD |
| `data/site.ts` | 品牌名、联系方式、表单地址、导航与页脚链接 | 全站 |

发新版本的流程：改 `products.ts` 里的版本号 → 在 `changelog.ts` 加一条 → 构建。不要在页面里硬编码版本号。

中文文案里的事实（版本、功能、价格）以现有数据为准，不要凭空新增功能描述。

## 6. 主题与设计令牌

- 品牌不变量：琥珀金 `--amber #D4943A`、珊瑚 `--coral #F06B5E`、鼠尾草绿 `--sage #7BAE7F`、爪印元素、狗爪光标（`public/assets/cursor/`）、标题字体 Syne。
- 区块用 `data-theme="light|dark"` 深浅交替，不做全站深色。语义变量 `--bg` `--fg` `--fg-2` `--fg-3` `--line` `--surface` `--chip-bg` `--brand-text` 随主题切换。组件只用语义变量，不写死颜色。
- 导航根据当前所在区块的 `data-theme` 自动切换明暗（`data-tone`）。
- 产品色：产品页用 `--accent`，内容页用 `[data-product=order|music|epos|tv|general]` 提供的 `--pc`。
- 字号、间距、圆角、缓动都从 `tokens.css` 取（`--fs-*` `--radius-*` `--ease-*` `--section-y` `--gutter`）。

## 7. 交互钩子（`data-*` 契约）

JS 只认下面这些属性。改名要同时改脚本。

**全站（`scripts/site.ts`）**

| 属性 | 效果 |
|------|------|
| `data-reveal="up\|left\|right\|scale\|mask"` | 进入视口时显露；`style="--rd:0.2s"` 设延迟；`mask` 需要 `.mask > span` 结构 |
| `data-stagger` | 子元素依次显露 |
| `data-scramble` | 文字乱码解码效果 |
| `data-counter="90"` + `data-counter-suffix="%"` | 数字从 0 递增 |
| `data-spotlight` | 跟随鼠标的光斑（写入 `--mx` / `--my`） |
| `data-magnetic` | 按钮磁吸 |
| `data-modal-open="wechat\|qq"` / `data-modal-close` | 打开 / 关闭联系弹窗（原生 `<dialog>`） |
| `data-copy="#selector"` | 复制目标文本，并通过 `aria-live` 播报 |
| `data-lenis-prevent` | 该区域内滚动不交给 Lenis（弹窗、可滚动列表） |

动效只在 `html.js` 下启用。没有 JS 时内容必须完整可见。

**产品页（`scripts/product.ts`）**：`data-psub` / `data-psub-link`（页内目录）、`data-gallery` + `data-lightbox`（截图分组与灯箱）、`data-unlock-*`（网盘密码解锁，见 §8）。

**内容页（`scripts/pages/*.ts`）**：`data-faq-query` / `data-faq-group` / `data-faq-item`（FAQ 搜索）、`data-log-filter` / `data-log-entry` / `data-log-year`（更新日志筛选，同步 `?p=`）、`data-pr-calc`（价格计算器）、`data-toc-link`（条款页目录高亮）。

## 8. 下载与解锁

`Downloads.astro` 渲染下载卡。规则：

- 默认锁定。点击仓库链接后在 sessionStorage 记下时间（键名由 `storage` 指定），回到本页或切回标签页时，若仍在 `expireMin` 分钟有效期内就解锁；超时记录作废。
- 刷新页面会清掉记录，重新锁定。
- 密码放在 `<details open>` 里，没有 JS 或 sessionStorage 不可用时直接可见。
- 网盘密码、仓库地址只在对应产品页的 `downloads` 数组里维护。

## 9. 无障碍

- 每页 `skip-link` → `main#main`；装饰性图标 `aria-hidden`；图片有 `alt` 和宽高。
- 弹窗用原生 `<dialog>`：`Esc` 关闭、焦点归还。
- 标签页（截图分组）按 WAI-ARIA tabs 实现，支持方向键 / Home / End。
- 所有动效在 `prefers-reduced-motion: reduce` 下降级为直接显示。
- 可点的东西用 `<a>` 或 `<button>`，不要给 `div` 绑点击。

## 10. 性能

- 首屏以下图片 `loading="lazy" decoding="async"`，并写明 `width` / `height`。
- 页面级脚本只在对应页面引入；WebGL 在不可见或标签页隐藏时暂停。
- 构建产物 `/_astro/*` 带哈希，`netlify.toml` 已配一年强缓存。`public/` 里的文件不带哈希，替换图片时最好换个文件名。

## 11. 构建与部署

```bash
npm install        # 首次或依赖变更后
npm run dev        # 本地开发，http://localhost:4321
npm run build      # astro check + astro build → dist/
npm run preview    # 预览 dist/
```

- 部署在 Netlify。推送到 GitHub 后 Netlify 按 `netlify.toml` 执行 `npm run build`，发布 `dist/`，Node 22。
- `dist/`、`node_modules/`、`.astro/` 不进仓库（见 `.gitignore`）。

## 12. 完成定义

一次改动完成的标准：

1. `npm run build` 0 错误。
2. 改动涉及的页面在桌面和手机宽度下都看过，控制台无报错。
3. 新增或改名的页面已同步 `sitemap.xml`、`netlify.toml`（跳转）和导航 / 页脚链接。
4. 版本号、文案改动走 `src/data/`，没有散落在页面里。
