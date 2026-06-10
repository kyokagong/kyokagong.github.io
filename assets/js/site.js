/* =============================================================
   kyokagong.github.io - Site-level JavaScript
   站点级脚本：跨书导航当前态高亮 + 站点首页交互
   ============================================================= */
(function () {
  'use strict';

  // -------- 1. 跨书导航：根据当前 URL 自动给 .site-nav-link 加 active --------
  function highlightCurrentBook() {
    var path = window.location.pathname;
    // 形如 /books/quantum-computing/index.html  →  slug = quantum-computing
    var match = path.match(/\/books\/([^\/]+)\//);
    if (!match) return;
    var currentSlug = match[1];
    var links = document.querySelectorAll('.site-nav-link');
    links.forEach(function (a) {
      var href = a.getAttribute('href') || '';
      if (href.indexOf('/books/' + currentSlug + '/') !== -1) {
        a.classList.add('active');
      } else {
        a.classList.remove('active');
      }
    });
  }

  // -------- 2. 主题持久化（如果 book.js 还没跑，先把偏好存到 localStorage） --------
  function applyStoredTheme() {
    try {
      var stored = localStorage.getItem('qc-theme');
      if (stored === 'light' || stored === 'dark') {
        document.documentElement.setAttribute('data-theme', stored);
      }
    } catch (e) { /* localStorage 不可用时静默 */ }
  }

  // -------- 启动 --------
  document.addEventListener('DOMContentLoaded', function () {
    applyStoredTheme();
    highlightCurrentBook();
  });
})();
