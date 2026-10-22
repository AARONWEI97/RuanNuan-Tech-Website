/** 产品页专属：Hero 温度场 / 页内目录 / 截图分组与灯箱 / 网盘密码解锁 */
import { $, $$, finePointer, isDesktop, reducedMotion } from './lib/env';
import { gsap, lockScroll } from './lib/scroll';
import { createHeatfield } from './lib/heatfield';

initHero();
initSubnav();
initGalleryTabs();
initLightbox();
initUnlock();

function initHero() {
  const hero = $('.phero');
  const canvas = $<HTMLCanvasElement>('.phero-canvas');
  if (!hero || !canvas) return;
  const field = createHeatfield(canvas, hero);
  if (field) new IntersectionObserver(([en]) => (en.isIntersecting ? field.start() : field.stop())).observe(hero);

  // 截图窗口：鼠标 3D 视差（与首页一致的手感，幅度更小）
  const visual = $('[data-phero-visual]', hero);
  if (!visual || !finePointer || reducedMotion) return;
  gsap.set(visual, { transformPerspective: 1600 });
  const rx = gsap.quickTo(visual, 'rotationX', { duration: 1, ease: 'power3.out' });
  const ry = gsap.quickTo(visual, 'rotationY', { duration: 1, ease: 'power3.out' });
  hero.addEventListener('pointermove', (e) => {
    if (!isDesktop()) return;
    ry((e.clientX / window.innerWidth - 0.5) * 10);
    rx(-(e.clientY / window.innerHeight - 0.5) * 7);
  }, { passive: true });
  hero.addEventListener('pointerleave', () => { rx(0); ry(0); });
}

/** 页内目录：当前章节高亮 + 指示条滑动；滚过 Hero 才出现 */
function initSubnav() {
  const nav = $('[data-psub]');
  const hero = $('.phero');
  if (!nav) return;
  const links = $$<HTMLAnchorElement>('[data-psub-link]', nav);
  const sections = links
    .map((a) => document.getElementById(a.dataset.psubLink!))
    .filter((s): s is HTMLElement => !!s);

  if (hero) {
    new IntersectionObserver(([en]) => nav.classList.toggle('is-shown', !en.isIntersecting), {
      rootMargin: '-120px 0px 0px 0px',
    }).observe(hero);
  } else {
    nav.classList.add('is-shown');
  }

  const setActive = (id: string | null) => links.forEach((a) => {
    const on = a.dataset.psubLink === id;
    if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
    // 窄屏目录可横向滚动：只滚列表自身，不用 scrollIntoView（会牵动页面滚动）
    const list = a.closest('ul');
    if (on && list && list.scrollWidth > list.clientWidth) {
      list.scrollTo({ left: a.offsetLeft - list.clientWidth / 2 + a.offsetWidth / 2, behavior: 'smooth' });
    }
  });
  // 视口中线落在哪个区块，哪个就是当前章节
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) setActive(en.target.id);
  }), { rootMargin: '-50% 0px -50% 0px' });
  sections.forEach((s) => io.observe(s));
}

/** 截图分组标签：WAI-ARIA tabs（方向键切换）；无 JS 时所有分组顺序展开 */
function initGalleryTabs() {
  $$('[data-gallery]').forEach((root) => {
    const tabs = $$<HTMLButtonElement>('[role="tab"]', root);
    if (!tabs.length) return;
    const ink = $('.gallery-tab-ink', root);
    const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')!)!);

    const select = (i: number, focus = false) => {
      tabs.forEach((t, j) => {
        const on = i === j;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        panels[j].hidden = !on;
      });
      if (focus) tabs[i].focus();
      if (ink) {
        ink.style.setProperty('--x', `${tabs[i].offsetLeft}px`);
        ink.style.setProperty('--w', `${tabs[i].offsetWidth}px`);
      }
      // 新面板里的错步入场直接显示，避免切换后空白
      panels[i].querySelectorAll('[data-stagger]').forEach((el) => el.classList.add('is-in'));
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(i));
      t.addEventListener('keydown', (e) => {
        const n = tabs.length;
        const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: n - 1 }[e.key];
        if (next === undefined) return;
        e.preventDefault();
        select((next + n) % n, true);
      });
    });
    select(0);
    window.addEventListener('resize', () => select(tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true')), { passive: true });
  });
}

