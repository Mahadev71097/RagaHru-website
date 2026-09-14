/* =========================================================================
   PREVIEW MEDIA ENGINE
   -------------------------------------------------------------------------
   Owns every video and poster on the page.

   What it guarantees:
     - videos are only DOWNLOADED when they come near the viewport
     - videos only PLAY while they are actually on screen, and pause when
       they leave (so 50-100+ templates stay smooth)
     - a missing preview.mp4 never breaks anything: the poster is shown
     - a missing poster.jpg never breaks anything either: an elegant
       "Preview coming soon" state is shown instead
     - all playback is muted, looping, inline and without native controls

   Public API
     Preview.mount(screenEl)   lazy-loaded card preview
     Preview.open(screenEl, { src, poster })   immediate (modal) preview
     Preview.close(screenEl)   stop and release a modal preview
   ========================================================================= */

var Preview = (function () {
  'use strict';

  var store = new WeakMap();
  var all = [];

  /* Sources that have already failed once on this page, keyed by URL rather
     than by element. A 404 is not cached as an answer, so without this the
     hero rotation - which re-opens a preview every few seconds - asks the
     network for the same missing file for as long as the page is left open.
     On a phone that is a steady trickle of data and radio wake-ups for a
     file that was never going to arrive. */
  var deadSources = {};
  var loadObserver = null;
  var playObserver = null;
  var supportsIO = typeof window.IntersectionObserver === 'function';

  /* ---------------------------------------------------------------------
     helpers
     --------------------------------------------------------------------- */

  function record(screen) {
    var item = store.get(screen);
    if (item) { return item; }

    item = {
      screen: screen,
      video: screen.querySelector('.phone__video'),
      poster: screen.querySelector('.phone__poster'),
      coming: screen.querySelector('.phone__coming'),
      src: '',
      posterSrc: '',
      requestedSrc: '',
      requested: false,
      failed: false,
      wired: false
    };

    store.set(screen, item);
    all.push(item);
    return item;
  }

  function showComingSoon(item) {
    if (item.coming) { item.coming.hidden = false; }
  }

  /* What a screen shows when its video will not play: the poster if there is
     a usable one, and otherwise the "Preview coming soon" plate. */
  function fallBack(item) {
    var img = item.poster;
    var posterUsable = img &&
                       img.style.display !== 'none' &&
                       img.complete &&
                       img.naturalWidth > 0;

    if (!posterUsable) { showComingSoon(item); }
  }

  function hideComingSoon(item) {
    if (item.coming) { item.coming.hidden = true; }
  }

  /* The poster is optional. It is only a loading/fallback frame: the video is
     the preview. With no poster and a working video the screen simply stays
     dark until the first frame arrives. */
  function wirePoster(item) {
    var img = item.poster;
    if (!img) { showComingSoon(item); return; }

    function ok() {
      img.style.display = '';
      hideComingSoon(item);
    }

    /* "Preview coming soon" is only true when there is nothing to come: if a
       video is on its way, a poster-less screen just stays dark for the
       moment it takes the first frame to decode. */
    function fail() {
      img.style.display = 'none';
      if (item.src) { hideComingSoon(item); } else { showComingSoon(item); }
    }

    img.onload = ok;
    img.onerror = fail;

    if (!item.posterSrc) { fail(); return; }

    hideComingSoon(item);
    img.style.display = '';

    if (img.getAttribute('src') !== item.posterSrc) {
      img.setAttribute('src', item.posterSrc);
    }

    /* the image may already have finished (or failed) before we attached */
    if (img.complete) {
      if (img.naturalWidth > 0) { ok(); } else { fail(); }
    }
  }

  function wireVideo(item) {
    var video = item.video;
    if (!video || item.wired) { return; }
    item.wired = true;

    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('disablepictureinpicture', '');
    video.setAttribute('controlslist', 'nodownload noplaybackrate noremoteplayback');
    video.controls = false;

    video.addEventListener('loadeddata', function () {
      item.failed = false;
      video.classList.add('is-ready');

      /* The fade-in is a nicety. If the frame that should run it is dropped
         - a backgrounded tab, a stalled compositor - the video would play on
         underneath a poster that never lifts, which looks exactly like a
         static preview. This snaps it up if that happens. */
      window.setTimeout(function () {
        if (item.failed || !video.getAttribute('src')) { return; }
        if (parseFloat(window.getComputedStyle(video).opacity) >= 0.9) { return; }

        /* Both stay. A stalled transition pins the USED value at its start,
           so re-targeting the opacity does nothing and handing the transition
           back re-pins it; the transition has to go. Both are cleared when the
           next clip loads, so a normal fade still happens then. */
        video.style.transition = 'none';
        video.style.opacity = '1';
      }, 1500);
    });

    /* preview.mp4 missing, unsupported or unreachable */
    video.addEventListener('error', function () {
      item.failed = true;

      /* Recorded against the URL that was actually asked for, not item.src,
         which a later open() may already have moved on to. */
      if (item.requestedSrc) { deadSources[item.requestedSrc] = true; }

      video.classList.remove('is-ready');
      video.removeAttribute('src');

      /* Fall back to the poster if there is one. If there is not - a
         video-only template whose video will not load - the screen must say
         so rather than sit blank. */
      fallBack(item);
    });

    video.addEventListener('contextmenu', function (event) {
      event.preventDefault();
    });
  }

  function loadVideo(item) {
    var video = item.video;
    if (!video || item.requested || item.failed || !item.src) { return; }

    /* Already known to be missing: go straight to the placeholder rather
       than ask the network a second time. */
    if (deadSources[item.src]) {
      item.failed = true;
      fallBack(item);
      return;
    }

    item.requested = true;
    item.requestedSrc = item.src;
    video.setAttribute('preload', 'auto');
    video.setAttribute('src', item.src);

    try { video.load(); } catch (err) { /* nothing to do */ }
  }

  function play(item) {
    var video = item.video;
    if (!video || item.failed || !item.src) { return; }

    loadVideo(item);
    /* loadVideo may have just recognised a source that cannot load */
    if (item.failed) { return; }

    video.muted = true;

    var attempt = video.play();
    if (attempt && typeof attempt.catch === 'function') {
      attempt.catch(function () {
        /* autoplay refused (rare when muted) - the poster simply stays up */
      });
    }
  }

  function pause(item) {
    var video = item.video;
    if (!video) { return; }
    try { video.pause(); } catch (err) { /* nothing to do */ }
  }

  function release(item) {
    var video = item.video;
    if (!video) { return; }

    pause(item);
    video.classList.remove('is-ready');
    video.style.opacity = '';
    video.style.transition = '';
    video.removeAttribute('src');
    try { video.load(); } catch (err) { /* nothing to do */ }
    item.requested = false;
  }

  /* ---------------------------------------------------------------------
     observers
     --------------------------------------------------------------------- */

  function buildObservers() {
    if (!supportsIO || loadObserver) { return; }

    /* start downloading a little before the card is reached.
       The poster is loaded here too rather than with loading="lazy", so that
       a missing poster.jpg reliably reports its error and the
       "Preview coming soon" plate can take over. */
    loadObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        var item = store.get(entry.target);
        if (!item) { return; }
        wirePoster(item);
        loadVideo(item);
        loadObserver.unobserve(entry.target);
      });
    }, { root: null, rootMargin: '320px 0px', threshold: 0 });

    /* play only while genuinely on screen */
    playObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var item = store.get(entry.target);
        if (!item) { return; }
        if (entry.isIntersecting) { play(item); } else { pause(item); }
      });
    }, { root: null, threshold: 0.3 });
  }

  function onScreen(element) {
    var rect = element.getBoundingClientRect();
    return rect.bottom > 0 &&
           rect.top < (window.innerHeight || document.documentElement.clientHeight);
  }

  /* Pause everything while the tab is in the background - and start it again
     when the visitor comes back. Without the second half, a preview paused by
     a tab switch stayed frozen on its poster, because the observer never
     fires again for something that never left the viewport. */
  document.addEventListener('visibilitychange', function () {
    var i;

    if (document.hidden) {
      var videos = document.querySelectorAll('.phone__video');
      for (i = 0; i < videos.length; i += 1) {
        try { videos[i].pause(); } catch (err) { /* nothing to do */ }
      }
      return;
    }

    for (i = 0; i < all.length; i += 1) {
      var item = all[i];
      if (!item.src || item.failed || !item.video) { continue; }
      if (!item.video.getAttribute('src')) { continue; }
      if (onScreen(item.screen)) { play(item); }
    }
  });

  /* ---------------------------------------------------------------------
     public API
     --------------------------------------------------------------------- */

  function mount(screen, options) {
    if (!screen) { return; }

    var opts = options || {};
    var item = record(screen);
    item.src = screen.getAttribute('data-video') || '';
    item.posterSrc = screen.getAttribute('data-poster') || '';

    wireVideo(item);

    if (supportsIO) {
      buildObservers();

      /* the first cards are primed straight away so the top of the page is
         never empty; everything below waits for the observer */
      if (opts.eager) {
        wirePoster(item);
        play(item);
      } else {
        loadObserver.observe(screen);
      }

      if (item.src) { playObserver.observe(screen); }
    } else {
      /* very old browser: just load and play, still muted and looping */
      wirePoster(item);
      play(item);
    }
  }

  function open(screen, options) {
    if (!screen) { return; }

    var item = record(screen);
    var opts = options || {};

    item.src = opts.src || '';
    item.posterSrc = opts.poster || '';
    /* A fresh element state, but not a fresh memory: a source this page has
       already seen fail stays failed. */
    item.failed = !!(item.src && deadSources[item.src]);
    item.requested = false;

    if (item.video) {
      item.video.classList.remove('is-ready');
      item.video.removeAttribute('src');
      item.video.style.opacity = '';
      item.video.style.transition = '';
    }

    wireVideo(item);
    wirePoster(item);

    if (item.failed) { fallBack(item); return; }

    play(item);
  }

  function close(screen) {
    if (!screen) { return; }
    var item = store.get(screen);
    if (!item) { return; }
    release(item);
  }

  /* So the hero rotation can skip pre-warming a file that is not there */
  function isDead(src) {
    return !!(src && deadSources[src]);
  }

  return {
    mount: mount,
    open: open,
    close: close,
    isDead: isDead
  };
}());
