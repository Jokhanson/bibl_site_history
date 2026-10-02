/* Летопись в делах — взаимодействия.
   Появление блоков, закладка прогресса, синхронизация корешка-линейки,
   прерываемый скролл к якорям. */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var revealTargets = document.querySelectorAll('[data-reveal]');

  /* ——— Появление блоков ——— */
  function revealIn(el) {
    el.classList.add('is-in');
  }

  if (!window.IntersectionObserver) {
    revealTargets.forEach(revealIn);
  } else if (reduceMotion) {
    revealTargets.forEach(revealIn);
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            revealIn(entry.target);
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
    );
    revealTargets.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ——— Закладка прогресса чтения (compositor: scaleX + rAF) ——— */
  var progressBar = document.querySelector('.progress__bar');
  if (progressBar && !reduceMotion) {
    var ticking = false;

    function updateProgress() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? window.scrollY / max : 0;
      progressBar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      ticking = false;
    }

    function onScroll() {
      if (ticking) { return; }
      ticking = true;
      requestAnimationFrame(updateProgress);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    updateProgress();
  }

  /* ——— Прерываемый скролл к якорям ——— */
  var ANCHOR_OFFSET = 120;
  if (!reduceMotion && document.documentElement.classList.contains('js')) {
    var scrollToken = null;

    function stopAnimation() {
      if (scrollToken) {
        cancelAnimationFrame(scrollToken);
        scrollToken = null;
      }
      window.removeEventListener('wheel', stopAnimation, { passive: true });
      window.removeEventListener('touchstart', stopAnimation, { passive: true });
      window.removeEventListener('keydown', cancelOnKey, { passive: true });
    }

    function cancelOnKey(e) {
      var k = e.key;
      if (k === 'Tab' || k === 'Enter' || k === ' ' || k.indexOf('Arrow') === 0) {
        stopAnimation();
      }
    }

    function scrollToTarget(target) {
      stopAnimation();
      var startY = window.scrollY;
      var targetY = window.scrollY + target.getBoundingClientRect().top - ANCHOR_OFFSET;
      var maxY = document.documentElement.scrollHeight - window.innerHeight;
      targetY = Math.max(0, Math.min(targetY, maxY));

      var dist = targetY - startY;
      if (Math.abs(dist) < 2) { return; }

      var dur = Math.min(900, Math.max(260, Math.abs(dist) * 0.45));
      var t0 = null;

      function frame(ts) {
        if (t0 === null) { t0 = ts; }
        var p = Math.min(1, (ts - t0) / dur);
        var eased = 1 - Math.pow(1 - p, 4);
        window.scrollTo(0, startY + dist * eased);
        if (p < 1) {
          scrollToken = requestAnimationFrame(frame);
        } else {
          window.scrollTo(0, startY + dist);
          stopAnimation();
        }
      }

      window.addEventListener('wheel', stopAnimation, { passive: true });
      window.addEventListener('touchstart', stopAnimation, { passive: true });
      window.addEventListener('keydown', cancelOnKey, { passive: true });
      scrollToken = requestAnimationFrame(frame);
    }

    [].forEach.call(document.querySelectorAll('a[href^="#"]'), function (link) {
      link.addEventListener('click', function (e) {
        if (link.classList.contains('skip-link') || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
          return;
        }
        var id = link.getAttribute('href').slice(1);
        var target = document.getElementById(id);
        if (!target) { return; }
        e.preventDefault();
        scrollToTarget(target);
        if (!reduceMotion) {
          history.replaceState(null, '', '#' + id);
        }
      });
    });
  }

  /* ——— Синхронизация корешка-линейки с делами ——— */
  var spineItems = document.querySelectorAll('.spine__years li[data-year]');
  if (spineItems.length) {
    var activeKey = null;

    function setActive(key) {
      if (key === activeKey) { return; }
      activeKey = key;
      spineItems.forEach(function (li) {
        li.classList.toggle('is-active', li.dataset.year === key);
      });
    }

    var spineObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            setActive(entry.target.dataset.year);
          }
        });
      },
      { rootMargin: '-20% 0px -65% 0px', threshold: 0 }
    );

    document.querySelectorAll('.case[data-year]').forEach(function (block) {
      spineObserver.observe(block);
    });
  }
})();