/** 灯箱：同组左右切换，← → 键 / Esc；原生 dialog 负责焦点陷阱与归还 */
function initLightbox() {
  const box = $<HTMLDialogElement>('#lightbox');
  if (!box) return;
  const img = $<HTMLImageElement>('.lightbox-img', box)!;
  const cap = $('[data-lb-caption]', box)!;
  const idx = $('[data-lb-index]', box)!;
  let group: HTMLAnchorElement[] = [];
  let cur = 0;

  const show = (i: number) => {
    cur = (i + group.length) % group.length;
    const a = group[cur];
    const thumb = a.querySelector('img');
    img.src = a.href;
    img.alt = thumb?.alt ?? '';
    cap.textContent = a.dataset.caption ?? '';
    idx.textContent = `${String(cur + 1).padStart(2, '0')} / ${String(group.length).padStart(2, '0')}`;
    box.classList.toggle('is-portrait', !!thumb && thumb.naturalHeight > thumb.naturalWidth);
    box.classList.toggle('is-single', group.length < 2);
  };

  document.addEventListener('click', (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('[data-lightbox]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    group = $$<HTMLAnchorElement>(`[data-lightbox="${a.dataset.lightbox}"]`);
    show(group.indexOf(a));
    box.showModal();
    lockScroll(true);
  });
  box.addEventListener('close', () => lockScroll(false));
  box.addEventListener('click', (e) => {
    const t = e.target as Element;
    if (t === box || t.closest('[data-lb-close]')) box.close();
    else if (t.closest('[data-lb-prev]')) show(cur - 1);
    else if (t.closest('[data-lb-next]')) show(cur + 1);
  });
  box.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(cur - 1);
    if (e.key === 'ArrowRight') show(cur + 1);
  });
}

/**
 * 网盘密码：点 GitHub 链接记录时间，有效期内回到本页（或切回标签页）自动展开密码。
 * 刷新页面清空记录；sessionStorage 不可用时保持展开，密码始终可达。
 */
function initUnlock() {
  const root = $('[data-unlock-expire]');
  if (!root) return;
  const expire = Number(root.dataset.unlockExpire) || 30 * 60_000;
  const lockedHint = root.dataset.unlockHint ?? '访问后返回本页自动解锁';
  const store = {
    get: (k: string) => { try { return sessionStorage.getItem(k); } catch { return null; } },
    set: (k: string, v: string) => { try { sessionStorage.setItem(k, v); return true; } catch { return false; } },
    del: (k: string) => { try { sessionStorage.removeItem(k); } catch { /* 隐私模式 */ } },
  };
  // 存储不可用就不上锁
  if (!store.set('__rn_probe', '1')) return;
  store.del('__rn_probe');

  const entries = $$<HTMLAnchorElement>('[data-unlock-link]', root).map((link) => ({
    link,
    key: link.dataset.unlockStorage!,
    details: $<HTMLDetailsElement>(`[data-unlock-pwd="${link.dataset.unlockLink}"]`, root)!,
  })).filter((x) => x.details);

  const isReload = (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined)?.type === 'reload';
  const hint = (d: HTMLDetailsElement, text: string) => {
    const el = $('[data-unlock-hint-text]', d);
    if (el) el.textContent = text;
  };
  const lock = (d: HTMLDetailsElement) => {
    d.open = false;
    d.classList.add('is-locked');
    d.classList.remove('is-unlocked');
    hint(d, lockedHint);
  };
  const unlock = (d: HTMLDetailsElement) => {
    d.open = true;
    d.classList.remove('is-locked');
    d.classList.add('is-unlocked');
    hint(d, '已解锁 · 网盘密码如下');
  };
  const check = () => entries.forEach(({ key, details }) => {
    const ts = Number(store.get(key));
    if (!ts) return;
    if (Date.now() - ts > expire) { store.del(key); return; }
    unlock(details);
  });

  entries.forEach(({ link, key, details }) => {
    if (isReload) store.del(key);
    lock(details);
    link.addEventListener('click', () => store.set(key, String(Date.now())));
    // 锁定态点 summary：不展开，提示先去 GitHub
    details.querySelector('summary')?.addEventListener('click', (e) => {
      if (!details.classList.contains('is-locked')) return;
      e.preventDefault();
      link.classList.remove('is-nudge');
      void link.offsetWidth;
      link.classList.add('is-nudge');
    });
  });
  check();
  window.addEventListener('focus', check);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
}
