/* =========================================================================
   HERO STAGE — the three-phone showcase
   -------------------------------------------------------------------------
   Builds the phone composition on the right of the hero and cycles the
   featured template through it.

   It reads the SAME registry as the rest of the site (js/templates.js), so
   adding a template later automatically puts it into the hero rotation.
   Video handling is delegated to Preview (js/preview.js), which already
   knows how to fall back to the poster, and then to "Preview coming soon",
   when a preview.mp4 is missing.

   Only the phones on screen hold a loaded video. The next one in the
   rotation is warmed in a single off-screen element, so a catalogue of
   50-100+ templates never means 50-100+ downloads.
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
  var warmer = null;
  var running = false;

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
    wrap.innerHTML = '' +
      '<div class="phone__body">' +
        '<div class="phone__screen">' +
          '<img class="phone__poster" alt="" draggable="false" decoding="async">' +
          '<video class="phone__video" muted loop playsinline autoplay preload="none"' +
                 ' disablepictureinpicture' +
                 ' controlslist="nodownload noplaybackrate noremoteplayback"></video>' +
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
    Preview.open(phone.screen, {
      src: entry.previewPath || '',
      poster: entry.posterPath || ''
    });
  }

  /* Warm the next video and poster in the background so the swap is not the
     first time the browser has seen the file. */
  function warm(entry) {
    if (!entry) { return; }

    if (entry.posterPath) {
      var img = new Image();
      img.src = entry.posterPath;
    }

    if (!warmer) {
      warmer = document.createElement('video');
      warmer.muted = true;
      warmer.preload = 'auto';
      warmer.setAttribute('playsinline', '');
      warmer.className = 'hero__warmer';
      stage.appendChild(warmer);
    }

    /* Nothing to warm if the engine has already found this file missing -
       otherwise every turn of the rotation asks for it again. */
    if (Preview.isDead && Preview.isDead(entry.previewPath)) { return; }

    if (entry.previewPath && warmer.getAttribute('src') !== entry.previewPath) {
      warmer.setAttribute('src', entry.previewPath);
      try { warmer.load(); } catch (err) { /* nothing to do */ }
    }
  }

  /* left -> center -> right -> left */
  function rotate() {
    if (!running || phones.length < 2) { return; }

    for (var i = 0; i < phones.length; i += 1) {
      phones[i].slot = (phones[i].slot + 1) % slots.length;
    }
    applySlots();

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

  function pauseVideos(pause) {
    for (var i = 0; i < phones.length; i += 1) {
      var video = phones[i].el.querySelector('.phone__video');
      if (!video) { continue; }

      try {
        if (pause) {
          video.pause();
        } else {
          var attempt = video.play();
          if (attempt && attempt.catch) { attempt.catch(function () {}); }
        }
      } catch (err) { /* nothing to do */ }
    }
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
        if (entry.isIntersecting) {
          pauseVideos(false);
          start();
        } else {
          pauseVideos(true);
          stop();
        }
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

    pool = buildPool();

    /* no usable preview anywhere: drop the stage rather than show empty
       frames, and let the copy take the full width */
    if (!pool.length) {
      stage.remove();
      var hero = document.querySelector('.hero');
      if (hero) { hero.classList.add('hero--solo'); }
      return;
    }

    var count = Math.min(3, pool.length);
    slots = (count === 3) ? SLOTS.slice()
          : (count === 2) ? ['left', 'center']
          : ['center'];

    var picks = shuffled(pool).slice(0, count);
    queue = shuffled(pool).filter(function (entry) {
      return picks.indexOf(entry) === -1;
    });

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
      setTemplate(phone, picks[i]);
    }

    applySlots();
    stage.classList.add('is-built');
    watchResize();
    warm(queue.length ? queue[0] : null);

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
