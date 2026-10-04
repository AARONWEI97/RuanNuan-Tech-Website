# 冉暖科技官网 — 动效与特效层说明

> 本文档描述**当前生效**的动效系统。
> 旧文档提到的 `css/scifi-effects.css`、`js/scifi-animations.js`、`css/enhanced-effects.css`、`js/enhanced-effects.js` **已全部废弃**，其有效视觉已合并进 `css/effects.css` + `js/effects.js`。见文末「已废弃」一节。

---

## 1. 分层结构

| 层 | 文件 | 职责 |
|----|------|------|
| 设计令牌与通用组件 | `css/style.css` | 颜色/间距/圆角/缓动变量、按钮、导航、页脚、弹窗、显露基类、错误页 |
| 首页专属 | `css/home.css` | Hero、3D 产品卡、产品跑马灯、关于、联系 |
| 产品页专属 | `css/product.css` | 四款产品页（含从 `music.html` 抽出的内联样式） |
| 内容页 | `css/pages.css` | 教程 / FAQ / 更新日志 / 路线图 |
| 价格与条款页 | `css/legal.css` | pricing / privacy / terms |
| **特效层** | `css/effects.css` + `js/effects.js` | 全站动效，`fx-` 命名空间 |
| 核心运行时 | `js/main.js` | 导航、移动菜单、显露、计数器、弹窗、复制、表单、焦点管理 |
| 首页脚本 | `js/home.js` | Hero 星座粒子、`.product-card-3d` 3D 倾斜 |
| 内容页脚本 | `js/pages.js` | 更新日志筛选（仅 `changelog.html` 引入） |
| 产品页脚本 | `js/product.js` | 网盘密码解锁（仅 `tv.html` / `music.html` 引入） |

**加载顺序固定**：`style.css` → 页面专属 CSS → `effects.css`；
脚本 `main.js` → `effects.js` →（首页）`home.js`。

---

## 2. 用 `data-*` 属性接线（HTML 作者只需记这些）

| 属性 | 作用于 | 效果 |
|------|--------|------|
| `data-page="home\|order\|music\|epos\|tv\|pricing\|tutorials\|faq\|changelog\|roadmap\|privacy\|terms"` | `<body>` | 决定导航哪一项高亮 |
| `data-nav="order"` | 导航 `<a>` | 与 `data-page` 匹配即加 `.active` + `aria-current="page"` |
| `data-menu-toggle` | 汉堡按钮 / 关闭按钮 | 开关移动菜单（同步 `aria-expanded`，支持 `Esc`） |
| `data-modal-open="wechat\|qq"` | 任意元素 | 打开对应弹窗 |
| `data-modal-close` | 弹窗关闭按钮 | 关闭所在弹窗 |
| `data-copy="#元素选择器"` | 复制按钮 | 复制目标元素文本 |
| `data-counter="80"` + `data-counter-suffix="%+"` | 计数元素 | 进入视口后从 0 递增至目标值 |
| `data-tilt="6"` | 卡片 | 鼠标跟随 3D 倾斜（最大 6°） |
| `data-speed="0.15"` | 任意元素 | 滚动视差速率 |
| `data-lazy-bg="assets/x.png"` | 任意元素 | 进入视口才设置 `background-image` |
| `data-no-tilt` | 容器 | 阻止其内部元素参与倾斜 |

> **计数器**：HTML 中写**最终值**（如 `<div data-counter="80" data-counter-suffix="%+">80%+</div>`），
> JS 在初始化时归零再递增。这样无 JS / 爬虫场景下数值依然正确。
>
> **互斥**：`data-tilt` 与 `data-speed` 都会写 `transform`，引擎会让倾斜优先。
> 首页 `.product-card-3d` 的 `transform` 由 `js/home.js` **独占**，`effects.js` 会主动跳过。

---

## 3. 可直接使用的装饰类

