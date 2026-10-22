/** 导航：下方区块明暗探测 / 下滚隐藏上滚显示 / 产品大菜单 / 移动端菜单 */
import { $, $$, finePointer, isDesktop } from '../lib/env';
import { lockScroll } from '../lib/scroll';

export function initNav() {
  const nav = $('#nav');
  if (!nav) return;

  /* --- 明暗探测 + 显隐 --- */
  let lastY = window.scrollY;
  let ticking = false;
  const update = () => {
    ticking = false;
    const y = window.scrollY;
    // 取导航正下方一点的元素，找最近的 data-theme 区块（跳过导航自身与浮层）
    const probeY = 40;
    const hit = document
      .elementsFromPoint(window.innerWidth / 2, probeY)
      .find((el) => !nav.contains(el) && !el.closest('.pet') && el.closest('[data-theme]'));
    const tone = hit?.closest('[data-theme]')?.getAttribute('data-theme') ?? 'dark';
    if (nav.dataset.tone !== tone) nav.dataset.tone = tone;

    const megaOpen = nav.querySelector('.nav-mega.is-open');
    const hide = y > 240 && y > lastY + 4 && !megaOpen && !nav.contains(document.activeElement);
    if (hide) nav.classList.add('is-hidden');
    else if (y < lastY - 4 || y <= 240) nav.classList.remove('is-hidden');
    lastY = y;
  };
  const onScroll = () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  window.addEventListener('load', update);
  update();

  initMega(nav);
  initMobileMenu();
}

function initMega(nav: HTMLElement) {
  const btn = $<HTMLButtonElement>('.nav-mega-btn', nav);
  const panel = $('#navMega');
  if (!btn || !panel) return;
  const wrap = btn.closest('li')!;
  let closeTimer = 0;
  let hideTimer = 0;

  const setOpen = (open: boolean) => {
    window.clearTimeout(hideTimer);
    btn.setAttribute('aria-expanded', String(open));
    if (open) {
      panel.hidden = false;
      requestAnimationFrame(() => panel.classList.add('is-open'));
    } else {
      panel.classList.remove('is-open');
      hideTimer = window.setTimeout(() => (panel.hidden = true), 380);
    }
  };
  const isOpen = () => btn.getAttribute('aria-expanded') === 'true';

  btn.addEventListener('click', () => setOpen(!isOpen()));
  if (finePointer) {
    const enter = () => { window.clearTimeout(closeTimer); if (!isOpen()) setOpen(true); };
    const leave = () => { closeTimer = window.setTimeout(() => setOpen(false), 180); };
    [wrap, panel].forEach((el) => {
      el.addEventListener('pointerenter', enter);
      el.addEventListener('pointerleave', leave);
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) { setOpen(false); btn.focus(); }
  });
  document.addEventListener('click', (e) => {
    if (isOpen() && !nav.contains(e.target as Node)) setOpen(false);
  });
  nav.addEventListener('focusout', (e) => {
    const next = e.relatedTarget as Node | null;
    if (isOpen() && next && !wrap.contains(next) && !panel.contains(next)) setOpen(false);
  });
}

function initMobileMenu() {
  const dialog = $<HTMLDialogElement>('#mobileMenu');
  const burger = $<HTMLButtonElement>('.nav-burger');
  if (!dialog || !burger) return;

  const close = () => dialog.open && dialog.close();
  burger.addEventListener('click', () => {
    dialog.showModal();
    burger.setAttribute('aria-expanded', 'true');
    lockScroll(true);
  });
  dialog.addEventListener('close', () => {
    burger.setAttribute('aria-expanded', 'false');
    lockScroll(false);
  });
  $$('[data-mmenu-close]', dialog).forEach((b) => b.addEventListener('click', close));
  // 点链接先关菜单（恢复滚动），锚点平滑滚动随后由 anchors.ts 处理
  dialog.addEventListener('click', (e) => {
    if ((e.target as Element).closest('a')) close();
  });
  window.addEventListener('resize', () => { if (isDesktop()) close(); }, { passive: true });
}
