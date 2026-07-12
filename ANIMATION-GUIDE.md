# 冉暖科技官网 - 炫酷科技动画升级指南

## 升级概述

本次升级在保留原有的温馨宠物风格（暖色配色、狗爪光标、Logo）基础上，添加了现代化的炫酷科技动画效果，让官网更具视觉冲击力和交互体验。

## 新增文件

```
css/scifi-effects.css     # 科技动画样式系统
js/scifi-animations.js    # 动画交互逻辑
```

## 已升级页面

- ✅ `index.html` - 首页（全面升级）
- ✅ `order.html` - 订货系统产品页
- ✅ `music.html` - 音乐播放器产品页
- ✅ `epos.html` - 收银系统产品页
- ✅ `tv.html` - 视频播放器产品页

## 核心动画效果

### 1. 暖色流体背景 (Fluid Background)
- **效果**: 琥珀金、珊瑚红、品牌绿的渐变 blob 在背景中缓慢飘动
- **文件**: `scifi-effects.css` -> `.fluid-bg`, `.fluid-blob`
- **特点**: 不使用 Canvas，纯 CSS 实现，性能优异

### 2. 爪印粒子飘浮 (Paw Particles)
- **效果**: 狗爪形状的粒子从屏幕底部飘向顶部
- **文件**: `scifi-effects.css` -> `.paw-particles`, `scifi-animations.js` -> `initParticleSystem`
- **特点**: 与品牌 Logo 呼应，颜色在琥珀金/珊瑚红/品牌绿之间切换

### 3. 3D卡片倾斜效果 (3D Card Tilt)
- **效果**: 鼠标移动时卡片跟随倾斜，带有光泽反射
- **类名**: `card-3d-enhanced`, `card-3d-inner`
- **应用**: 产品卡片、功能卡片
- **特点**: 使用 CSS transform 和 perspective，流畅自然

### 4. 光标追踪光效 (Glow Tracking)
- **效果**: 鼠标在产品卡片上移动时，光晕跟随光标位置
- **类名**: `card-glow-track`
- **应用**: 首页 4 个 Hero 卡片、产品展示卡片

### 5. 霓虹发光边框 (Neon Border)
- **效果**: 暖色渐变边框环绕旋转
- **类名**: `glow-border-warm`
- **应用**: 产品卡片、特色功能卡片
- **特点**: 使用 CSS @property 实现平滑旋转动画

### 6. 磁吸按钮效果 (Magnetic Buttons)
- **效果**: 鼠标靠近按钮时产生轻微吸引效果
- **类名**: `btn-magnetic`, `btn-ripple`
- **应用**: 首页 "了解产品" 按钮、CTA 按钮
- **特点**: 带有涟漪点击效果

### 7. 滚动触发动画 (Scroll Reveal)
- **效果**: 元素进入视口时触发各种动画
- **类名**:
  - `reveal` - 淡入上滑
  - `reveal-left` - 左侧滑入
  - `reveal-right` - 右侧滑入
  - `reveal-scale` - 缩放淡入
  - `reveal-delay-1/2/3/4/5` - 错开延迟
- **应用**: 全页面各区块

### 8. 数字计数动画 (Counter Animation)
- **效果**: 统计数字从 0 动态递增到目标值
- **类名**: `counter`
- **应用**: 首页统计栏、产品页效率指标
- **属性**: `data-target="80" data-suffix="%+"`

### 9. 呼吸发光效果 (Breathing Glow)
- **效果**: 柔和的呼吸节奏光晕
- **类名**: `breathing-glow`
- **应用**: 统计数据卡片、特色展示区块

### 10. 图片光扫效果 (Image Shine)
- **效果**: 鼠标悬停图片时，一道光芒从左向右扫过
- **类名**: `img-shine`
- **应用**: 产品截图、展示图片

### 11. 玻璃态效果升级 (Glassmorphism)
- **效果**: 半透明模糊背景，带有暖色边框
- **类名**: `glass-warm`, `glass-warm-dark`
- **应用**: 导航栏、卡片、表单区域

## CSS 变量系统

在 `scifi-effects.css` 中定义了完整的 CSS 变量：

```css
/* 色彩系统 - 保留原有暖色调 */
--primary: #D4943A;        /* 琥珀金 */
--secondary: #F06B5E;      /* 珊瑚红 */
--accent: #7BAE7F;         /* 品牌绿 */

/* 发光效果 */
--glow-warm: rgba(212, 148, 58, 0.5);
--glow-coral: rgba(240, 107, 94, 0.5);
--glow-green: rgba(123, 174, 127, 0.5);

/* 动画时间 */
--transition-fast: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
--transition-base: 0.4s cubic-bezier(0.4, 0, 0.2, 1);
--transition-slow: 0.6s cubic-bezier(0.4, 0, 0.2, 1);
--transition-bounce: 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

## 如何使用

### 为元素添加 3D 卡片效果

```html
<div class="card-3d-enhanced card-glow-track">
  <div class="card-3d-inner">
    <!-- 卡片内容 -->
  </div>
</div>
```

### 添加滚动显示动画

```html
<div class="reveal reveal-left reveal-delay-2">
  <!-- 延迟 0.2s 后从左侧滑入 -->
</div>
```

### 添加霓虹发光边框

```html
<div class="glow-border-warm">
  <!-- 内容 -->
</div>
```

### 添加数字计数器

```html
<div class="stat-number counter" data-target="80" data-suffix="%+">0</div>
```

### 添加磁吸按钮

```html
<button class="btn btn-primary btn-magnetic btn-ripple">
  点击我
</button>
```

## JavaScript API

`scifi-animations.js` 提供了以下全局方法：

```javascript
// 刷新粒子系统
ScifiAnimations.refreshParticles();

// 刷新 3D 卡片
ScifiAnimations.refresh3DCards();

// 刷新磁吸按钮
ScifiAnimations.refreshMagnetic();

// 手动触发动画
ScifiAnimations.triggerReveal('.my-element');
```

## 性能优化

1. **使用 CSS transforms**: 避免触发重排，使用 GPU 加速
2. **Intersection Observer**: 仅在元素进入视口时触发动画
3. **requestAnimationFrame**: 计数器动画使用 RAF 确保流畅
4. **will-change 属性**: 提前告知浏览器哪些属性会变化
5. **减少运动偏好**: 支持 `prefers-reduced-motion` 媒体查询

## 浏览器兼容性

- Chrome 90+
- Edge 90+
- Firefox 88+
- Safari 15+ (部分 backdrop-filter 需要 -webkit- 前缀)
- IE 11 不支持

## 保留的品牌元素

✅ 暖色配色系统 (琥珀金 #D4943A、珊瑚红 #F06B5E、品牌绿 #7BAE7F)
✅ 狗爪形状光标（默认和指针版本）
✅ Logo 和图标系统
✅ 原有的温馨风格基础样式

---

*冉暖科技 - 用技术创造温暖*
