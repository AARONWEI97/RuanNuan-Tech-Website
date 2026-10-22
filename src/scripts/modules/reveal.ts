/** 滚动显露 / 英文标签解码 / 数字滚动 */
import { $$, reducedMotion } from '../lib/env';

export function initReveal() {
  const els = $$('[data-reveal], [data-stagger]');
  $$('[data-stagger]').forEach((box) =>
    Array.from(box.children).forEach((c, i) => (c as HTMLElement).style.setProperty('--i', String(i))),
  );
  if (reducedMotion || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      io.unobserve(en.target);
    }),
    { rootMargin: '0px 0px -10% 0px', threshold: 0.12 },
  );
  els.forEach((el) => io.observe(el));
}

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#/<>_';

export function initScramble() {
  if (reducedMotion) return;
  const els = $$('[data-scramble]').filter((el) => el.children.length === 0);
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (!en.isIntersecting) return;
    io.unobserve(en.target);
    scramble(en.target as HTMLElement);
  }), { threshold: 0.6 });
  els.forEach((el) => {
    const text = el.textContent ?? '';
    // 读屏读原文；可见层做乱码
    el.innerHTML = `<span class="sr-only"></span><span class="scramble-fx" aria-hidden="true"></span>`;
    (el.firstElementChild as HTMLElement).textContent = text;
    (el.lastElementChild as HTMLElement).textContent = text;
    el.dataset.text = text;
    io.observe(el);
  });
}

function scramble(el: HTMLElement) {
  const out = el.querySelector<HTMLElement>('.scramble-fx');
  const text = el.dataset.text ?? '';
  if (!out) return;
  const dur = 700 + text.length * 18;
  const t0 = performance.now();
  const step = (now: number) => {
    const p = Math.min(1, (now - t0) / dur);
    const solved = Math.floor(p * text.length);
    let s = '';
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      s += i < solved || ch === ' ' || ch === '·' ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
    }
    out.textContent = s;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/** <span data-counter="80" data-counter-suffix="%+">80%+</span>：HTML 写最终值，无 JS 也正确 */
export function initCounters() {
  const els = $$('[data-counter]');
  if (reducedMotion) return;
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (!en.isIntersecting) return;
    io.unobserve(en.target);
    const el = en.target as HTMLElement;
    const to = Number(el.dataset.counter);
    const suffix = el.dataset.counterSuffix ?? '';
    const t0 = performance.now();
    const dur = 1600;
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      el.textContent = `${Math.round(to * (1 - Math.pow(1 - p, 4)))}${suffix}`;
      if (p < 1) requestAnimationFrame(step);
    };
    el.textContent = `0${suffix}`;
    requestAnimationFrame(step);
  }), { threshold: 0.5 });
  els.forEach((el) => io.observe(el));
}
