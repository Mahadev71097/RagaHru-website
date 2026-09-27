/* =========================================================================
   RAGAHRU — the finishing layer
   -------------------------------------------------------------------------
   Motion and small conveniences laid over a page that already works without
   them. Loaded after app.js, so the collections are already on the page.

     - smooth, weighted scrolling (Lenis), mouse and trackpad only
     - masked line reveals for the headlines
     - the hero drifts with the pointer and eases away on scroll
     - reading progress and the active collection in the header
     - 3D tilt, glare and a Play cursor over the phones
     - when the floating WhatsApp button is shown
     - reveals for How it works and Questions
     - on a phone, the designs before the custom build

   Every piece is independent and guarded: if one fails, or a browser lacks
   what it needs, that piece simply does not run and the page is unchanged.
   Anyone who has asked their system for less motion gets none of it.
   ========================================================================= */

(function () {
  'use strict';

  var root = document.documentElement;

  function media(query) {
    return window.matchMedia ? window.matchMedia(query) : { matches: false };
  }

  var REDUCED = media('(prefers-reduced-motion: reduce)').matches;
  /* a real mouse or trackpad - never a finger */
  var FINE = media('(hover: hover) and (pointer: fine)').matches;
  var RAF = typeof window.requestAnimationFrame === 'function';

  var lenis = null;

  function clamp(value, min, max) {
    return value < min ? min : (value > max ? max : value);
  }

  function scrollTop() {
    return window.scrollY || window.pageYOffset || 0;
  }

  function safely(name, fn) {
    try { fn(); } catch (err) {
      if (window.console && console.warn) { console.warn('[RagaHru] ' + name + ' skipped:', err); }
    }
  }

  /* ---------------------------------------------------------------------
     smooth scrolling
     Weighted, eased scrolling for the wheel and the trackpad. Touch keeps
     the phone's own scrolling, which is already the best there is.
     --------------------------------------------------------------------- */

  function smoothScroll() {
    if (REDUCED || !FINE || !RAF || typeof window.Lenis !== 'function') { return; }

    lenis = new window.Lenis({
      duration: 1.2,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
      wheelMultiplier: 0.95
    });

    (function frame(time) {
      lenis.raf(time);
      window.requestAnimationFrame(frame);
    }(0));

    /* In-page links glide too, and land clear of the fixed header. */
    document.addEventListener('click', function (event) {
      if (event.defaultPrevented || event.button !== 0 ||
          event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) { return; }

      var link = event.target && event.target.closest ? event.target.closest('a[href^="#"]') : null;
      /* the skip link is for the keyboard, and must move focus natively */
      if (!link || link.classList.contains('skip-link')) { return; }

      var id = link.getAttribute('href').slice(1);
      var target = id ? document.getElementById(id) : null;
      if (!target) { return; }

      event.preventDefault();
      /* the header's bottom edge, which includes the sale bar above it */
      var header = document.querySelector('.site-header');
      var offset = (header ? header.getBoundingClientRect().bottom : 0) + 24;

      lenis.scrollTo(target, { offset: -offset, duration: 1.6 });
      if (window.history && history.replaceState) { history.replaceState(null, '', '#' + id); }
    });

    /* While the preview is open the page underneath holds still. It already
       marks the body, so this just follows that class. */
    var body = document.body;
    function syncLock() {
      var locked = body.classList.contains('is-locked');
      if (locked) { lenis.stop(); } else { lenis.start(); }
    }

    if (typeof window.MutationObserver === 'function') {
      new MutationObserver(syncLock).observe(body, { attributes: true, attributeFilter: ['class'] });
    }
    syncLock();
  }

  /* ---------------------------------------------------------------------
     masked lines
     Wraps a line's content in an inner span so CSS can raise it out of its
     own slot. Done before the entrance starts, so nothing is seen to jump.
     --------------------------------------------------------------------- */

  function mask(element) {
    if (!element || element.classList.contains('is-masked')) { return; }

    var inner = document.createElement('span');
    inner.className = 'line__i';
    while (element.firstChild) { inner.appendChild(element.firstChild); }
    element.appendChild(inner);
    element.classList.add('is-masked');
  }

  function maskLines() {
    if (REDUCED) { return; }

    /* The hero's lines ride the boot timeline. If the entrance has somehow
       already happened there is nothing to animate into, so leave them. */
    if (root.classList.contains('is-booting')) {
      var lines = document.querySelectorAll('.hero__line');
      for (var i = 0; i < lines.length; i += 1) { mask(lines[i]); }
    }

    /* section headlines reveal on scroll, so they can always be masked */
    var headings = document.querySelectorAll('.mask-line:not(.is-visible)');
    for (var j = 0; j < headings.length; j += 1) { mask(headings[j]); }
  }

  /* ---------------------------------------------------------------------
     reveals for the sections this layer adds
     The same contract as app.js: .reveal gains .is-visible on arrival, and
     a timer makes sure nothing on screen can stay hidden.
     --------------------------------------------------------------------- */

  function reveals() {
    var nodes = document.querySelectorAll('.process .reveal, .faq .reveal');
    var steps = document.querySelector('.process__steps');

    if (REDUCED || typeof window.IntersectionObserver !== 'function') {
      for (var n = 0; n < nodes.length; n += 1) { nodes[n].classList.add('is-visible'); }
      if (steps) { steps.classList.add('is-drawn'); }
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        entry.target.classList.add(entry.target === steps ? 'is-drawn' : 'is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });

    for (var i = 0; i < nodes.length; i += 1) { observer.observe(nodes[i]); }
    if (steps) { observer.observe(steps); }

    window.setTimeout(function () {
      var all = Array.prototype.slice.call(nodes);
      if (steps) { all.push(steps); }
      all.forEach(function (el) {
        var rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          el.classList.add(el === steps ? 'is-drawn' : 'is-visible');
        }
      });
    }, 3000);
  }

  /* ---------------------------------------------------------------------
     one scroll loop for everything that follows the scroll position
     --------------------------------------------------------------------- */

  var scrollJobs = [];
  var scrollQueued = false;

  function onScrollFrame() {
    scrollQueued = false;
    var y = scrollTop();
    for (var i = 0; i < scrollJobs.length; i += 1) { scrollJobs[i](y); }
  }

  function queueScroll() {
    if (scrollQueued) { return; }
    scrollQueued = true;
    if (RAF) { window.requestAnimationFrame(onScrollFrame); } else { onScrollFrame(); }
  }

  function startScrollLoop() {
    window.addEventListener('scroll', queueScroll, { passive: true });
    window.addEventListener('resize', queueScroll, { passive: true });
    queueScroll();
  }

  /* ---------------------------------------------------------------------
     header: reading progress and the active collection
     --------------------------------------------------------------------- */

  function header() {
    var bar = document.querySelector('.site-header');
    if (!bar) { return; }

    var line = document.createElement('span');
    line.className = 'scroll-progress';
    line.setAttribute('aria-hidden', 'true');
    bar.appendChild(line);

    scrollJobs.push(function (y) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var progress = max > 0 ? clamp(y / max, 0, 1) : 0;
      line.style.transform = 'scaleX(' + progress.toFixed(4) + ')';
    });

    /* the collection in the middle of the screen is the one the nav marks */
    if (typeof window.IntersectionObserver !== 'function') { return; }

    var sections = document.querySelectorAll('.collection');
    if (!sections.length) { return; }

    function mark(id) {
      var links = document.querySelectorAll('.site-nav__link');
      for (var i = 0; i < links.length; i += 1) {
        var on = !!id && links[i].getAttribute('href') === '#' + id;
        links[i].classList.toggle('is-active', on);
        if (on) { links[i].setAttribute('aria-current', 'true'); }
        else { links[i].removeAttribute('aria-current'); }
      }
    }

    var visible = {};
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        visible[entry.target.id] = entry.isIntersecting;
      });

      var current = '';
      for (var i = 0; i < sections.length; i += 1) {
        if (visible[sections[i].id]) { current = sections[i].id; }
      }
      mark(current);
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    for (var s = 0; s < sections.length; s += 1) { spy.observe(sections[s]); }
  }

  /* ---------------------------------------------------------------------
     the hero: pointer drift and the scroll ease-away
     --------------------------------------------------------------------- */

  function hero() {
    var masthead = document.querySelector('.hero');
    if (!masthead || REDUCED || !RAF) { return; }

    var height = masthead.offsetHeight || 1;
    var mx = 0;
    var my = 0;
    var tx = 0;
    var ty = 0;
    var pending = false;

    function write() {
      pending = false;
      mx += (tx - mx) * 0.075;
      my += (ty - my) * 0.075;

      masthead.style.setProperty('--mx', mx.toFixed(4));
      masthead.style.setProperty('--my', my.toFixed(4));

      if (Math.abs(tx - mx) > 0.0015 || Math.abs(ty - my) > 0.0015) { kick(); }
    }

    function kick() {
      if (pending) { return; }
      pending = true;
      window.requestAnimationFrame(write);
    }

    if (FINE) {
      masthead.addEventListener('pointermove', function (event) {
        var rect = masthead.getBoundingClientRect();
        tx = clamp((event.clientX - rect.left) / rect.width * 2 - 1, -1, 1);
        ty = clamp((event.clientY - rect.top) / rect.height * 2 - 1, -1, 1);
        kick();
      }, { passive: true });

      masthead.addEventListener('pointerleave', function () {
        tx = 0;
        ty = 0;
        kick();
      });
    }

    window.addEventListener('resize', function () {
      height = masthead.offsetHeight || 1;
    }, { passive: true });

    var last = -1;
    scrollJobs.push(function (y) {
      /* past the masthead there is nothing left to move */
      var progress = clamp(y / height, 0, 1);
      if (progress === last) { return; }
      last = progress;
      masthead.style.setProperty('--sp', progress.toFixed(4));
    });
  }

  /* ---------------------------------------------------------------------
     the phones: 3D tilt and glare, for a mouse only
     --------------------------------------------------------------------- */

  function resetTilt(trigger, instant) {
    var phone = trigger.querySelector('.phone');
    if (!phone) { return; }

    trigger.classList.remove('is-tilting');
    if (instant) { phone.style.transition = 'none'; }

    phone.style.removeProperty('--rx');
    phone.style.removeProperty('--ry');

    if (instant) {
      void phone.offsetWidth;
      phone.style.transition = '';
    }
  }

  function tilt() {
    var host = document.getElementById('collections');
    if (!host || REDUCED || !FINE) { return; }

    root.classList.add('luxe-tilt');

    host.addEventListener('pointermove', function (event) {
      if (event.pointerType && event.pointerType !== 'mouse') { return; }

      var trigger = event.target.closest ? event.target.closest('.card__trigger') : null;
      if (!trigger) { return; }

      var phone = trigger.querySelector('.phone');
      if (!phone) { return; }

      var rect = trigger.getBoundingClientRect();
      var px = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      var py = clamp((event.clientY - rect.top) / rect.height, 0, 1);

      trigger.classList.add('is-tilting');
      phone.style.setProperty('--ry', ((px - 0.5) * 16).toFixed(2) + 'deg');
      phone.style.setProperty('--rx', ((0.5 - py) * 11).toFixed(2) + 'deg');
      phone.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
      phone.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
    }, { passive: true });

    host.addEventListener('pointerout', function (event) {
      var trigger = event.target.closest ? event.target.closest('.card__trigger') : null;
      if (!trigger || trigger.contains(event.relatedTarget)) { return; }
      resetTilt(trigger, false);
    });

    /* The preview grows out of the card's phone, measured on click. Standing
       it upright first means it grows from where it really is. Captured, so
       it runs before app.js takes the measurement. */
    host.addEventListener('pointerdown', function (event) {
      var trigger = event.target.closest ? event.target.closest('.card__trigger') : null;
      if (trigger) { resetTilt(trigger, true); }
    }, true);
  }

  /* ---------------------------------------------------------------------
     the Play cursor
     Over a phone the pointer becomes a small glass disc that says what a
     click will do. Everywhere else the system pointer is left alone.
     --------------------------------------------------------------------- */

  function cursor() {
    if (REDUCED || !FINE || !RAF) { return; }

    var triggers = document.querySelectorAll('.card__trigger');
    if (!triggers.length) { return; }

    for (var i = 0; i < triggers.length; i += 1) {
      triggers[i].setAttribute('data-cursor', 'Play');
    }

    var el = document.createElement('div');
    el.className = 'cursor';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<span class="cursor__disc"></span>';
    document.body.appendChild(el);
    root.classList.add('has-cursor');

    var disc = el.firstChild;
    var x = -200;
    var y = -200;
    var tx = x;
    var ty = y;
    var active = false;
    var moving = false;

    function frame() {
      x += (tx - x) * 0.22;
      y += (ty - y) * 0.22;
      el.style.transform = 'translate3d(' + x.toFixed(1) + 'px, ' + y.toFixed(1) + 'px, 0)';

      if (Math.abs(tx - x) > 0.2 || Math.abs(ty - y) > 0.2) {
        window.requestAnimationFrame(frame);
      } else {
        moving = false;
      }
    }

    function setActive(target) {
      var on = !!target && !document.body.classList.contains('is-locked');
      if (on) { disc.textContent = target.getAttribute('data-cursor'); }
      if (on === active) { return; }
      active = on;
      el.classList.toggle('is-active', on);
    }

    document.addEventListener('pointermove', function (event) {
      if (event.pointerType && event.pointerType !== 'mouse') { return; }

      tx = event.clientX;
      ty = event.clientY;

      /* first appearance: start at the pointer, not sliding in from a corner */
      if (!active) {
        x = tx;
        y = ty;
      }

      setActive(event.target.closest ? event.target.closest('[data-cursor]') : null);

      if (!moving) {
        moving = true;
        window.requestAnimationFrame(frame);
      }
    }, { passive: true });

    document.addEventListener('pointerdown', function () { el.classList.add('is-pressed'); });
    document.addEventListener('pointerup', function () { el.classList.remove('is-pressed'); });

    /* opening the preview puts the disc away at once */
    document.addEventListener('click', function () {
      el.classList.remove('is-pressed');
      setActive(null);
    }, true);

    document.documentElement.addEventListener('pointerleave', function () { setActive(null); });
  }

  /* ---------------------------------------------------------------------
     the floating WhatsApp button
     Its link is written by app.js with the other general enquiries; this
     only decides when it is on screen.
     --------------------------------------------------------------------- */

  function whatsapp() {
    var button = document.getElementById('float-wa');
    if (!button) { return; }

    var masthead = document.querySelector('.hero');
    var footer = document.querySelector('.site-footer');
    var shown = false;

    scrollJobs.push(function (y) {
      var pastHero = masthead ? y > masthead.offsetHeight * 0.75 : y > 400;
      /* the footer carries its own WhatsApp link, so the button steps aside */
      var footerIn = footer ? footer.getBoundingClientRect().top < window.innerHeight - 80 : false;
      var show = pastHero && !footerIn;

      if (show !== shown) {
        shown = show;
        button.classList.toggle('is-shown', show);
      }
    });
  }

  /* ---------------------------------------------------------------------
     the footer wordmark rises as the footer arrives
     --------------------------------------------------------------------- */

  function footer() {
    var giant = document.querySelector('.site-footer__giant');
    if (!giant || REDUCED) { return; }

    scrollJobs.push(function () {
      var rect = giant.getBoundingClientRect();
      if (rect.top > window.innerHeight + 200) { return; }
      var progress = clamp(1 - (rect.top - window.innerHeight * 0.55) / (window.innerHeight * 0.45), 0, 1);
      giant.style.setProperty('--fp', progress.toFixed(3));
    });
  }

  /* ---------------------------------------------------------------------
     phone order
     On a desktop the custom build is met before the catalogue, while the
     visitor is still deciding. On a phone that put a full screen of it
     between the masthead and the first design, so there it moves to just
     after the collections - "none of these? have one made". The element is
     really moved rather than reordered with CSS, so the reading and tab
     order always match what is on screen. It moves back when the screen
     widens (a rotation, a resized window).
     --------------------------------------------------------------------- */

  function phoneOrder() {
    var custom = document.querySelector('.custom');
    var collections = document.getElementById('collections');
    var process = document.querySelector('.process');
    if (!custom || !collections || !process || !window.matchMedia) { return; }

    /* where it lives on a desktop: remembered by its next neighbour */
    var home = custom.nextElementSibling;
    var phone = window.matchMedia('(max-width: 600px)');

    function place() {
      /* nothing to put it after if no collection rendered */
      var hasDesigns = !!collections.querySelector('.collection');

      if (phone.matches && hasDesigns) {
        if (custom.nextElementSibling !== process) {
          process.parentNode.insertBefore(custom, process);
          custom.classList.add('is-after-collections');
        }
      } else if (home && custom.nextElementSibling !== home) {
        home.parentNode.insertBefore(custom, home);
        custom.classList.remove('is-after-collections');
      }
    }

    place();
    if (phone.addEventListener) { phone.addEventListener('change', place); }
    else if (phone.addListener) { phone.addListener(place); }
  }

  /* ---------------------------------------------------------------------
     boot
     --------------------------------------------------------------------- */

  function init() {
    safely('phone order', phoneOrder);
    safely('masked lines', maskLines);
    safely('smooth scrolling', smoothScroll);
    safely('reveals', reveals);
    safely('header', header);
    safely('hero motion', hero);
    safely('tilt', tilt);
    safely('cursor', cursor);
    safely('whatsapp', whatsapp);
    safely('footer', footer);
    safely('scroll loop', startScrollLoop);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
