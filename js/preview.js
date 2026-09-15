/* =========================================================================
   PREVIEW MEDIA ENGINE
   -------------------------------------------------------------------------
   Owns every video and poster on the page.

   The rule: NOTHING on the page plays by itself. A card and a hero phone
   show a still. A video is downloaded and played in one place only - the
   large preview a visitor has asked for by opening it. A catalogue of fifty
   templates therefore costs fifty small images to browse, not fifty films.

   What it guarantees:
     - posters are only DOWNLOADED when they come near the viewport
     - a card NEVER requests a video, however long it is looked at
     - a missing poster never breaks anything: an elegant "Preview coming
       soon" state is shown instead
     - a missing preview.mp4 in the large view falls back to the poster
     - the preview runs ONCE and then offers a Play again button, rather than
       turning over for as long as the panel is left open
     - all playback is muted, inline and without native controls

   Public API
     Preview.mount(screenEl)   lazy-loaded card still
     Preview.still(screenEl, { poster })   a still, and only ever a still
     Preview.open(screenEl, { src, poster })   the large view: loads, plays
     Preview.close(screenEl)   stop and release the large view
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
      replay: screen.querySelector('.phone__replay'),
      src: '',
      posterSrc: '',
      requestedSrc: '',
      requested: false,
      failed: false,
      wired: false,
      /* a still-only screen never asks the network for a film */
      stillOnly: true,
      /* a clip that has run its course stays finished */
      ended: false
    };

    store.set(screen, item);
    all.push(item);
    return item;
  }

  function showComingSoon(item) {
    if (item.coming) { item.coming.hidden = false; }
  }

  function showReplay(item, show) {
    if (item.replay) { item.replay.hidden = !show; }
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
  /* The poster is named by convention, but not everyone exports a .jpg. The
     same name is tried as .jpg, .webp and .png so a poster saved in any of
     the three simply works. A miss is remembered, so the alternatives are
     never asked for twice. */
  function posterCandidates(src) {
    var list = [];
    if (!src) { return list; }
    list.push(src);

    var m = String(src).match(/^(.*)\.(jpg|jpeg|png|webp)$/i);
    if (m) {
      var exts = ['jpg', 'webp', 'png'];
      for (var i = 0; i < exts.length; i += 1) {
        var alt = m[1] + '.' + exts[i];
        if (list.indexOf(alt) === -1) { list.push(alt); }
      }
    }
    return list;
  }

  function wirePoster(item) {
    var img = item.poster;
    if (!img) { showComingSoon(item); return; }

    var tries = posterCandidates(item.posterSrc).filter(function (src) {
      return !deadSources[src];
    });

    function ok() {
      img.style.display = '';
      hideComingSoon(item);
    }

    /* "Preview coming soon" is only true when there is nothing to come: if a
       video is on its way, a poster-less screen just stays dark for the
       moment it takes the first frame to decode. */
    function fail() {
      img.style.display = 'none';
      if (item.src && !item.stillOnly) { hideComingSoon(item); } else { showComingSoon(item); }
    }

    function attempt(index) {
      if (index >= tries.length) { fail(); return; }

      var src = tries[index];
      img.onload = ok;
      img.onerror = function () {
        deadSources[src] = true;
        attempt(index + 1);
      };

      hideComingSoon(item);
      img.style.display = '';
      if (img.getAttribute('src') !== src) {
        img.setAttribute('src', src);
      }

      /* the image may already have finished (or failed) before we attached */
      if (img.complete) {
        if (img.naturalWidth > 0) { ok(); }
        else { deadSources[src] = true; attempt(index + 1); }
      }
    }

    if (!tries.length) { fail(); return; }
    attempt(0);
  }

  function wireVideo(item) {
    var video = item.video;
    if (!video || item.wired) { return; }
    item.wired = true;

    video.muted = true;
    video.defaultMuted = true;
    /* Deliberately NOT looping. A loop that has already been downloaded costs
       no more data, but it does keep a decoder, a GPU and a battery busy for
       as long as the panel is open - and a preview that simply stops is a
       calmer thing to watch than one that will not. */
    video.loop = false;
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

    /* Reached the end: stop, and offer it again rather than starting over
       uninvited. Nothing is re-downloaded when they do - the clip is already
       in the element. */
    video.addEventListener('ended', function () {
      item.ended = true;
      showReplay(item, true);
    });

    /* any fresh start hides the offer again */
    video.addEventListener('play', function () {
      item.ended = false;
      showReplay(item, false);
    });

    if (item.replay) {
      item.replay.addEventListener('click', function () {
        showReplay(item, false);
        try { video.currentTime = 0; } catch (err) { /* nothing to do */ }
        var again = video.play();
        if (again && again.catch) { again.catch(function () {}); }
      });
    }

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
    if (!video || item.stillOnly || item.failed || !item.src) { return; }

    /* It has already run once. Coming back to the tab, or scrolling it back
       into view, must not start it over uninvited - that is what the Play
       again button is for. */
    if (item.ended) { return; }

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

    showReplay(item, false);
    item.ended = false;
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
        /* deliberately NOT loadVideo: a card is a still until it is opened */
        if (!item.stillOnly) { loadVideo(item); }
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
      if (item.stillOnly || item.ended || !item.src || item.failed || !item.video) { continue; }
      if (!item.video.getAttribute('src')) { continue; }
      if (onScreen(item.screen)) { play(item); }
    }
  });

  /* ---------------------------------------------------------------------
     public API
     --------------------------------------------------------------------- */

  /* A card in the grid. It shows its poster and nothing else - no video is
     requested, no video plays. The film is reached by opening the template,
     which is what the play button on the card is for. */
  function mount(screen, options) {
    if (!screen) { return; }

    var opts = options || {};
    var item = record(screen);
    item.stillOnly = true;
    item.src = screen.getAttribute('data-video') || '';
    item.posterSrc = screen.getAttribute('data-poster') || '';

    if (supportsIO) {
      buildObservers();

      /* the first row is primed straight away so the top of the page is
         never empty; everything below waits for the observer */
      if (opts.eager) { wirePoster(item); }
      else { loadObserver.observe(screen); }
    } else {
      wirePoster(item);
    }
  }

  /* A screen that is only ever a still - the hero phones. It is handed its
     poster directly rather than reading one off the element, because the
     hero changes which template a phone is showing as it rotates. */
  function still(screen, options) {
    if (!screen) { return; }

    var opts = options || {};
    var item = record(screen);
    item.stillOnly = true;
    item.src = '';
    item.posterSrc = opts.poster || '';
    item.failed = false;
    item.requested = false;

    if (item.video) {
      pause(item);
      item.video.classList.remove('is-ready');
      item.video.removeAttribute('src');
    }

    wirePoster(item);
  }

  function open(screen, options) {
    if (!screen) { return; }

    var item = record(screen);
    var opts = options || {};

    item.stillOnly = false;   /* the large view is the one place film plays */
    item.ended = false;
    showReplay(item, false);
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
    still: still,
    open: open,
    close: close,
    isDead: isDead
  };
}());