| 类名 | 效果 | 需要 JS |
|------|------|---------|
| `fx-sweep` | hover / 键盘聚焦时一道暖光斜扫过容器 | 否 |
| `fx-float` / `fx-float-slow` / `fx-float-delay` | 缓慢上下浮动 | 否 |
| `fx-pulse-ring` | 图标 / 徽章脉冲光环 | 否 |
| `fx-corners` | hover 时四角描线展开 | 否 |
| `fx-glowline` | 底部暖色流光往返 | 否 |
| `fx-glass-dark` | 深色毛玻璃面板 | 否 |
| `fx-blueprint` / `fx-scanbeam` | 工程图网格 / 扫描光带（科技感装饰） | 否 |
| `fx-stagger` | 子元素依次入场（容器级） | 是 |
| `fx-magnetic` | 磁吸按钮（内容向光标轻微位移） | 是 |
| `fx-ripple` | 点击涟漪扩散 | 是 |

**自动注入、HTML 无需书写**：`.fx-scroll-progress`（顶部滚动进度条）、`.fx-cursor-glow`（鼠标光晕）、`#fx-trail-canvas`（粒子拖尾）、`.fx-fluid-bg` + `.fx-fluid-blob`（页面流体背景）、`.fx-paw-particles`（爪印粒子）、`.fx-hero-canvas`（产品页 Hero 粒子）。

---

## 4. 首页科幻动效层（`css/home.css` + `js/home.js` 专属）

首页在共享动效层之上叠加了一套「科幻感」动效，**只加动效、不改品牌基调**（暖琥珀 / 珊瑚红 / 品牌绿与浅色底全部保持）。
命名一律 `home-` 前缀，与 `effects.css` 的同名关键帧互不干扰。

| 类名 | 效果 | 实现要点 |
|------|------|----------|
| `.home-pipeline` | **数据总线**：Hero 四张产品卡左侧的 SVG 覆盖层，虚线竖轨 + 4 条渐变支线 + 端口结点 + 5 个流动数据包 | `viewBox="0 0 100 100"` + `preserveAspectRatio="none"`，数据包位移用 CSS 关键帧写 `translate()`（SVG 用户单位）；`pointer-events:none` |
| `.home-terminal` | **终端面板**：循环「逐字打出 → 停留 → 逐字删除 → 下一句」+ 闪烁光标 | rAF 状态机；文案取自页面既有词句；固定两行高防 CLS；`aria-hidden="true"` |
| `.home-hud` | **HUD 边框**：四角 L 型括号 + 扫描光带扫过 | 纯 CSS，`scale`/`opacity`/`translateY` 百分比位移；容器 `overflow:hidden` 裁切 |
| `[data-fx-decode]` | **解码文字**：进入视口时字符乱码 → 逐字解析为原文 | `IntersectionObserver` 触发；**结束后 `textContent = 原文` 精确还原**；含子元素的宿主一律跳过 |
| `.home-reticle` | **科幻准星**：外环 / 十字 / 光点三级 lerp 延迟跟随 + 内圈自转 | 仅桌面 Hero 启用；收敛后停帧；`pointer-events:none`，不影响任何交互 |
| `.home-beam` | **流光能量束**：区块分隔处随滚动进度推进的光束 | 零高度容器（不产生布局位移）；`scaleX` + 束头 `translate3d`；仅附近 240px 内计算 |

**降级行为**

- `prefers-reduced-motion: reduce`：数据包与脉冲环隐藏（保留静态蓝图轨道）、HUD 扫描带隐藏、终端直接显示静止首句、准星 `display:none`、能量束静态呈现、解码不启动（直接显示原文）。
- `pointer: coarse` 或 `<992px`：准星、数据总线、HUD 全部关闭（单列 Hero 无参考系）；终端打字保留。
- `document.hidden`：终端打字与解码冻结进度，切回不跳帧。

> ⚠️ **不要**给 `.section-title` 加 `data-fx-decode` 之外再叠加字符拆分 —— `effects.js` 的 `initTitleChars` 会因该元素含子节点而跳过，首页用 `.home-title-armed` / `.home-title-in` 提供等价的下划线动画，无需额外处理。

