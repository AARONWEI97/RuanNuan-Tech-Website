/** 磁吸按钮 [data-magnetic] + 聚光描边 [data-spotlight]（仅精确指针、非减少动态） */
import { $$, finePointer, reducedMotion } from '../lib/env';
import { gsap } from '../lib/scroll';

export function initPointerFx() {
  if (!finePointer || reducedMotion) return;

  $$('[data-magnetic]').forEach((el) => {
    const x = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' });
    const y = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      x((e.clientX - r.left - r.width / 2) * 0.28);
      y((e.clientY - r.top - r.height / 2) * 0.35);
    });
    el.addEventListener('pointerleave', () => { x(0); y(0); });
  });

  // 聚光：一次委托，rAF 合帧
  let raf = 0;
  let last: { el: HTMLElement; x: number; y: number } | null = null;
  document.addEventListener('pointermove', (e) => {
    const el = (e.target as Element).closest<HTMLElement>('[data-spotlight]');
    if (!el) return;
    last = { el, x: e.clientX, y: e.clientY };
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      if (!last) return;
      const r = last.el.getBoundingClientRect();
      last.el.style.setProperty('--mx', `${last.x - r.left}px`);
      last.el.style.setProperty('--my', `${last.y - r.top}px`);
    });
  }, { passive: true });
}
