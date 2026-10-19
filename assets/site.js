// Orizo Labs: легкі анімації при прокручуванні. Без JS сторінка повністю видима.
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var auto = '.pcard, .pledges > div, .role, .exp > div, .shots4 figure, .bignums > div, .built > div, .orgs > div, .numbers dl > div, .values blockquote, .why-value, .disc li, .plan, .who > div, .xpanels';
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
  } else {
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
  }
  // перемикач «Чому це важливо»
  document.querySelectorAll('.xtabs').forEach(function (list) {
    var tabs = [].slice.call(list.querySelectorAll('[role=tab]'));
    function pick(t, focus) {
      tabs.forEach(function (b) {
        var on = b === t, p = document.getElementById(b.getAttribute('aria-controls'));
        b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1;
        if (p) { p.hidden = !on; p.classList.toggle('show', on); }
      });
      if (focus) t.focus();
    }
    tabs.forEach(function (b, i) {
      b.addEventListener('click', function () { pick(b); });
      b.addEventListener('keydown', function (e) {
        var k = e.key, n = null;
        if (k === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
        if (k === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (n) { e.preventDefault(); pick(n, true); }
      });
    });
    pick(tabs[0]);
  });

  // смуга прогресу
  var bar = document.querySelector('.progress');
  if (bar) {
    var tick = false;
    var upd = function () { var h = document.documentElement; var max = h.scrollHeight - h.clientHeight; bar.style.transform = 'scaleX(' + (max > 0 ? h.scrollTop / max : 0) + ')'; tick = false; };
    window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
    upd();
  }

  // легкий нахил телефона за курсором
  if (!reduce && window.matchMedia('(hover:hover)').matches) {
    document.querySelectorAll('.xpanel').forEach(function (p) {
      var ph = p.querySelector('.xphone'); if (!ph) return;
      p.addEventListener('mousemove', function (e) {
        var r = p.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        ph.style.transform = 'perspective(900px) rotateY(' + (x * 10) + 'deg) rotateX(' + (-y * 8) + 'deg)';
      });
      p.addEventListener('mouseleave', function () { ph.style.transform = ''; });
    });
  }
})();
