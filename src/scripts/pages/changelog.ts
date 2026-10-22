/** 更新日志：按产品筛选（URL 带 ?p=music 可直达），空年份自动隐藏 */
import { $$, announce } from '../lib/env';
import { ScrollTrigger } from '../lib/scroll';

const buttons = $$<HTMLButtonElement>('[data-log-filter]');
const entries = $$('[data-log-entry]');
const years = $$('[data-log-year]');

function apply(key: string, push = false) {
  if (!buttons.some((b) => b.dataset.logFilter === key)) key = 'all';
  buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.logFilter === key)));
  let n = 0;
  entries.forEach((el) => {
    const show = key === 'all' || el.dataset.product === key;
    el.hidden = !show;
    if (show) { n++; el.classList.add('is-in'); }
  });
  years.forEach((y) => (y.hidden = !y.querySelector('[data-log-entry]:not([hidden])')));
  if (push) {
    const u = new URL(location.href);
    if (key === 'all') u.searchParams.delete('p'); else u.searchParams.set('p', key);
    history.replaceState(null, '', u);
    announce(`显示 ${n} 条更新记录`);
  }
  ScrollTrigger.refresh();
}

buttons.forEach((b) => b.addEventListener('click', () => apply(b.dataset.logFilter!, true)));
apply(new URLSearchParams(location.search).get('p') ?? 'all');
