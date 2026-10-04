/* ============================
   冉暖科技 — Homepage Animations
   Hero 星座粒子 Canvas + 鼠标光晕 + 3D 卡片倾斜 + 标题字符拆分
   仅首页加载；ES5 写法（var + function）+ IIFE + 'use strict'
   约定：
   - `.product-card-3d` 的 transform 由本文件独占写入（其他层不得写入）
   - 数字计数器由 js/main.js 统一处理（data-counter / data-counter-suffix），
     本文件不再包含计数器实现（B5/B6）
   - 标题拆分只包裹纯文本节点，含元素子节点（如 .highlight）不拆分，
     以保留主标题的渐变文字（B4）
   ============================ */
(function () {
  'use strict';

  /* 重复加载守卫（契约 §3：脚本必须容忍被重复引入） */
  if (window.__RANUAN_HOME_INIT__) return;
  window.__RANUAN_HOME_INIT__ = true;

  function prefersReducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function isCoarsePointer() {
    return !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
  }

  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  onReady(function () {
    initConstellationParticles();
    initMouseGlow();
    init3DCards();
    initTitleChars();
  });

  /* --- Constellation Network + Paw Particles (Canvas) --- */
  function initConstellationParticles() {
    var canvas = document.querySelector('.hero-particles');
    if (!canvas || !canvas.getContext) return;

    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    // 降低动效偏好：首屏 canvas 装饰动画整体不启动
    if (prefersReducedMotion()) return;

    var coarse = isCoarsePointer();
    var nodes = [];
    var paws = [];
    var travelers = [];   // 沿连线流动的脉冲光点
    /* 性能硬性要求（契约 §9.4）：桌面 ≤60、pointer: coarse ≤24 */
    var maxNodes = coarse ? 24 : 60;
    var maxPaws = 8;
    var maxTravelers = 6;
    var connectDist = 165;
    var time = 0;

    var running = false;      // 动画循环是否在跑
    var inViewport = true;    // canvas 是否在视口内
    var pageVisible = !document.hidden;

    // 鼠标引力场
    var mouse = { x: -9999, y: -9999 };
    var hero = canvas.parentElement;

    function resize() {
      var host = canvas.parentElement || hero;
      if (!host) return;
      var w = host.offsetWidth;
      var h = host.offsetHeight;
      if (w > 0 && h > 0) {
        canvas.width = w;
        canvas.height = h;
      }
    }
    resize();

    // resize 用 rAF 节流（契约 §9.5）
    var resizeQueued = false;
    window.addEventListener('resize', function () {
      if (resizeQueued) return;
      resizeQueued = true;
      requestAnimationFrame(function () {
        resizeQueued = false;
        resize();
      });
    }, { passive: true });

    if (hero && !coarse) {
      hero.addEventListener('mousemove', function (e) {
        var rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
      }, { passive: true });
      hero.addEventListener('mouseleave', function () {
        mouse.x = -9999; mouse.y = -9999;
      }, { passive: true });
    }

    // Spawn constellation nodes
    function spawnNode() {
      if (nodes.length >= maxNodes) return;
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: 1.2 + Math.random() * 1.5,
        opacity: 0.2 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2   // 呼吸相位
      });
    }

    // 脉冲光点：在两个已连接的节点间流动
    function spawnTraveler(a, b) {
      if (travelers.length >= maxTravelers) return;
      var hue = Math.random() < 0.6 ? '212,148,58' : '240,107,94';
      travelers.push({ a: a, b: b, t: 0, speed: 0.008 + Math.random() * 0.012, hue: hue });
    }

    // Draw a paw shape
    function drawPaw(x, y, size, opacity, rotation) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.globalAlpha = opacity;

      // Glow
      ctx.shadowColor = 'rgba(212,148,58,0.4)';
      ctx.shadowBlur = size * 0.8;
      ctx.fillStyle = 'rgba(212,148,58,0.5)';

      var r = size * 0.4;
      ctx.beginPath();
      ctx.ellipse(0, r * 0.3, r, r * 0.85, 0, 0, Math.PI * 2);
      ctx.fill();

      var toeR = size * 0.18;
      var toeY = -r * 0.5;
      var positions = [
        { x: -r * 0.7, y: toeY },
        { x: -r * 0.25, y: toeY - r * 0.4 },
        { x: r * 0.25, y: toeY - r * 0.4 },
        { x: r * 0.7, y: toeY }
      ];
      for (var i = 0; i < positions.length; i++) {
        ctx.beginPath();
        ctx.arc(positions[i].x, positions[i].y, toeR, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.shadowBlur = 0;
      ctx.restore();
    }

    function spawnPaw() {
      if (paws.length >= maxPaws) return;
      paws.push({
        x: Math.random() * canvas.width,
        y: canvas.height + 20,
        size: 14 + Math.random() * 18,
        speed: 0.25 + Math.random() * 0.5,
        drift: (Math.random() - 0.5) * 0.3,
        rotation: (Math.random() - 0.5) * 0.8,
        opacity: 0,
        maxOpacity: 0.12 + Math.random() * 0.15,
        phase: 'in'
      });
    }

    function drawFrame() {
      time += 0.016;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Spawn
      if (Math.random() < 0.08 && nodes.length < maxNodes) spawnNode();
      if (Math.random() < 0.02) spawnPaw();

      // Update & draw nodes
      for (var n = 0; n < nodes.length; n++) {
        var node = nodes[n];
        // 鼠标引力：靠近的节点被温柔吸引，星座网产生呼吸般的聚拢
        var dxm = mouse.x - node.x, dym = mouse.y - node.y;
        var dm = Math.sqrt(dxm * dxm + dym * dym);
        if (dm < 220 && dm > 0.1) {
          var f = (1 - dm / 220) * 0.014;
          node.vx += (dxm / dm) * f;
          node.vy += (dym / dm) * f;
        }
        // 阻尼 + 最低漂移速度，防止粒子静止
        node.vx *= 0.985;
        node.vy *= 0.985;
        if (Math.abs(node.vx) < 0.04) node.vx += (Math.random() - 0.5) * 0.02;
        if (Math.abs(node.vy) < 0.04) node.vy += (Math.random() - 0.5) * 0.02;

        node.x += node.vx;
        node.y += node.vy;
        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

        // 呼吸脉动
        var pulse = 0.7 + Math.sin(time * 1.8 + node.phase) * 0.3;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r * (0.8 + pulse * 0.4), 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(212,148,58,' + (node.opacity * pulse) + ')';
        ctx.fill();
      }

      // Draw connections（琥珀主线 + 偶发珊瑚色连线）
      for (var i = 0; i < nodes.length; i++) {
        for (var j = i + 1; j < nodes.length; j++) {
          var dx = nodes[i].x - nodes[j].x;
          var dy = nodes[i].y - nodes[j].y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connectDist) {
            var alpha = (1 - dist / connectDist) * 0.13;
            var coral = ((i * 31 + j * 17) % 7) === 0;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = coral
              ? 'rgba(240,107,94,' + (alpha * 0.9) + ')'
              : 'rgba(212,148,58,' + alpha + ')';
            ctx.lineWidth = 0.6;
            ctx.stroke();

            // 低概率在该连线上生成流动光点
            if (Math.random() < 0.0012) {
              spawnTraveler(nodes[i], nodes[j]);
            }
          }
        }
      }

      // 脉冲光点沿连线流动（发光小球）
      for (var k = travelers.length - 1; k >= 0; k--) {
        var tr = travelers[k];
        tr.t += tr.speed;
        if (tr.t >= 1) { travelers.splice(k, 1); continue; }
        var tx = tr.a.x + (tr.b.x - tr.a.x) * tr.t;
        var ty = tr.a.y + (tr.b.y - tr.a.y) * tr.t;
        var glow = Math.sin(tr.t * Math.PI); // 两端淡入淡出
        ctx.beginPath();
        ctx.arc(tx, ty, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + tr.hue + ',' + (0.55 * glow) + ')';
        ctx.shadowColor = 'rgba(' + tr.hue + ',0.8)';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Update & draw paws
      for (var p = 0; p < paws.length; p++) {
        var paw = paws[p];
        paw.y -= paw.speed;
        paw.x += paw.drift;
        paw.rotation += 0.002;

        if (paw.phase === 'in') {
          paw.opacity += 0.006;
          if (paw.opacity >= paw.maxOpacity) paw.phase = 'hold';
        } else if (paw.y < canvas.height * 0.15) {
          paw.phase = 'out';
          paw.opacity -= 0.004;
        }

        if (paw.opacity > 0) drawPaw(paw.x, paw.y, paw.size, paw.opacity, paw.rotation);
      }

      paws = paws.filter(function (paw) { return paw.opacity > 0 && paw.y > -50; });
    }

    function shouldRun() {
      return inViewport && pageVisible && !document.hidden;
    }

    function loop() {
      if (!shouldRun()) { running = false; return; }
      drawFrame();
      requestAnimationFrame(loop);
    }

    function start() {
      if (running || !shouldRun()) return;
      running = true;
      requestAnimationFrame(loop);
    }

    // 元素离屏时暂停（契约 §9.4）
    if (typeof IntersectionObserver === 'function') {
      var canvasObserver = new IntersectionObserver(function (entries) {
        inViewport = !!(entries[0] && entries[0].isIntersecting);
        if (inViewport) start();
      }, { threshold: 0 });
      canvasObserver.observe(canvas);
    }

    // 页面隐藏时暂停（契约 §9.4）
    document.addEventListener('visibilitychange', function () {
      pageVisible = !document.hidden;
      if (pageVisible) start();
    });

    // Initial nodes（直接铺满 70%，剩余由动画逐渐生成）
    var initialCount = Math.floor(maxNodes * 0.7);
    for (var n0 = 0; n0 < initialCount; n0++) spawnNode();
    // Initial paws
    for (var p0 = 0; p0 < 3; p0++) {
      paws.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 14 + Math.random() * 18,
        speed: 0.25 + Math.random() * 0.5,
        drift: (Math.random() - 0.5) * 0.3,
        rotation: (Math.random() - 0.5) * 0.8,
        opacity: 0.08 + Math.random() * 0.1,
        maxOpacity: 0.18,
        phase: 'hold'
      });
    }

    start();
  }

  /* --- Mouse Follow Glow（只用 transform 位移，rAF 节流） --- */
  function initMouseGlow() {
    var glow = document.querySelector('.hero-mouse-glow');
    var hero = document.querySelector('.hero');
    if (!glow || !hero) return;
    if (isCoarsePointer() || prefersReducedMotion()) return;

    var rect = null;
    var pendingX = 0;
    var pendingY = 0;
    var queued = false;

    function flush() {
      queued = false;
      glow.style.transform = 'translate(' + pendingX + 'px,' + pendingY + 'px) translate(-50%, -50%)';
    }

    hero.addEventListener('mousemove', function (e) {
      if (!rect) rect = hero.getBoundingClientRect();
      pendingX = e.clientX - rect.left;
      pendingY = e.clientY - rect.top;
      if (queued) return;
      queued = true;
      requestAnimationFrame(flush);
    }, { passive: true });

    // 滚动/尺寸变化后重新测量
    function invalidate() { rect = null; }
    window.addEventListener('scroll', invalidate, { passive: true });
    window.addEventListener('resize', invalidate, { passive: true });
    hero.addEventListener('mouseleave', invalidate, { passive: true });
  }

  /* --- 3D Tilt Cards（.product-card-3d 的 transform 唯一写入者） --- */
  function init3DCards() {
    var cards = document.querySelectorAll('.product-card-3d');
    if (!cards.length) return;
    if (isCoarsePointer() || prefersReducedMotion()) return;

    for (var i = 0; i < cards.length; i++) {
      bindTiltCard(cards[i]);
    }
  }

  function bindTiltCard(card) {
    var maxDeg = 8;   // 最大倾斜角（度），Hero 卡片由本文件独占
    var lastSpawn = 0;

    card.addEventListener('mousemove', function (e) {
      var rect = card.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      var centerX = rect.width / 2;
      var centerY = rect.height / 2;
      var rotateX = ((y - centerY) / centerY) * -maxDeg;
      var rotateY = ((x - centerX) / centerX) * maxDeg;
      card.style.transform = 'perspective(800px) rotateX(' + rotateX.toFixed(2) + 'deg) rotateY(' + rotateY.toFixed(2) + 'deg) scale(1.03)';

      // 粒子拖尾（限频，避免 mousemove 刷 DOM）
      var now = Date.now();
      if (now - lastSpawn > 90) {
        lastSpawn = now;
        spawnCardParticle(card);
      }
    }, { passive: true });

    card.addEventListener('mouseleave', function () {
      card.style.transform = '';
    }, { passive: true });
  }

  /* Spawn a tiny particle near the card edge */
  var liveParticles = 0;
  function spawnCardParticle(card) {
    if (liveParticles >= 12) return;
    var rect = card.getBoundingClientRect();
    var el = document.createElement('div');
    el.style.cssText = 'position:fixed;width:4px;height:4px;border-radius:50%;pointer-events:none;z-index:9999;transition:transform 0.8s ease-out, opacity 0.8s ease-out;';

    // Pick color based on card type
    var color = 'rgba(212,148,58,0.8)';
    if (card.classList.contains('card-2')) color = 'rgba(240,107,94,0.8)';
    if (card.classList.contains('card-3')) color = 'rgba(123,174,127,0.8)';
    if (card.classList.contains('card-4')) color = 'rgba(100,149,237,0.8)';
    el.style.background = color;
    el.style.boxShadow = '0 0 6px ' + color;

    // Random position on card edge
    var side = Math.floor(Math.random() * 4);
    var px, py;
    if (side === 0) { px = rect.left + Math.random() * rect.width; py = rect.top; }
    else if (side === 1) { px = rect.right; py = rect.top + Math.random() * rect.height; }
    else if (side === 2) { px = rect.left + Math.random() * rect.width; py = rect.bottom; }
    else { px = rect.left; py = rect.top + Math.random() * rect.height; }

    el.style.left = px + 'px';
    el.style.top = py + 'px';
    el.style.opacity = '1';
    document.body.appendChild(el);
    liveParticles++;

    // Animate outward + fade
    requestAnimationFrame(function () {
      var dx = (Math.random() - 0.5) * 40;
      var dy = (Math.random() - 0.5) * 40;
      el.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(0)';
      el.style.opacity = '0';
    });

    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
      liveParticles--;
    }, 900);
  }

  /* --- Title Character Split Animation ---
     B4 修复：只拆分「纯文本节点」，不进入元素子节点。
     `.highlight` 的渐变依赖父元素上的 -webkit-background-clip: text，
     一旦把它的文字拆进子 span，渐变会被切断、文字变透明，
     因此含元素子节点的行保持原结构，只保留 .line-inner 的整体入场动画。 */
  function initTitleChars() {
    var titleEl = document.querySelector('.hero-title');
    if (!titleEl) return;
    if (prefersReducedMotion()) return;

    var lines = titleEl.querySelectorAll('.line-inner');
    for (var i = 0; i < lines.length; i++) {
      splitTextNodes(lines[i], 0.3);
    }
  }

  function splitTextNodes(line, baseDelay) {
    var snapshot = [];
    var child = line.firstChild;
    while (child) {
      snapshot.push(child);
      child = child.nextSibling;
    }

    var index = 0;
    for (var i = 0; i < snapshot.length; i++) {
      var node = snapshot[i];
      if (node.nodeType === 3) {
        index = wrapTextNode(line, node, index, baseDelay);
      }
      // 元素节点（如 <span class="highlight">）保持原样，不进入拆分
    }
  }

  function wrapTextNode(parent, textNode, startIndex, baseDelay) {
    var text = textNode.nodeValue || '';
    var frag = document.createDocumentFragment();
    var index = startIndex;

    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);
      if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
        frag.appendChild(document.createTextNode(' '));
        continue;
      }
      var span = document.createElement('span');
      span.className = 'char';
      span.style.animationDelay = (baseDelay + index * 0.04).toFixed(2) + 's';
      span.textContent = ch;
      frag.appendChild(span);
      index++;
    }

    parent.replaceChild(frag, textNode);
    return index;
  }

})();
