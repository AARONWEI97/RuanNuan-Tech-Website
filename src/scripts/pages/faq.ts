/** 常见问题：即时搜索（高亮命中 + 自动展开）/ 分组索引高亮 / 「/」聚焦搜索 / 深链展开 */
import { $, $$, announce } from '../lib/env';

const input = $<HTMLInputElement>('[data-faq-query]');
const groups = $$('[data-faq-group]');
const empty = $('[data-faq-empty]');
const items = $$<HTMLDetailsElement>('[data-faq-item]');

// 记住原文，搜索时在副本上加 <mark>
const source = new Map(items.map((d) => [d, {
  q: d.querySelector('.faq-q')!.textContent ?? '',
  a: d.querySelector('.faq-a p')!.textContent ?? '',
}]));
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const mark = (text: string, kw: string) => {
  if (!kw) return esc(text);
  const i = text.toLowerCase().indexOf(kw);
  return i < 0 ? esc(text) : `${esc(text.slice(0, i))}<mark>${esc(text.slice(i, i + kw.length))}</mark>${esc(text.slice(i + kw.length))}`;
};

let timer = 0;
input?.addEventListener('input', () => {
  window.clearTimeout(timer);
  timer = window.setTimeout(() => filter(input.value.trim().toLowerCase()), 120);
});

function filter(kw: string) {
  let hits = 0;
  items.forEach((d) => {
    const s = source.get(d)!;
    const ok = !kw || s.q.toLowerCase().includes(kw) || s.a.toLowerCase().includes(kw);
    d.hidden = !ok;
    d.querySelector('.faq-q')!.innerHTML = mark(s.q, kw);
    d.querySelector('.faq-a p')!.innerHTML = mark(s.a, kw);
    if (kw) d.open = ok;
    if (ok) hits++;
  });
  groups.forEach((g) => (g.hidden = !g.querySelector('[data-faq-item]:not([hidden])')));
  if (empty) empty.hidden = hits > 0;
  if (kw) announce(hits ? `找到 ${hits} 个相关问题` : '没有找到相关问题');
}

// 「/」快速聚焦搜索（输入框内不拦截）
document.addEventListener('keydown', (e) => {
  if (e.key !== '/' || e.ctrlKey || e.metaKey) return;
  const t = e.target as HTMLElement;
  if (t.closest('input, textarea, [contenteditable="true"]')) return;
  e.preventDefault();
  input?.focus();
});

// 分组索引：视口中线所在分组高亮
const links = $$<HTMLAnchorElement>('[data-faq-index]');
const io = new IntersectionObserver((entries) => entries.forEach((en) => {
  if (!en.isIntersecting) return;
  links.forEach((a) => (a.dataset.faqIndex === en.target.id ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
}), { rootMargin: '-40% 0px -55% 0px' });
groups.forEach((g) => io.observe(g));

// 产品页深链（faq.html#music）：展开该组第一个问题
const openFromHash = () => {
  const g = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
  if (g?.matches('[data-faq-group]')) {
    const first = g.querySelector<HTMLDetailsElement>('[data-faq-item]');
    if (first) first.open = true;
  }
};
openFromHash();
window.addEventListener('hashchange', openFromHash);
