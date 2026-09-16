/* Minimal photo slideshow: scroll-snap track, prev/next buttons, live counter. */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('[data-slider]').forEach(function (root) {
    var track = root.querySelector('.sliderTrack');
    var count = track.children.length;
    var current = root.querySelector('[data-current]');
    if (!track || count === 0) return;
    function index() { return Math.round(track.scrollLeft / track.clientWidth); }
    function go(i) {
      i = (i + count) % count;
      track.scrollTo({ left: i * track.clientWidth, behavior: reduce ? 'auto' : 'smooth' });
    }
    root.querySelector('[data-prev]').addEventListener('click', function () { go(index() - 1); });
    root.querySelector('[data-next]').addEventListener('click', function () { go(index() + 1); });
    track.addEventListener('scroll', function () { if (current) current.textContent = index() + 1; }, { passive: true });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(index() + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(index() - 1); }
    });
    window.addEventListener('resize', function () { track.scrollTo({ left: index() * track.clientWidth }); });
  });
})();