---

## 5. 显露动画（滚动触发）

由 `js/main.js` 统一处理，激活类为 **`.visible`**：

```html
<div class="reveal reveal-left delay-2">…</div>
```

- 方向：`reveal`（上滑）/ `reveal-left` / `reveal-right` / `reveal-scale`
- 级联：`delay-1` … `delay-5`
- 基于 `IntersectionObserver`；**无 JS 时元素保持可见**（不会白屏）

> ⚠️ 不要把 `.reveal` 挂在自身已用 `transform` 做 hover 的元素上（例如 `.price-card`）——
> 两者同特异性会互相覆盖。应挂在**父容器**上。

---

## 6. 性能约定

- Canvas 与 `requestAnimationFrame` 循环在 `document.hidden` 时暂停，恢复时继续。
- Hero 粒子数按设备分级：桌面 ≤60 / `pointer: coarse` ≤24。
- 滚动、`mousemove`、`resize` 全部 `{ passive: true }` + `requestAnimationFrame` 节流。
- 动画只驱动 `transform` / `opacity`；`will-change` 仅在 hover 或动画期间临时声明。
- 触屏设备自动关闭鼠标光晕、粒子拖尾、磁吸、3D 倾斜。
- 所有 `@keyframes` 均在 `prefers-reduced-motion: reduce` 下有对应关闭规则。

---

## 7. 无障碍

- 弹窗：`role="dialog"` + `aria-modal="true"` + `aria-labelledby`，含焦点陷阱、`Esc` 关闭、遮罩点击关闭、关闭后焦点归还触发元素。
- 移动菜单：`aria-expanded` + `aria-controls` 同步，`Esc` 可关；用 CSS `visibility` 保证关闭时不进入 Tab 序列。
- 全站 `:focus-visible` 焦点环。
- 图标一律 `aria-hidden="true"`，语义由文字承载。

---

## 8. 已废弃（**不要在 HTML 中再使用**）

以下类名已随旧特效层一并移除，任何页面都不应再出现：

```
card-glow-track    glow-border-warm   btn-magnetic      btn-ripple
card-3d-enhanced   card-3d-inner      card-shine
reveal-delay-1..5  counter / data-target / data-suffix
fluid-blob（裸用；现为 .fx-fluid-blob 且限定在 .fx-fluid-bg 内）
```

替代方案见第 2、3 节。特别注意：

- `counter` + `data-target` + `data-suffix` → 改为 `data-counter` + `data-counter-suffix`
- `reveal-delay-N` → 改为 `delay-N`
- `card-3d-enhanced` + `card-3d-inner` → 改为 `data-tilt="6"`（首页 `.product-card-3d` 例外，由 `home.js` 独占）

同时，**以下四个文件已无任何页面引用，属于死代码，应从仓库删除**：

```
css/scifi-effects.css
css/enhanced-effects.css
js/scifi-animations.js
js/enhanced-effects.js
```

> 本仓库当前仍残留这些文件（受环境限制无法在本次会话中删除），请手动执行：
>
> ```bash
> git rm css/scifi-effects.css css/enhanced-effects.css js/scifi-animations.js js/enhanced-effects.js
> ```

---

## 9. 浏览器支持

Chrome 90+ / Edge 90+ / Firefox 88+ / Safari 15+ 完全支持；不支持 IE 11。

`@property` 注册自定义属性（圆锥渐变描边动画）在旧版 Firefox 上会优雅降级为静态边框。

---

## 10. 保留的品牌元素

✅ 暖色配色系统（琥珀金 `#D4943A`、珊瑚红 `#F06B5E`、品牌绿 `#7BAE7F`）
✅ 狗爪形状光标（默认与指针版本，触屏及输入控件自动回退系统光标）
✅ Logo 与图标系统
✅ 温馨宠物风格基础样式

---

*冉暖科技 — 用技术创造温暖*
