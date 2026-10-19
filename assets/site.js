// Orizo Labs: легкі анімації при прокручуванні. Без JS сторінка повністю видима.
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var auto = '.pcard, .exp > div, .shots4 figure, .bignums > div, .built > div, .orgs > div, .numbers dl > div, .values blockquote, .why-value';
  document.querySelectorAll(auto).forEach(function (el) { el.setAttribute('data-reveal', ''); });
  var els = document.querySelectorAll('[data-reveal]');

  function countUp(dt) {
    var txt = dt.textContent.trim();
    if (!/^\d+$/.test(txt) || reduce) return;
    var end = parseInt(txt, 10), t0 = null, dur = 1200;
    function step(t) {
      if (!t0) t0 = t;
      var k = Math.min((t - t0) / dur, 1);
      dt.textContent = Math.round(end * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if (reduce || !('IntersectionObserver' in window)) {
    els.forEach(function (el) { el.classList.add('in'); });
    return;
  }
  // невелика затримка між сусідніми елементами
  var groups = new Map();
  els.forEach(function (el) {
    var p = el.parentElement, i = groups.get(p) || 0;
    el.style.transitionDelay = Math.min(i * 90, 360) + 'ms';
    groups.set(p, i + 1);
  });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      e.target.querySelectorAll && e.target.querySelectorAll('dt').forEach(countUp);
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  els.forEach(function (el) { io.observe(el); });
})();
