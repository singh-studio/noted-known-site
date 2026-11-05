// Marks the elements that should animate once they scroll into view.
// Everything is visible without this script; the styles only hide things when <html class="js"> is set.
(function () {
  // #static shows the finished state straight away (used for screenshots).
  if (location.hash === '#static') document.documentElement.classList.add('static');
  var items = Array.prototype.slice.call(document.querySelectorAll('.hl, .kind'));
  function check() {
    var h = window.innerHeight || document.documentElement.clientHeight;
    items = items.filter(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < h * 0.92 && r.bottom > 0) { el.classList.add('is-in'); return false; }
      return true;
    });
    if (!items.length) {
      clearInterval(timer);
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    }
  }
  window.addEventListener('scroll', check, { passive: true });
  window.addEventListener('resize', check);
  var timer = setInterval(check, 400);
  check();
})();
