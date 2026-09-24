/* Летопись в делах — взаимодействия.
   Появление блоков, закладка прогресса, синхронизация корешка-линейки. */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  if (!window.IntersectionObserver) {
    return;
  }

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var revealTargets = document.querySelectorAll('[data-reveal]');

  /* ——— Появление блоков ——— */
  function revealIn(el) {
    el.classList.add('is-in');
  }

  if (reduceMotion) {
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

  /* ——— Закладка прогресса чтения ——— */
  var progressBar = document.querySelector('.progress__bar');
  if (progressBar && !reduceMotion) {
    function onScroll() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? (window.scrollY / max) * 100 : 0;
      progressBar.style.width = p.toFixed(2) + '%';
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ——— Синхронизация корешка-линейки с делами ——— */
  var spineItems = document.querySelectorAll('.spine__years li[data-year]');
  if (spineItems.length) {
    var spine = document.querySelector('.spine');
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