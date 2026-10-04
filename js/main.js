/* ============================
   冉暖科技 RanNuan Tech — 核心运行时 js/main.js
   ---------------------------------------------------------------
   职责（UPGRADE-CONTRACT §5 / §8）：
     · 导航滚动收缩                · 主导航高亮（body[data-page] + data-nav）
     · 移动菜单（aria-expanded / ESC / 焦点归还 / 滚动锁）
     · 滚动显露（IntersectionObserver → .visible）
     · 返回顶部                    · 锚点平滑滚动（含固定导航偏移）
     · 计数器（data-counter + data-counter-suffix，保留后缀）
     · 弹窗（焦点陷阱 / ESC / 遮罩点击 / 滚动锁 / 焦点归还）
     · data-copy 复制（Clipboard API + 降级，aria-live 反馈）
     · 联系表单（无 JS 可原生 POST；有 JS 异步提交，禁止 alert）

   兼容：保留 window.toggleMobileMenu / openWechatModal / closeWechatModal /
        openQQModal / closeQQModal / copyToClipboard 全局函数（旧页面兜底）。
   约定：纯原生 ES5 语法风格（var + function），无第三方依赖。
   ============================ */
(function () {
  'use strict';

  /* 重复加载守卫（契约 §3：脚本被引入两次时不得重复初始化） */
  if (window.__ranNuanCoreLoaded) return;
  window.__ranNuanCoreLoaded = true;

  var reduceMotion = false;
  try {
    reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (err) {
    reduceMotion = false;
  }

  var FOCUSABLE = 'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), ' +
                  'select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])';

  /* 运行期状态 */
  var activeModal = null;     // 当前打开的 .modal-overlay
  var lastModalTrigger = null; // 打开弹窗的触发元素（关闭后焦点归还）
  var menuOpen = false;
  var lastMenuTrigger = null;
  var liveRegion = null;      // aria-live 播报区

  /* ----------------------------------------------------------
     工具函数（全部对空结果安全返回）
     ---------------------------------------------------------- */
  function $(selector, ctx) {
    try { return (ctx || document).querySelector(selector); } catch (err) { return null; }
  }
  function $$(selector, ctx) {
    try {
      return Array.prototype.slice.call((ctx || document).querySelectorAll(selector));
    } catch (err) { return []; }
  }
  function on(el, type, fn, opts) {
    if (el && el.addEventListener) el.addEventListener(type, fn, opts || false);
  }
  function scrollTop() {
    return window.pageYOffset || document.documentElement.scrollTop || 0;
  }
  /* 同一帧内只执行一次（滚动监听节流） */
  function rafThrottle(fn) {
    var queued = false;
    return function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () {
        queued = false;
        fn();
      });
    };
  }
  function isInViewport(el) {
    var rect = el.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  }
  /* 读取弹窗：优先 data-modal 契约，其次旧 id 兜底 */
  function findOverlay(name) {
    if (!name) return null;
    return $('.modal-overlay[data-modal="' + name + '"]') || document.getElementById(name + 'Modal');
  }
  function getFocusable(root) {
    return $$(FOCUSABLE, root).filter(function (el) {
      if (el.hasAttribute('disabled') || el.getAttribute('aria-hidden') === 'true') return false;
      return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
    });
  }
  function announce(msg) {
    if (!document.body) return;
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.className = 'sr-only';
      liveRegion.setAttribute('role', 'status');
      liveRegion.setAttribute('aria-live', 'polite');
      document.body.appendChild(liveRegion);
    }
    liveRegion.textContent = '';
    window.setTimeout(function () { liveRegion.textContent = msg; }, 60);
  }

  /* ----------------------------------------------------------
     0. 计数器预置：尽早把静态终值重置为 0 + 后缀，压缩首屏闪帧
        （HTML 内写的是最终值，保证无 JS / 爬虫场景数值正确）
     ---------------------------------------------------------- */
  function readCounter(el) {
    var raw = el.getAttribute('data-counter');
    if (raw === null) raw = el.getAttribute('data-target'); // 兼容旧写法 .counter[data-target]
    if (raw === null || raw === '') return null;
    var target = parseFloat(raw);
    if (isNaN(target)) return null;

    var suffix = el.getAttribute('data-counter-suffix');
    if (suffix === null) suffix = el.getAttribute('data-suffix');
    if (suffix === null) {
      /* 没有后缀属性时，从静态文本里推断（例如 "80%+" → "%+"） */
      var text = (el.textContent || '').trim();
      var m = /^\s*[-+]?[\d.,\s]*/.exec(text);
      suffix = text.slice(m ? m[0].length : 0);
    }
    if (!el.hasAttribute('data-counter-suffix')) el.setAttribute('data-counter-suffix', suffix);

    var rawText = String(raw).trim();
    var dot = rawText.indexOf('.');
    var decimals = dot === -1 ? 0 : Math.min(3, rawText.length - dot - 1);
    var duration = parseInt(el.getAttribute('data-counter-duration') || el.getAttribute('data-duration'), 10);
    return {
      target: target,
      suffix: suffix,
      decimals: decimals,
      duration: (duration > 0 ? duration : 1600)
    };
  }
  function formatCount(value, decimals) {
    var str = decimals > 0 ? value.toFixed(decimals) : String(Math.round(value));
    if (decimals === 0 && Math.abs(value) >= 10000) {
      str = Number(str).toLocaleString('en-US');
    }
    return str;
  }
  function presetCounters() {
    $$('[data-counter], .counter[data-target]').forEach(function (el) {
      var cfg = readCounter(el);
      if (!cfg) return;
      if (el.getAttribute('data-counter-state') === 'done') return;
      el.setAttribute('data-counter-state', 'preset');
      el.textContent = formatCount(0, cfg.decimals) + cfg.suffix;
    });
  }
  function runCounter(el) {
    var cfg = readCounter(el);
    if (!cfg) return;
    el.setAttribute('data-counter-state', 'done');
    var finalText = formatCount(cfg.target, cfg.decimals) + cfg.suffix;
    if (reduceMotion) { el.textContent = finalText; return; }

    var startTime = null;
    function step(timestamp) {
      if (startTime === null) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / cfg.duration, 1);
      var eased = 1 - Math.pow(1 - progress, 4); // easeOutQuart
      el.textContent = formatCount(cfg.target * eased, cfg.decimals) + cfg.suffix;
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = finalText;
    }
    requestAnimationFrame(step);
  }
  function initCounters() {
    presetCounters();
    var els = $$('[data-counter], .counter[data-target]');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
      els.forEach(runCounter);
      return;
    }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          runCounter(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    els.forEach(function (el) { obs.observe(el); });
    /* 兜底：若观察器未触发但元素已在视口内（例如尺寸为 0 的瞬间），5s 后直接播放 */
    window.setTimeout(function () {
      els.forEach(function (el) {
        if (el.getAttribute('data-counter-state') !== 'done' && isInViewport(el)) runCounter(el);
      });
    }, 5000);
  }

  /* ----------------------------------------------------------
     1. 导航滚动收缩
     ---------------------------------------------------------- */
  function initNav() {
    var nav = $('.nav');
    if (!nav) return;
    var update = rafThrottle(function () {
      nav.classList.toggle('scrolled', scrollTop() > 50);
    });
    update();
    on(window, 'scroll', update, { passive: true });
  }

  /* ----------------------------------------------------------
     2. 主导航高亮：body[data-page] 匹配 [data-nav]
        （data-page 无对应导航项时安全返回，例如 404 页）
     ---------------------------------------------------------- */
  function initNavHighlight() {
    var page = document.body ? document.body.getAttribute('data-page') : null;
    if (!page) return;
    var links = $$('[data-nav]');
    if (!links.length) return;
    links.forEach(function (link) {
      var isCurrent = link.getAttribute('data-nav') === page;
      link.classList.toggle('active', isCurrent);
      if (isCurrent) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }

  /* ----------------------------------------------------------
     3. 移动菜单：data-menu-toggle + aria-expanded + ESC + 焦点归还
     ---------------------------------------------------------- */
  function syncScrollLock() {
    var locked = !!activeModal || menuOpen;
    if (document.body) {
      document.body.classList.toggle('modal-open', !!activeModal);
      document.body.classList.toggle('menu-open', menuOpen);
      document.body.style.overflow = locked ? 'hidden' : '';
    }
  }
  function setMenu(open, trigger) {
    var menu = $('.mobile-menu') || document.getElementById('mobileMenu');
    if (!menu) return;
    menuOpen = !!open;
    menu.classList.toggle('active', menuOpen);

    /* aria-expanded / aria-label 同步到汉堡按钮（契约 §4.2 带 aria-controls 的那个） */
    $$('[data-menu-toggle]').forEach(function (btn) {
      if (btn.classList.contains('mobile-menu-btn')) {
        btn.classList.toggle('active', menuOpen);
        btn.setAttribute('aria-expanded', menuOpen ? 'true' : 'false');
        btn.setAttribute('aria-label', menuOpen ? '关闭菜单' : '打开菜单');
      }
    });

    if (menuOpen) {
      lastMenuTrigger = trigger || document.activeElement;
      syncScrollLock();
      var closer = $('.mobile-menu-close', menu);
      if (closer && closer.focus) closer.focus();
    } else {
      syncScrollLock();
      if (lastMenuTrigger && lastMenuTrigger.focus && document.contains(lastMenuTrigger)) {
        lastMenuTrigger.focus();
      }
      lastMenuTrigger = null;
    }
  }
  function initMobileMenu() {
    var menu = $('.mobile-menu') || document.getElementById('mobileMenu');
    if (!menu) return;

    /* 汉堡按钮 / 菜单内关闭按钮：data-menu-toggle 切换 */
    $$('[data-menu-toggle]').forEach(function (btn) {
      on(btn, 'click', function (e) {
        e.preventDefault();
        setMenu(!menuOpen, btn);
      });
    });

    /* 点击菜单内链接后收起（随后由锚点平滑滚动把焦点移到目标） */
    on(menu, 'click', function (e) {
      var link = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (link && menuOpen) setMenu(false);
    });
  }

  /* ----------------------------------------------------------
     4. 滚动显露（激活类 .visible）+ data-reveal-delay
     ---------------------------------------------------------- */
  function initScrollReveal() {
    var els = $$('.reveal, .reveal-left, .reveal-right, .reveal-scale');
    if (!els.length) return;

    /* data-reveal-delay="2" 等价于 .delay-2 */
    els.forEach(function (el) {
      var level = parseInt(el.getAttribute('data-reveal-delay'), 10);
      if (level >= 1 && level <= 5) el.classList.add('delay-' + level);
    });

    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('visible'); });
      return;
    }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el) { obs.observe(el); });

    /* 兜底：避免任何元素永久停留在 opacity:0 */
    window.setTimeout(function () {
      els.forEach(function (el) {
        if (!el.classList.contains('visible') && isInViewport(el)) el.classList.add('visible');
      });
    }, 4000);
  }

  /* ----------------------------------------------------------
     5. 返回顶部
     ---------------------------------------------------------- */
  function initBackToTop() {
    var btn = $('.back-to-top');
    if (!btn) return;
    var update = rafThrottle(function () {
      btn.classList.toggle('visible', scrollTop() > 400);
    });
    update();
    on(window, 'scroll', update, { passive: true });
    on(btn, 'click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ----------------------------------------------------------
     6. 锚点平滑滚动（含固定导航偏移；effects.js 不再重复绑定）
     ---------------------------------------------------------- */
  function initSmoothScroll() {
    on(document, 'click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var link = e.target && e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if (!link) return;
      if (link.hasAttribute('data-modal-open')) return;   // 弹窗触发器不参与锚点滚动
      var href = link.getAttribute('href');
      if (!href || href === '#' || href.length < 2) return;
      var target = document.getElementById(href.slice(1));
      if (!target) return;

      e.preventDefault();
      var nav = $('.nav');
      var offset = (nav ? nav.offsetHeight : 0) + 12;
      var top = target.getBoundingClientRect().top + scrollTop() - offset;
      window.scrollTo({
        top: top < 0 ? 0 : top,
        behavior: reduceMotion ? 'auto' : 'smooth'
      });

      /* 键盘/读屏可达性：焦点随锚点移动，但不额外打断滚动 */
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      try { target.focus({ preventScroll: true }); } catch (err) { target.focus(); }

      if (window.history && history.replaceState) {
        try { history.replaceState(null, '', href); } catch (err2) { /* file:// 等场景忽略 */ }
      }
    });
  }

  /* ----------------------------------------------------------
     7. 弹窗：焦点陷阱 / ESC / 遮罩点击 / 滚动锁 / 焦点归还
     ---------------------------------------------------------- */
  function openModal(name, trigger) {
    var overlay = findOverlay(name);
    if (!overlay) return null;
    if (activeModal === overlay) return overlay;
    if (activeModal) closeModal(activeModal);        // 同时只允许一个弹窗

    activeModal = overlay;
    lastModalTrigger = (trigger && trigger.focus) ? trigger : document.activeElement;
    overlay.classList.add('active');
    overlay.removeAttribute('aria-hidden');
    if ('inert' in overlay) overlay.inert = false;
    syncScrollLock();

    /* 焦点移入弹窗（优先第一个可聚焦元素） */
    var focusables = getFocusable(overlay);
    if (focusables.length) {
      focusables[0].focus();
    } else {
      overlay.setAttribute('tabindex', '-1');
      overlay.focus();
    }
    return overlay;
  }
  function closeModal(overlay) {
    overlay = overlay || activeModal;
    if (!overlay) return;

    overlay.classList.remove('active');
    if (activeModal === overlay) activeModal = null;

    /* 先把焦点归还触发元素，再对弹窗设置 aria-hidden，
       避免出现“焦点仍在 aria-hidden 子树内”的无障碍告警 */
    var trigger = lastModalTrigger;
    lastModalTrigger = null;
    if (trigger && trigger.focus && document.contains(trigger)) trigger.focus();

    overlay.setAttribute('aria-hidden', 'true');
    if ('inert' in overlay) overlay.inert = true;
    syncScrollLock();
  }
  function trapTab(e, root) {
    var focusables = getFocusable(root);
    if (!focusables.length) return;
    var first = focusables[0];
    var last = focusables[focusables.length - 1];
    var current = document.activeElement;
    if (e.shiftKey) {
      if (current === first || !root.contains(current)) {
        e.preventDefault();
        last.focus();
      }
    } else if (current === last || !root.contains(current)) {
      e.preventDefault();
      first.focus();
    }
  }
  function initModals() {
    /* 未打开的弹窗初始状态：对读屏/键盘隐藏（CSS 的 visibility 已保证 Tab 不可达） */
    $$('.modal-overlay').forEach(function (overlay) {
      if (!overlay.classList.contains('active')) {
        overlay.setAttribute('aria-hidden', 'true');
        if ('inert' in overlay) overlay.inert = true;
      }
    });

    on(document, 'click', function (e) {
      var el = e.target;
      if (!el || !el.closest) return;
      var opener = el.closest('[data-modal-open]');
      if (opener) {
        e.preventDefault();
        openModal(opener.getAttribute('data-modal-open'), opener);
        return;
      }
      var closer = el.closest('[data-modal-close]');
      if (closer) {
        e.preventDefault();
        closeModal(closer.closest('.modal-overlay'));
        return;
      }
      /* 遮罩空白处点击关闭 */
      if (el.classList.contains('modal-overlay') && el.classList.contains('active')) {
        closeModal(el);
      }
    });
  }

  /* ----------------------------------------------------------
     8. 复制（data-copy / window.copyToClipboard 兼容）
     ---------------------------------------------------------- */
  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    ta.style.left = '-1000px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    var ok = false;
    try {
      ta.select();
      ta.setSelectionRange(0, text.length);
      ok = document.execCommand('copy');
    } catch (err) {
      ok = false;
    }
    if (ta.parentNode) ta.parentNode.removeChild(ta);
    return ok;
  }
  function copyText(text) {
    return new Promise(function (resolve) {
      var canClipboard = navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext;
      if (canClipboard) {
        navigator.clipboard.writeText(text).then(
          function () { resolve(true); },
          function () { resolve(fallbackCopy(text)); }
        );
      } else {
        resolve(fallbackCopy(text));
      }
    });
  }
  function copyFeedback(btn, ok) {
    if (!btn) return;
    var original = btn.getAttribute('data-original-label');
    if (original === null) {
      original = btn.textContent;
      btn.setAttribute('data-original-label', original);
    }
    btn.textContent = ok ? '已复制' : '复制失败';
    btn.classList.toggle('copied', ok);
    window.setTimeout(function () {
      btn.textContent = btn.getAttribute('data-original-label') || original;
      btn.classList.remove('copied');
    }, 1800);
  }
  function initCopy() {
    on(document, 'click', function (e) {
      var btn = e.target && e.target.closest ? e.target.closest('[data-copy]') : null;
      if (!btn) return;
      e.preventDefault();
      var selector = btn.getAttribute('data-copy');
      var source = null;
      try { source = selector ? document.querySelector(selector) : null; } catch (err) { source = null; }
      var text = source ? (source.textContent || '').trim() : '';
      if (!text) {
        copyFeedback(btn, false);
        announce('复制失败，未找到要复制的内容');
        return;
      }
      copyText(text).then(function (ok) {
        copyFeedback(btn, ok);
        announce(ok ? '已复制到剪贴板：' + text : '复制失败，请手动选择文本后复制');
      });
    });
  }

  /* ----------------------------------------------------------
     9. 表单：无 JS 时原生 POST；有 JS 时异步提交 + aria-live 状态
        （禁止 alert / prompt / confirm）
     ---------------------------------------------------------- */
  function ensureStatus(form) {
    var status = form.querySelector('[data-form-status]') ||
                 form.querySelector('.success-msg') ||
                 form.querySelector('#successMessage');
    if (!status) {
      status = document.createElement('p');
      status.className = 'form-status';
      form.appendChild(status);
    }
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    /* 记录原始内容：页面自带的 .success-msg 含图标结构，成功时原样恢复 */
    if (typeof status.__fxOriginalHtml === 'undefined') {
      status.__fxOriginalHtml = status.innerHTML;
    }
    return status;
  }
  function setStatus(status, msg, kind) {
    if (!status) return;
    status.classList.remove('form-status-pending', 'form-status-ok', 'form-status-error');
    status.classList.add('form-status-' + kind);
    if (kind === 'ok' && status.__fxOriginalHtml) {
      /* 保留页面自带的成功提示结构与图标 */
      status.innerHTML = status.__fxOriginalHtml;
    } else {
      status.textContent = msg;
    }
    if (kind !== 'pending') status.style.display = 'block';
  }
  function initForms() {
    var forms = $$('form').filter(function (form) {
      return String(form.getAttribute('method') || '').toLowerCase() === 'post' &&
             !!form.getAttribute('action');
    });
    if (!forms.length) return;

    forms.forEach(function (form) {
      var status = ensureStatus(form);
      on(form, 'submit', function (e) {
        if (form.getAttribute('data-native-submit') === 'true') return; // 降级后走原生提交
        e.preventDefault();

        var submitBtn = form.querySelector('[type="submit"]');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.setAttribute('aria-busy', 'true');
        }
        setStatus(status, '正在提交，请稍候…', 'pending');
        announce('正在提交，请稍候');

        function done(msg, kind) {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.removeAttribute('aria-busy');
          }
          setStatus(status, msg, kind);
          announce(msg);
        }

        var action = form.getAttribute('action');
        var request;
        try {
          /* no-cors：静态站点无法读取第三方表单服务的响应，但请求会正常送达；
             失败（断网/被拦截）时才降级为原生 POST，避免重复提交 */
          request = fetch(action, { method: 'POST', body: new FormData(form), mode: 'no-cors' });
        } catch (err) {
          form.setAttribute('data-native-submit', 'true');
          form.submit();
          return;
        }
        request.then(function () {
          done('提交成功，感谢您的留言！我们会尽快与您联系。', 'ok');
          form.reset();
        }, function () {
          /* 网络失败：降级为原生提交，保证留言不丢失（浏览器会跳转到表单服务页面） */
          form.setAttribute('data-native-submit', 'true');
          if (submitBtn) { submitBtn.disabled = false; submitBtn.removeAttribute('aria-busy'); }
          setStatus(status, '网络异常，正在改用普通方式提交…', 'pending');
          if (form.requestSubmit) form.requestSubmit(); else form.submit();
        });
      });
    });
  }

  /* ----------------------------------------------------------
     10. 键盘统一处理：ESC 关闭弹窗 / 菜单；Tab 在弹层内循环
     ---------------------------------------------------------- */
  function initKeyboard() {
    on(document, 'keydown', function (e) {
      var key = e.key || '';
      if (key === 'Escape' || key === 'Esc') {
        if (activeModal) { e.preventDefault(); closeModal(activeModal); return; }
        if (menuOpen) { e.preventDefault(); setMenu(false); return; }
        return;
      }
      if (key === 'Tab' && activeModal) { trapTab(e, activeModal); return; }
      if (key === 'Tab' && menuOpen) {
        var menu = $('.mobile-menu');
        if (menu) trapTab(e, menu);
      }
    });
  }

  /* ----------------------------------------------------------
     旧页面兜底全局函数（契约要求继续提供）
     ---------------------------------------------------------- */
  window.toggleMobileMenu = function (force) {
    if (typeof force === 'boolean') setMenu(force);
    else setMenu(!menuOpen);
  };
  window.openWechatModal = function () { return openModal('wechat', document.activeElement); };
  window.closeWechatModal = function () { closeModal(findOverlay('wechat')); };
  window.openQQModal = function () { return openModal('qq', document.activeElement); };
  window.closeQQModal = function () { closeModal(findOverlay('qq')); };
  window.copyToClipboard = function (id, btn) {
    var el = typeof id === 'string' ? document.getElementById(id) : id;
    var text = el ? (el.textContent || '').trim() : '';
    if (!text) {
      copyFeedback(btn, false);
      announce('复制失败，未找到要复制的内容');
      return;
    }
    copyText(text).then(function (ok) {
      copyFeedback(btn, ok);
      announce(ok ? '已复制到剪贴板：' + text : '复制失败，请手动选择文本后复制');
    });
  };

  /* ----------------------------------------------------------
     启动
     ---------------------------------------------------------- */
  function boot() {
    initNav();
    initNavHighlight();
    initMobileMenu();
    initScrollReveal();
    initBackToTop();
    initSmoothScroll();
    initCounters();
    initModals();
    initCopy();
    initForms();
    initKeyboard();
    syncScrollLock();
  }

  /* 计数器预置尽可能早执行（main.js 位于 </body> 之前，元素均已解析） */
  if (document.body) presetCounters();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
