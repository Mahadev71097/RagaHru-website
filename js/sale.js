/* =========================================================================
   SEASON SALE — the opening announcement
   -------------------------------------------------------------------------
   Shown once per browsing session, for about four seconds, then dissolved
   into the site.

   Deliberate choices:
     - session-scoped, not per page view, so a refresh does not replay it
     - skippable by click, Escape, or Enter: an announcement that traps the
       visitor is not luxurious, it is rude
     - reduced motion gets a still card, held briefly
     - if anything throws, the overlay is removed rather than left covering
       the page

   It announces its exit on `document` as `ragahru:sale-end`, which is what
   the opening sequence in app.js waits for.
   ========================================================================= */

var SeasonSale = (function () {
  'use strict';

  var KEY = 'ragahru:sale-seen';
  var HOLD_MS = 2600;   /* brisk: the offer is read, not waited through */
  var EXIT_MS = 700;

  var root = document.documentElement;
  var overlay = null;
  var timer = null;
  var finished = false;

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function seenThisSession() {
    try {
      return window.sessionStorage.getItem(KEY) === '1';
    } catch (err) {
      /* private mode or storage blocked: treat as unseen, but only this load */
      return false;
    }
  }

  function remember() {
    try {
      window.sessionStorage.setItem(KEY, '1');
    } catch (err) { /* nothing to do */ }
  }

  function finish() {
    if (finished) { return; }
    finished = true;

    window.clearTimeout(timer);
    root.classList.remove('is-sale');
    document.body.classList.remove('is-sale-open');

    if (overlay) {
      overlay.classList.add('is-leaving');
      window.setTimeout(function () {
        if (overlay && overlay.parentNode) { overlay.parentNode.removeChild(overlay); }
      }, reduced() ? 0 : EXIT_MS);
    }

    document.dispatchEvent(new CustomEvent('ragahru:sale-end'));
  }

  function onKey(event) {
    if (event.key === 'Escape' || event.key === 'Esc' || event.key === 'Enter') {
      finish();
    }
  }

  function init() {
    overlay = document.getElementById('season-sale');
    if (!overlay) { return; }

    if (seenThisSession()) {
      overlay.parentNode.removeChild(overlay);
      overlay = null;
      document.dispatchEvent(new CustomEvent('ragahru:sale-end'));
      return;
    }

    remember();

    root.classList.add('is-sale');
    document.body.classList.add('is-sale-open');
    overlay.hidden = false;

    /* force a frame so the entry animations actually run */
    void overlay.offsetWidth;
    overlay.classList.add('is-open');

    var skip = document.getElementById('sale-skip');
    if (skip) { skip.addEventListener('click', finish); }
    overlay.addEventListener('click', finish);
    document.addEventListener('keydown', onKey);

    timer = window.setTimeout(finish, reduced() ? 1200 : HOLD_MS);

    /* last resort: the site must never stay behind the announcement */
    window.setTimeout(finish, HOLD_MS + 3000);
  }

  try {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  } catch (err) {
    finish();
  }

  return { finish: finish };
}());
