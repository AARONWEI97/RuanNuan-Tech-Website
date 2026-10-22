/** 同页锚点平滑滚动（兼容 index.html#about 这类写法），并把焦点移到目标 */
import { scrollToTarget } from '../lib/scroll';

export function initAnchors() {
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element).closest<HTMLAnchorElement>('a[href*="#"]');
    if (!a || a.target === '_blank') return;
    const link = new URL(a.href, location.href);
    if (link.origin !== location.origin || link.pathname.replace(/index\.html$/, '') !== location.pathname.replace(/index\.html$/, '')) return;
    const id = decodeURIComponent(link.hash.slice(1));
    const target = id ? document.getElementById(id) : null;
    if (!target) return;
    e.preventDefault();
    history.pushState(null, '', `#${id}`);
    scrollToTarget(target, -16);
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });
}
