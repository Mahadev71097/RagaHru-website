/* =========================================================================
   HERO STAGE — the three-phone showcase
   -------------------------------------------------------------------------
   Builds the phone composition on the right of the hero and cycles the
   featured template through it.

   The masthead never plays film. Three stills, and nothing else.

   There are two ways to fill them, and the first one wins:

     1. heroPhonePosters in config/site-config.js names three images of your
        own, in assets/hero/posters/. Each phone takes one, in order, and
        they stay put - change a file, and that phone changes. Nothing about
        the catalogue touches them.

     2. With that list empty, the stage falls back to reading the SAME
        registry as the rest of the site (js/templates.js) and cycles the
        featured template through the phones, using each template's own
        poster.

   Either way the phones keep moving between the three positions.
   ========================================================================= */

var HeroStage = (function () {
  'use strict';

  var SLOTS = ['left', 'center', 'right'];
  var ROTATE_MS = 2600;      /* brisk, but still time to read a template */
  var SETTLE_MS = 720;       /* just past the CSS move, so swaps land after  */

  var stage = null;
  var phones = [];
  var slots = [];
  var pool = [];
  var queue = [];
  var timer = null;
  var running = false;
  var fixed = [];            /* the hero's own posters, when it has been given some */

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function brand() {
    return (typeof SITE_CONFIG === 'object' && SITE_CONFIG && SITE_CONFIG.brandName)
      ? SITE_CONFIG.brandName
      : 'RagaHru';
  }

  function esc(value) {
    return String(value === undefined || value === null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* The masthead's own three posters, if they have been set. These are
     deliberately NOT the template posters: the hero is the first thing a
     visitor sees and its artwork should be chosen, not inherited from
     whichever templates happen to be newest. */
  function heroPosters() {
    var cfg = (typeof SITE_CONFIG === 'object' && SITE_CONFIG) ? SITE_CONFIG : {};
    var list = Array.isArray(cfg.heroPhonePosters) ? cfg.heroPhonePosters : [];

    return list.filter(function (src) {
      return typeof src === 'string' && src.length > 0;
    }).slice(0, SLOTS.length);
  }

  /* ---------------------------------------------------------------------
     the pool: every template that actually claims a preview video
     --------------------------------------------------------------------- */

  function buildPool() {
    var registry = (typeof templates !== 'undefined' && Array.isArray(templates)) ? templates : [];

    return registry.filter(function (entry) {
      return entry &&
             typeof entry.previewPath === 'string' &&
             entry.previewPath.length > 0;
    });
  }

  function shuffled(list) {
    var out = list.slice();
    for (var i = out.length - 1; i > 0; i -= 1) {
      var j = Math.floor(Math.random() * (i + 1));
      var swap = out[i];
      out[i] = out[j];
      out[j] = swap;
    }
    return out;
  }

  function onStage(entry) {
    for (var i = 0; i < phones.length; i += 1) {
      if (phones[i].template === entry) { return true; }
    }
    return false;
  }

  /* Never repeats a template that is already on stage, and works through the
     collection before coming back around. */
  function nextTemplate() {
    if (pool.length <= phones.length) { return null; }

    var guard = 0;
    while (guard < pool.length * 2 + 4) {
      guard += 1;

      if (!queue.length) {
        queue = shuffled(pool);
      }

      var candidate = queue.shift();
      if (candidate && !onStage(candidate)) { return candidate; }
    }
    return null;
  }

  /* ---------------------------------------------------------------------
     markup
     --------------------------------------------------------------------- */

  function phoneElement() {
    var wrap = document.createElement('div');
    wrap.className = 'phone hero__phone';
    /* No <video> at all. The masthead is the first thing that loads on the
       page and the last place that should be spending a visitor's data:
       three stills say exactly as much as three films here. */
    wrap.innerHTML = '' +
      '<div class="phone__body">' +
        '<div class="phone__screen">' +
          '<img class="phone__poster" alt="" draggable="false" decoding="async">' +
          '<p class="phone__coming" hidden>Preview<br>coming soon</p>' +
          '<span class="phone__sheen" aria-hidden="true"></span>' +
          '<span class="watermark" aria-hidden="true">' + esc(brand()) + '</span>' +
        '</div>' +
      '</div>' +
      '<span class="phone__shadow" aria-hidden="true"></span>';
    return wrap;
  }

  /* ---------------------------------------------------------------------
     placement
     --------------------------------------------------------------------- */

  function applySlots() {
    for (var i = 0; i < phones.length; i += 1) {
      phones[i].el.setAttribute('data-pos', slots[phones[i].slot]);
    }
  }

  function setTemplate(phone, entry) {
    if (!phone || !entry) { return; }

    phone.template = entry;
    phone.el.setAttribute('data-template', entry.id || entry.name || '');
    Preview.still(phone.screen, { poster: entry.posterPath || '' });
  }

  /* Warm the next poster so the swap is not the first time the browser has
     seen the file. One small image, and only if it is not already known to
     be missing. */
  function warm(entry) {
    if (!entry || !entry.posterPath) { return; }
    if (Preview.isDead && Preview.isDead(entry.posterPath)) { return; }

    var img = new Image();
    img.decoding = 'async';
    img.src = entry.posterPath;
  }

  /* left -> center -> right -> left */
  function rotate() {
    if (!running || phones.length < 2) { return; }

    for (var i = 0; i < phones.length; i += 1) {
      phones[i].slot = (phones[i].slot + 1) % slots.length;
    }
    applySlots();

    /* A chosen set has nothing to swap in. The phones simply carry their own
       poster between the three positions, which is the movement the stage was
       built for in the first place. */
    if (fixed.length) { return; }

    /* The phone that has just arrived at the back takes the next template:
       it is the least prominent now, and it is what the viewer will see
       featured on the following turn. */
    window.setTimeout(function () {
      var entry = nextTemplate();
      if (!entry) { return; }

      for (var i = 0; i < phones.length; i += 1) {
        if (slots[phones[i].slot] === 'left') {
          setTemplate(phones[i], entry);
          break;
        }
      }
      warm(queue.length ? queue[0] : null);
    }, SETTLE_MS);
  }

  function start() {
    if (running || reduced() || phones.length < 2) { return; }
    running = true;
    timer = window.setInterval(rotate, ROTATE_MS);
  }

  function stop() {
    running = false;
    window.clearInterval(timer);
    timer = null;
  }

  /* While a window is being dragged the phones should settle instantly at
     their new size rather than gliding after the cursor. */
  function watchResize() {
    var settle = null;

    window.addEventListener('resize', function () {
      stage.classList.add('is-resizing');
      applySlots();

      window.clearTimeout(settle);
      settle = window.setTimeout(function () {
        stage.classList.remove('is-resizing');
      }, 180);
    }, { passive: true });
  }

  /* nothing should be playing or rotating while the hero is off screen */
  function watchViewport() {
    if (typeof window.IntersectionObserver !== 'function') { return; }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { start(); }
        else { stop(); }
      });
    }, { threshold: 0.15 });

    observer.observe(stage);
  }

  /* ---------------------------------------------------------------------
     init
     --------------------------------------------------------------------- */

  function init() {
    stage = document.getElementById('hero-stage');
    if (!stage) { return; }

    fixed = heroPosters();
    pool = buildPool();

    /* nothing chosen and nothing in the registry: drop the stage rather than
       show empty frames, and let the copy take the full width */
    if (!fixed.length && !pool.length) {
      stage.remove();
      var hero = document.querySelector('.hero');
      if (hero) { hero.classList.add('hero--solo'); }
      return;
    }

    var count = fixed.length ? fixed.length : Math.min(SLOTS.length, pool.length);
    slots = (count === 3) ? SLOTS.slice()
          : (count === 2) ? ['left', 'center']
          : ['center'];

    var picks = [];
    if (!fixed.length) {
      picks = shuffled(pool).slice(0, count);
      queue = shuffled(pool).filter(function (entry) {
        return picks.indexOf(entry) === -1;
      });
    }

    /* centre is built last so it sits on top even before the CSS lands */
    for (var i = 0; i < count; i += 1) {
      var el = phoneElement();
      stage.appendChild(el);

      var phone = {
        el: el,
        screen: el.querySelector('.phone__screen'),
        slot: i,
        template: null
      };

      phones.push(phone);

      if (fixed.length) {
        /* one named image per phone, in the order they are listed */
        el.setAttribute('data-hero-poster', String(i + 1));
        Preview.still(phone.screen, { poster: fixed[i] });
      } else {
        setTemplate(phone, picks[i]);
      }
    }

    applySlots();
    stage.classList.add('is-built');
    watchResize();
    if (!fixed.length) { warm(queue.length ? queue[0] : null); }

    watchViewport();
    start();

    /* a stalled observer must never leave the rotation switched off */
    window.setTimeout(function () {
      if (!running) { start(); }
    }, 2600);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { init: init, start: start, stop: stop };
}());
