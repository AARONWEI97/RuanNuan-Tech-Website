/* ============================
   冉暖科技 RanNuan Tech
   js/pages.js — 内容页页面级交互
   仅 changelog.html 引入（其余内容页为纯静态呈现，不加载本文件，避免多余请求）
   职责：
     1. 更新日志按产品筛选 —— [data-log-filter="all|order|music|epos"] 按钮 ↔ [data-product] 条目
   约定：IIFE + 'use strict'；无匹配元素时安全返回；重复加载不会重复绑定。
   ============================ */
(function () {
    'use strict';

    // 重复加载守卫（本文件被引入两次时只初始化一次）
    if (window.__rnPagesReady) { return; }
    window.__rnPagesReady = true;

    /* 更新日志筛选
       点击筛选按钮后：同步按钮的 aria-pressed 状态，并显隐对应的 [data-product] 条目；
       "all" 显示全部。用 hidden 属性切换，不需要额外 class，样式保持无状态。 */
    function initChangelogFilter() {
        var buttons = document.querySelectorAll('[data-log-filter]');
        var items = document.querySelectorAll('.timeline-item[data-product]');

        // 页面没有筛选组件（或没有条目）时安全返回
        if (!buttons.length || !items.length) { return; }

        function apply(filter) {
            var i;
            for (i = 0; i < buttons.length; i++) {
                var isActive = buttons[i].getAttribute('data-log-filter') === filter;
                buttons[i].setAttribute('aria-pressed', isActive ? 'true' : 'false');
            }
            for (i = 0; i < items.length; i++) {
                var isMatch = filter === 'all' || items[i].getAttribute('data-product') === filter;
                items[i].hidden = !isMatch;
            }
        }

        for (var i = 0; i < buttons.length; i++) {
            buttons[i].addEventListener('click', function () {
                apply(this.getAttribute('data-log-filter') || 'all');
            });
        }

        // 初始状态：以 HTML 中 aria-pressed="true" 的按钮为准，未标记时回落到「全部」
        var initial = document.querySelector('[data-log-filter][aria-pressed="true"]');
        apply(initial ? initial.getAttribute('data-log-filter') : 'all');
    }

    function init() {
        initChangelogFilter();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
