'use strict';
/* CLICKSCAPE v9.5 — app shell scrolling: #view is the scroller, so the header & nav stay put on iOS */
(function () {
  const V = document.getElementById('view'); if (!V) return;
  window.scrollTo = function (a, b) { const y = typeof a === 'object' && a ? a.top : b; if (y != null) V.scrollTop = y; };
  try { Object.defineProperty(window, 'scrollY', { configurable: true, get: () => V.scrollTop }); Object.defineProperty(window, 'pageYOffset', { configurable: true, get: () => V.scrollTop }); } catch (e) { }
  V.addEventListener('scroll', () => window.dispatchEvent(new Event('scroll')), { passive: true });
})();
