/* ============================================================
   冉暖科技 — 产品页页面级交互（js/product.js）
   仅在确实需要页面级交互的产品页按需加载：
     tv.html    — 双端安装包网盘密码解锁
     music.html — 双端安装包网盘密码解锁
   （order.html / epos.html 无页面级交互，不加载本文件）

   设计要点
   1. 渐进增强：HTML 里 <details data-unlock-pwd="…" open> 默认就是展开的，
      JS 未加载 / 被拦截 / 报错时用户依然能直接看到网盘密码。
   2. 零内联事件：全部通过 data-* 钩子绑定。
        data-unlock-link="<repo>"  GitHub 链接，点击时记录访问时间
        data-unlock-pwd="<repo>"   承载密码的 <details>，由 JS 控制展开
      密码行结构固定为 <details data-unlock-pwd> > summary > .pwd-hint-text
      与 p.pwd-reveal > .pwd-text，JS 通过类名定位，不额外增加钩子。
   3. 失败可退化：sessionStorage 不可用（隐私模式 / 被禁用）、超时、键值损坏
      等任何异常都会保留/恢复「展开」状态，密码始终可达，不会静默卡死。
   4. 结构：IIFE + 'use strict'，ES5 语法，无第三方依赖，可重复加载。
   ============================================================ */
(function () {
    'use strict';

    // 重复加载守卫（契约 §3）
    if (window.__ranuanProductInit) { return; }
    window.__ranuanProductInit = true;

    /* ---- 网盘密码注册表 -------------------------------------------------
       键 = <data-page>:<repo>，与页面上的 data-unlock-* 值一一对应。
       密码与 sessionStorage 键沿用改造前的原值，未做任何改动。 */
    var REGISTRY = {
        'tv:desktop':    { storage: 'rannuan_tv_desktop_visit', pwd: 'RR2018' },
        'tv:mobile':     { storage: 'rannuan_tv_mobile_visit',  pwd: 'RR2233' },
        'tv:tv':         { storage: 'rannuan_tv_tv_visit',      pwd: 'RR0000' }, /* TODO: 占位密码，待替换 */
        'music:desktop': { storage: 'rannuan_desktop_visit',    pwd: 'RR2018' },
        'music:mobile':  { storage: 'rannuan_mobile_visit',     pwd: 'RR0926' }
    };

    // 改造前：tv.html 30 分钟、music.html 1 分钟；此处按页保持原值
    var EXPIRE = { tv: 30 * 60 * 1000, music: 60 * 1000 };

    var HINT_LOCKED = {
        tv: '点赞后返回本页自动解锁',
        music: '访问后返回本页自动解锁'
    };

    var page = (document.body && document.body.getAttribute('data-page')) || '';

    /* ---- sessionStorage 安全包装 ---- */
    function storageGet(key) {
        try {
            return window.sessionStorage.getItem(key);
        } catch (e) {
            return null;
        }
    }
    function storageSet(key, value) {
        try {
            window.sessionStorage.setItem(key, value);
            return true;
        } catch (e) {
            return false;
        }
    }
    function storageRemove(key) {
        try {
            window.sessionStorage.removeItem(key);
        } catch (e) { /* 忽略：隐私模式下 removeItem 也可能抛错 */ }
    }

    /* ---- 节点查询 ---- */
    function detailsFor(repo) {
        return document.querySelector('[data-unlock-pwd="' + repo + '"]');
    }
    function hintTextFor(details) {
        return details ? details.querySelector('.pwd-hint-text') : null;
    }

    /* ---- 状态切换 ---- */
    // 解锁：展开密码行
    function unlock(details, repo) {
        if (!details) { return; }
        var entry = REGISTRY[page + ':' + repo];
        var text = details.querySelector('.pwd-text');
        if (entry && text) { text.textContent = entry.pwd; }
        var value = details.querySelector('.pwd-reveal');
        if (value) { value.classList.add('lit'); }
        details.open = true;
        details.classList.add('is-unlocked');
        var hint = hintTextFor(details);
        if (hint) { hint.textContent = '已解锁 · 网盘密码如下'; }
    }

    // 锁定：收起密码行，回到「去 GitHub 点赞」引导
    function lock(details) {
        if (!details) { return; }
        details.open = false;
        details.classList.remove('is-unlocked');
        details.classList.add('is-locked');
        var hint = hintTextFor(details);
        if (hint) { hint.textContent = HINT_LOCKED[page] || '点击展开网盘密码'; }
    }

    /* ---- 主页流程 ---- */
    function init() {
        var detailsList = document.querySelectorAll('[data-unlock-pwd]');
        if (!detailsList.length) { return; }

        var expire = EXPIRE[page] || 30 * 60 * 1000;

        // 刷新页面时清空记录 —— 与改造前行为一致
        var navEntry = null;
        try {
            if (window.performance && performance.getEntriesByType) {
                navEntry = performance.getEntriesByType('navigation')[0];
            }
        } catch (e) { navEntry = null; }
        if (navEntry && navEntry.type === 'reload') {
            detailsList.forEach(function (details) {
                var repo = details.getAttribute('data-unlock-pwd');
                var entry = REGISTRY[page + ':' + repo];
                if (entry) { storageRemove(entry.storage); }
            });
        }

        // 默认收起（无 JS 时 HTML 里是 open 的，密码默认可见）
        detailsList.forEach(lock);

        // GitHub 链接：记录本次访问时间
        document.querySelectorAll('[data-unlock-link]').forEach(function (link) {
            link.addEventListener('click', function () {
                var repo = link.getAttribute('data-unlock-link');
                var entry = REGISTRY[page + ':' + repo];
                if (entry) { storageSet(entry.storage, String(Date.now())); }
            });
        });

        // 检查某 repo 是否处于「刚访问过 GitHub」的有效期内
        function check(repo) {
            var entry = REGISTRY[page + ':' + repo];
            if (!entry) { return; }
            var raw = storageGet(entry.storage);
            if (!raw) { return; }
            var ts = parseInt(raw, 10);
            if (!ts || isNaN(ts) || Date.now() - ts > expire) {
                storageRemove(entry.storage);
                return;
            }
            unlock(detailsFor(repo), repo);
        }

        // 首屏检查一次（用户从 GitHub 返回时命中）
        repos().forEach(check);

        // 从 GitHub 标签页切回来时再检查一次
        window.addEventListener('focus', function () {
            repos().forEach(check);
        });
    }

    // 当前页面注册表中的全部 repo 名
    function repos() {
        return Object.keys(REGISTRY).filter(function (id) {
            return id.indexOf(page + ':') === 0;
        }).map(function (id) {
            return id.slice(page.length + 1);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
