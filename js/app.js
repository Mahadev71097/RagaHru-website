/* =========================================================================
   RAGAHRU — application
   -------------------------------------------------------------------------
   Builds the whole marketplace from js/templates.js:

     - groups templates into religion collections automatically
     - sorts every collection newest first (createdAt)
     - hides any collection that has no templates
     - builds the WhatsApp enquiry link for each template
     - runs the cinematic large-preview modal
     - applies casual copy protection

   Nothing about the cards is written by hand in index.html.
   ========================================================================= */

(function () {
  'use strict';

  /* ---------------------------------------------------------------------
     configuration guards — the site must never break on a typo
     --------------------------------------------------------------------- */

  var CONFIG = (typeof SITE_CONFIG === 'object' && SITE_CONFIG) ? SITE_CONFIG : {};
  var BRAND = CONFIG.brandName || 'RagaHru';
  var CURRENCY = CONFIG.currencySymbol || '₹';
  var MESSAGE = CONFIG.enquiryMessage || "Hello RagaHru, I would like to enquire about {template} for our wedding. Could you please share the details and the next steps? Thank you.";
  var COLLECTIONS = Array.isArray(CONFIG.collections) && CONFIG.collections.length
    ? CONFIG.collections
    : [
        { key: 'hindu', label: 'Hindu Weddings' },
        { key: 'christian', label: 'Christian Weddings' },
        { key: 'islamic', label: 'Islamic Weddings' }
      ];

  var REGISTRY = (typeof templates !== 'undefined' && Array.isArray(templates)) ? templates : [];

  var byId = {};

  /* ---------------------------------------------------------------------
     small utilities
     --------------------------------------------------------------------- */

  function esc(value) {
    return String(value === undefined || value === null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function money(amount) {
    var number = Number(amount);
    if (!isFinite(number)) { return ''; }

    var formatted;
    try {
      formatted = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(number);
    } catch (err) {
      formatted = String(Math.round(number));
    }
    return CURRENCY + formatted;
  }

  function titleCase(value) {
    var text = String(value || '').replace(/[-_]+/g, ' ').trim();
    if (!text) { return 'Other'; }

    return text.split(/\s+/).map(function (word) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
  }

  function timestamp(value) {
    var parsed = Date.parse(value);
    return isNaN(parsed) ? 0 : parsed;
  }

  /* ---------------------------------------------------------------------
     WhatsApp link
     The message always carries the template name, so an enquiry arrives
     reading as a proper note from a client — and says which design it is
     about before the visitor has typed a word.
     --------------------------------------------------------------------- */

  function whatsappLink(templateName) {
    var text = MESSAGE.replace('{template}', templateName || 'one of your designs');
    var digits = String(CONFIG.whatsappNumber || '').replace(/\D/g, '');
    var base = digits.length >= 8 ? 'https://wa.me/' + digits : 'https://wa.me/';
    return base + '?text=' + encodeURIComponent(text);
  }

  /* ---------------------------------------------------------------------
     data preparation: validate, group by religion, sort newest first
     --------------------------------------------------------------------- */

  function usable(entry) {
    if (!entry || typeof entry !== 'object') { return false; }
    if (!entry.name || !entry.religion) {
      if (window.console && console.warn) {
        console.warn('[RagaHru] Skipping a template without a "name" or "religion":', entry);
      }
      return false;
    }
    return true;
  }

  function grouped() {
    var buckets = {};
    var order = [];
    var i;

    for (i = 0; i < COLLECTIONS.length; i += 1) {
      var key = String(COLLECTIONS[i].key || '').toLowerCase();
      if (!key) { continue; }
      buckets[key] = { key: key, label: COLLECTIONS[i].label || titleCase(key), items: [] };
      order.push(key);
    }

    for (i = 0; i < REGISTRY.length; i += 1) {
      var entry = REGISTRY[i];
      if (!usable(entry)) { continue; }

      var religion = String(entry.religion).trim().toLowerCase();

      /* a religion that is not listed in site-config still gets its own
         section rather than disappearing */
      if (!buckets[religion]) {
        buckets[religion] = { key: religion, label: titleCase(religion), items: [] };
        order.push(religion);
      }

      buckets[religion].items.push(entry);
      byId[entry.id || entry.name] = entry;
    }

    /* newest first */
    for (i = 0; i < order.length; i += 1) {
      buckets[order[i]].items.sort(function (a, b) {
        var diff = timestamp(b.createdAt) - timestamp(a.createdAt);
        if (diff !== 0) { return diff; }
        return String(a.name).localeCompare(String(b.name));
      });
    }

    return order.map(function (key) { return buckets[key]; });
  }

  /* ---------------------------------------------------------------------
     markup
     --------------------------------------------------------------------- */

  /* Icons are inlined rather than loaded as CSS mask images. An external SVG
     used as a mask renders inconsistently across browsers, which left every
     icon invisible; inline paths always draw and inherit currentColor. */
  var ICONS = {
    music: '<svg class="ico" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M9 6.2 20.4 4v2.1L9 8.3z"/><rect x="7.9" y="6.2" width="1.5" height="10.9" rx=".5"/><rect x="18.9" y="4" width="1.5" height="10.2" rx=".5"/><circle cx="6" cy="17.2" r="2.6"/><circle cx="17" cy="14.3" r="2.6"/></svg>',
    rsvp: '<svg class="ico" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M3 4.5h18c.55 0 1 .45 1 1v.6l-9.5 5.5a1 1 0 0 1-1 0L2 6.1v-.6c0-.55.45-1 1-1z"/><path d="M2 8.4v10.1c0 .55.45 1 1 1h18c.55 0 1-.45 1-1V8.4l-9 5.2a1 1 0 0 1-1 0z"/></svg>',
    lang: '<svg class="ico" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M12.87 15.07l-2.54-2.51.03-.03A17.5 17.5 0 0 0 14.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35c-.93-1.03-1.7-2.16-2.31-3.35h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/></svg>',
    play: '<svg class="ico" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M8.4 5.6a.9.9 0 0 1 1.37-.77l8.1 5.1a.9.9 0 0 1 0 1.53l-8.1 5.1A.9.9 0 0 1 8.4 15.8z"/></svg>',
    wa: '<svg class="ico" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.47-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.18-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.91-2.2-.25-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.87 1.22 3.07c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.34M12.05 21.79h-.01c-1.77 0-3.5-.48-5.03-1.38l-.36-.22-3.74.99 1-3.65-.24-.38a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 6.99c0 5.45-4.43 9.89-9.88 9.89m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.15 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.69 1.45c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.17-3.48-8.42"/></svg>'
  };


  function featureItems(entry) {
    var items = [];

    if (entry.music) {
      items.push('<li class="features__item">' + ICONS.music + 'Music</li>');
    }
    if (entry.rsvp) {
      items.push('<li class="features__item">' + ICONS.rsvp + 'RSVP</li>');
    }
    if (entry.multilingual) {
      items.push('<li class="features__item features__item--lang">' + ICONS.lang + 'Languages</li>');
    }
    return items;
  }

  function featuresMarkup(entry, modifier) {
    var items = featureItems(entry);
    if (!items.length) { return ''; }

    return '<ul class="features' + (modifier ? ' ' + modifier : '') + '">' + items.join('') + '</ul>';
  }

  function priceMarkup(entry, modifier) {
    var now = money(entry.price);
    var was = (Number(entry.originalPrice) > Number(entry.price)) ? money(entry.originalPrice) : '';

    return '' +
      '<p class="price' + (modifier ? ' ' + modifier : '') + '">' +
        '<span class="price__from">From</span>' +
        '<span class="price__now">' + esc(now) + '</span>' +
        (was
          ? '<span class="price__was"><span class="visually-hidden">Original price </span>' + esc(was) + '</span>'
          : '') +
      '</p>';
  }

  /* A template counts as new for a configurable window after its createdAt.
     Nothing is hand-flagged: the badge appears and expires on its own. */
  var NEW_FOR_DAYS = isFinite(Number(CONFIG.newForDays)) ? Number(CONFIG.newForDays) : 21;

  function isNew(entry) {
    var added = timestamp(entry.createdAt);
    if (!added) { return false; }

    var age = Date.now() - added;
    return age >= 0 && age <= NEW_FOR_DAYS * 24 * 60 * 60 * 1000;
  }

  function phoneMarkup(entry, collectionLabel, index) {
    var alt = entry.name + ' — ' + collectionLabel.replace(/ Weddings$/i, '') +
              ' wedding website preview';

    /* staggering the drift keeps a row of phones from breathing in unison */
    var drift = (index % 4) * 900;

    return '' +
      '<div class="phone" style="--float-delay:' + drift + 'ms">' +
        '<div class="phone__body">' +
          '<div class="phone__screen"' +
               ' data-video="' + esc(entry.previewPath || '') + '"' +
               ' data-poster="' + esc(entry.posterPath || '') + '">' +
            /* No <video> here. A card never plays one, and an element left
               carrying `autoplay` is exactly the kind of thing that starts
               playing again the day someone gives it a src. */
            /* No loading="lazy" here. The preview engine already holds the
               src back until the card is near the viewport - that IS the
               lazy part - so the native attribute only defers it a second
               time, after the decision to show it has been made. */
            '<img class="phone__poster" alt="' + esc(alt) + '" draggable="false"' +
                 ' decoding="async">' +
            '<p class="phone__coming" hidden>Preview<br>coming soon</p>' +
            '<span class="phone__sheen" aria-hidden="true"></span>' +
            /* The card shows a still, so it has to SAY there is a film to
               watch. The mark is decorative: the whole phone is already the
               button that opens the preview. */
            '<span class="phone__play" aria-hidden="true">' +
              '<svg viewBox="0 0 24 24" fill="currentColor" focusable="false"><path d="M9 6.3a.8.8 0 0 1 1.22-.68l7.2 4.53a.8.8 0 0 1 0 1.36l-7.2 4.53A.8.8 0 0 1 9 15.35z"/></svg>' +
            '</span>' +
            '<span class="watermark" aria-hidden="true">' + esc(BRAND) + '</span>' +
          '</div>' +
        '</div>' +
        '<span class="phone__shadow" aria-hidden="true"></span>' +
      '</div>';
  }

  function cardMarkup(entry, collectionLabel, index) {
    var key = esc(entry.id || entry.name);
    var delay = Math.min(index, 7) * 70;

    return '' +
      '<article class="card reveal" style="--reveal-delay:' + delay + 'ms">' +
        '<button class="card__trigger" type="button" data-template="' + key + '"' +
                ' aria-label="Play the preview of ' + esc(entry.name) + '">' +
          phoneMarkup(entry, collectionLabel, index) +
        '</button>' +
        '<h3 class="card__name">' + esc(entry.name) +
          (isNew(entry) ? '<span class="card__badge">New</span>' : '') +
        '</h3>' +
        '<p class="card__desc selectable">' + esc(entry.description || '') + '</p>' +
        featuresMarkup(entry, '') +
        /* the foot is one block so it can be anchored to the bottom of the
           row: descriptions of different lengths then stop pushing the price
           and the buttons out of line with the card beside them */
        '<div class="card__foot">' +
          priceMarkup(entry, '') +
          '<a class="btn card__cta" href="' + esc(whatsappLink(entry.name)) + '"' +
             ' target="_blank" rel="noopener noreferrer"' +
             ' aria-label="Enquire on WhatsApp about ' + esc(entry.name) + '">' +
            ICONS.wa +
            '<span>Enquire</span>' +
          '</a>' +
          '<button class="link-cta" type="button" data-template="' + key + '"' +
                  ' aria-label="Play the preview of ' + esc(entry.name) + '">' +
            ICONS.play +
            '<span>Play preview</span>' +
          '</button>' +
        '</div>' +
      '</article>';
  }

  /* Every collection is rendered identically. Tone belongs to the page frame
     (the masthead and the footer), never to a religion. */
  function collectionMarkup(collection) {
    var cards = collection.items.map(function (entry, index) {
      return cardMarkup(entry, collection.label, index);
    }).join('');

    var count = collection.items.length;
    var countLabel = count + (count === 1 ? ' Website' : ' Websites');

    return '' +
      '<section class="collection" id="' + esc(collection.key) + '"' +
               ' data-accent="' + esc(collection.key) + '"' +
               ' aria-labelledby="title-' + esc(collection.key) + '">' +
        '<div class="wrap">' +
          '<header class="collection__head reveal">' +
            '<span class="signature" aria-hidden="true"></span>' +
            '<h2 class="collection__title" id="title-' + esc(collection.key) + '">' +
              esc(collection.label) +
            '</h2>' +
            '<span class="collection__rule" aria-hidden="true"></span>' +
            '<span class="collection__count">' + esc(countLabel) + '</span>' +
          '</header>' +
          '<div class="grid">' + cards + '</div>' +
        '</div>' +
      '</section>';
  }

  /* ---------------------------------------------------------------------
     render
     --------------------------------------------------------------------- */

  function render() {
    var host = document.getElementById('collections');
    var empty = document.getElementById('collections-empty');
    if (!host) { return; }

    /* empty collections are dropped entirely — never an empty grid */
    var sections = grouped().filter(function (collection) {
      return collection.items.length > 0;
    });

    if (!sections.length) {
      host.innerHTML = '';
      if (empty) { empty.hidden = false; }
      syncNavigation([]);
      return;
    }

    if (empty) { empty.hidden = true; }
    host.innerHTML = sections.map(collectionMarkup).join('');

    syncNavigation(sections);

    /* hand every phone screen to the preview engine.
       The first row is primed immediately; the rest load as they are reached. */
    var screens = host.querySelectorAll('.phone__screen');
    for (var i = 0; i < screens.length; i += 1) {
      Preview.mount(screens[i], { eager: i < 4 });
    }

    wireCards(host);
    revealOnScroll(host.querySelectorAll('.reveal'));
  }

  /* The navigation is built from the sections that actually rendered, so a
     new collection gets a link without anyone editing index.html, and an
     empty one never leaves a link that scrolls nowhere. The markup in the
     page is the no-script fallback. */
  function syncNavigation(sections) {
    var list = document.querySelector('.site-nav__list');
    if (!list) { return; }

    if (!sections.length) {
      list.innerHTML = '';
      return;
    }

    list.innerHTML = sections.map(function (collection) {
      return '<li><a class="site-nav__link" href="#' + esc(collection.key) + '">' +
             esc(collection.nav || titleCase(collection.key)) +
             '</a></li>';
    }).join('');
  }

  function wireCards(host) {
    var triggers = host.querySelectorAll('.card__trigger, .link-cta');
    for (var i = 0; i < triggers.length; i += 1) {
      triggers[i].addEventListener('click', function (event) {
        var id = event.currentTarget.getAttribute('data-template');
        openModal(id, event.currentTarget);
      });
    }
  }

  /* ---------------------------------------------------------------------
     reveal on scroll (subtle, staggered)
     --------------------------------------------------------------------- */

  function revealOnScroll(nodes) {
    if (!nodes || !nodes.length) { return; }

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced || typeof window.IntersectionObserver !== 'function') {
      for (var n = 0; n < nodes.length; n += 1) { nodes[n].classList.add('is-visible'); }
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    for (var i = 0; i < nodes.length; i += 1) { observer.observe(nodes[i]); }

    /* Safety net. The reveal animation is a nicety; visible content is not.
       If the observer has not reported after a few seconds, show anything
       that is already on screen and leave the rest observed. */
    window.setTimeout(function () {
      for (var j = 0; j < nodes.length; j += 1) {
        var el = nodes[j];
        if (el.classList.contains('is-visible')) { continue; }

        var rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          el.classList.add('is-visible');
          observer.unobserve(el);
        }
      }
    }, 3000);
  }

  /* ---------------------------------------------------------------------
     large preview modal
     --------------------------------------------------------------------- */

  var modal = {
    root: null,
    screen: null,
    large: null,
    sourcePhone: null,
    poster: null,
    video: null,
    lastFocus: null,
    isOpen: false,
    timer: null
  };

  function cacheModal() {
    modal.root = document.getElementById('preview-modal');
    if (!modal.root) { return; }

    modal.screen = modal.root.querySelector('.phone__screen');
    modal.large = modal.root.querySelector('.phone--large');
    modal.poster = document.getElementById('modal-poster');
    modal.video = document.getElementById('modal-video');

    var closers = modal.root.querySelectorAll('[data-modal-close]');
    for (var i = 0; i < closers.length; i += 1) {
      closers[i].addEventListener('click', closeModal);
    }

    document.addEventListener('keydown', function (event) {
      if (!modal.isOpen) { return; }

      if (event.key === 'Escape' || event.key === 'Esc') {
        event.preventDefault();
        closeModal();
        return;
      }

      if (event.key === 'Tab') { trapFocus(event); }
    });
  }

  function focusables() {
    if (!modal.root) { return []; }
    var nodes = modal.root.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    var list = [];
    for (var i = 0; i < nodes.length; i += 1) {
      if (nodes[i].offsetParent !== null || nodes[i] === document.activeElement) {
        list.push(nodes[i]);
      }
    }
    return list;
  }

  function trapFocus(event) {
    var list = focusables();
    if (!list.length) { return; }

    var first = list[0];
    var last = list[list.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /* The modal phone starts life exactly where the card's phone sits, then
     travels to the centre. It is the same object growing, not a new one. */
  function phoneTransformFrom(source, target) {
    if (!source || !target) { return ''; }

    var s = source.getBoundingClientRect();
    var t = target.getBoundingClientRect();
    if (!s.height || !t.height) { return ''; }

    var scale = s.height / t.height;
    var dx = (s.left + s.width / 2) - (t.left + t.width / 2);
    var dy = (s.top + s.height / 2) - (t.top + t.height / 2);

    return 'translate(' + dx + 'px, ' + dy + 'px) scale(' + scale.toFixed(4) + ')';
  }

  function collectionLabelFor(religion) {
    var key = String(religion || '').toLowerCase();
    for (var i = 0; i < COLLECTIONS.length; i += 1) {
      if (String(COLLECTIONS[i].key).toLowerCase() === key) {
        return COLLECTIONS[i].label;
      }
    }
    return titleCase(key);
  }

  function openModal(id, source) {
    var entry = byId[id];
    if (!entry || !modal.root) { return; }

    modal.lastFocus = source || document.activeElement;

    document.getElementById('modal-eyebrow').textContent = collectionLabelFor(entry.religion);
    document.getElementById('modal-title').textContent = entry.name;
    document.getElementById('modal-desc').textContent = entry.description || '';
    var features = document.getElementById('modal-features');
    var items = featureItems(entry);
    features.innerHTML = items.join('');
    features.hidden = items.length === 0;

    document.getElementById('modal-price').textContent = money(entry.price);

    var original = document.getElementById('modal-original');
    if (Number(entry.originalPrice) > Number(entry.price)) {
      original.textContent = money(entry.originalPrice);
      original.hidden = false;
    } else {
      original.textContent = '';
      original.hidden = true;
    }

    var wa = document.getElementById('modal-wa');
    wa.setAttribute('href', whatsappLink(entry.name));
    wa.setAttribute('aria-label', 'Enquire on WhatsApp about ' + entry.name);

    if (modal.poster) {
      modal.poster.alt = entry.name + ' — ' +
        collectionLabelFor(entry.religion).replace(/ Weddings$/i, '') + ' wedding website preview';
    }

    window.clearTimeout(modal.timer);
    modal.root.hidden = false;
    document.body.classList.add('is-locked');
    modal.isOpen = true;

    modal.sourcePhone = (source && source.querySelector)
      ? source.querySelector('.phone')
      : null;

    /* seat the large phone over the card it came from... */
    if (modal.large && !reduced()) {
      var from = phoneTransformFrom(modal.sourcePhone, modal.large);
      if (from) {
        modal.large.style.transition = 'none';
        modal.large.style.transform = from;
        void modal.large.offsetWidth;
        modal.large.style.transition = '';
      }
    }

    /* ...then release it, and let the backdrop and copy come in behind */
    void modal.root.offsetWidth;
    modal.root.classList.add('is-open');
    if (modal.large) { modal.large.style.transform = ''; }

    /* The same safety net the previews carry. Clearing the transform hands
       the move to a transition, and a transition whose first frame is dropped
       - a throttled tab, a stalled compositor - is left PINNED at its start
       value, which here means the phone stranded small and far down the
       panel. Re-targeting it does nothing while the transition holds it, so
       the transition is what has to go. */
    window.setTimeout(function () {
      if (!modal.isOpen || !modal.large) { return; }

      var seated = window.getComputedStyle(modal.large).transform;
      if (seated === 'none' || seated === 'matrix(1, 0, 0, 1, 0, 0)') { return; }

      modal.large.style.transition = 'none';
      modal.large.style.transform = 'none';
      /* committed - now hand the transition back, so closing still glides
         the phone home rather than snapping it */
      void modal.large.offsetWidth;
      modal.large.style.transition = '';
    }, 900);

    Preview.open(modal.screen, {
      src: entry.previewPath || '',
      poster: entry.posterPath || ''
    });

    var closeBtn = modal.root.querySelector('.modal__close');
    if (closeBtn) {
      try { closeBtn.focus({ preventScroll: true }); } catch (err) { closeBtn.focus(); }
    }
  }

  function closeModal() {
    if (!modal.isOpen || !modal.root) { return; }

    modal.isOpen = false;
    modal.root.classList.remove('is-open');
    document.body.classList.remove('is-locked');

    var slow = !reduced();

    if (modal.large && slow) {
      var back = phoneTransformFrom(modal.sourcePhone, modal.large);
      modal.large.style.transform = back;
    }

    modal.timer = window.setTimeout(function () {
      modal.root.hidden = true;
      if (modal.large) {
        modal.large.style.transition = 'none';
        modal.large.style.transform = '';
        void modal.large.offsetWidth;
        modal.large.style.transition = '';
      }
      Preview.close(modal.screen);
    }, slow ? 620 : 0);

    if (modal.lastFocus && typeof modal.lastFocus.focus === 'function') {
      try { modal.lastFocus.focus({ preventScroll: true }); } catch (err) { modal.lastFocus.focus(); }
    }
  }

  /* ---------------------------------------------------------------------
     casual copy protection
     -------------------------------------------------------------------
     This deters casual copying only. Screenshots and screen recording
     remain possible on every device — no website can prevent them.
     Real protection comes from the fact that the marketplace never serves
     the wedding website itself: only a preview video is public.
     --------------------------------------------------------------------- */

  function copyProtection() {
    document.addEventListener('contextmenu', function (event) {
      event.preventDefault();
    });

    document.addEventListener('dragstart', function (event) {
      event.preventDefault();
    });

    document.addEventListener('selectstart', function (event) {
      var node = event.target;
      if (node && node.closest && node.closest('.selectable')) { return; }
      event.preventDefault();
    });

    document.addEventListener('keydown', function (event) {
      var key = String(event.key || '').toLowerCase();
      if ((event.ctrlKey || event.metaKey) && (key === 's' || key === 'u')) {
        event.preventDefault();
      }
    });
  }

  /* ---------------------------------------------------------------------
     header shadow on scroll
     --------------------------------------------------------------------- */

  function stickyHeader() {
    var header = document.querySelector('.site-header');
    if (!header) { return; }

    var hero = document.querySelector('.hero');
    var edge = 0;

    /* The boundary is measured once and re-measured when the layout can
       actually have changed, so the scroll handler stays a comparison and a
       class toggle - cheap enough to run directly, with no frame callback to
       stall and leave the bar in the wrong state. */
    function measure() {
      edge = hero ? (hero.offsetTop + hero.offsetHeight - header.offsetHeight) : 0;
      update();
    }

    function update() {
      var y = window.scrollY || window.pageYOffset || 0;
      var overMasthead = hero ? (y < edge) : false;

      header.classList.toggle('is-over-masthead', overMasthead);
      header.classList.toggle('is-stuck', !overMasthead && y > 8);
      /* Drives the scrim under the bar. At rest the masthead is untouched;
         the moment the page moves, the scrim separates the navigation from
         the hero copy sliding under it. */
      header.classList.toggle('is-scrolled', y > 8);
    }

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);

    /* the hero grows when the display face finally arrives */
    if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
      document.fonts.ready.then(measure).catch(function () {});
    }

    measure();
  }

  /* ---------------------------------------------------------------------
     opening sequence
     The page is held for one frame, then background, wordmark, hero,
     navigation and previews arrive in order. Roughly a second, and the
     page is interactive throughout.
     --------------------------------------------------------------------- */

  function openingSequence() {
    var root = document.documentElement;

    function start() {
      if (!root.classList.contains('is-ready')) {
        root.classList.add('is-ready');
      }
      root.classList.remove('is-booting');
    }

    /* while the season sale is on screen the site holds its entrance */
    if (root.classList.contains('is-sale')) {
      document.addEventListener('ragahru:sale-end', function () {
        window.setTimeout(start, 60);
      });
      window.setTimeout(start, 6000);
      return;
    }

    if (reduced() || typeof window.requestAnimationFrame !== 'function') {
      start();
      return;
    }

    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(start);
    });

    /* nothing may leave the page invisible, whatever happens above */
    window.setTimeout(start, 1200);
  }

  /* ---------------------------------------------------------------------
     boot
     --------------------------------------------------------------------- */

  /* The logo is used only once a real file has actually loaded. Until then
     (and if no file is ever added) the RagaHru wordmark stands in, so the
     brand is never a broken image. */
  function wireLogo() {
    /* The full lockup where there is room for it, the monogram in the bar. */
    fill(CONFIG.logoSources, '[data-logo]:not([data-logo="mark"])', 'has-logo');
    fill(CONFIG.markSources, '[data-logo="mark"]', 'has-mark');

    function fill(sources, selector, flag) {
      var list = Array.isArray(sources) ? sources.slice() : [];
      var slots = document.querySelectorAll(selector);
      if (!list.length || !slots.length) { return; }

      (function attempt(index) {
        if (index >= list.length) { return; }

        var probe = new Image();

        probe.onload = function () {
          for (var i = 0; i < slots.length; i += 1) {
            slots[i].setAttribute('src', list[index]);
          }
          document.documentElement.classList.add(flag);
        };

        probe.onerror = function () { attempt(index + 1); };
        probe.src = list[index];
      }(0));
    }
  }

  /* -------------------------------------------------------------------
     The poster rail.

     The list is laid down twice so the loop has somewhere to land, and the
     track slides by exactly one pass. Both the distance and the duration are
     measured here rather than guessed in CSS: a fixed duration would run the
     posters past at one speed on a phone and a quite different one on a wide
     desktop, because the track is far longer there.
     ------------------------------------------------------------------- */

  var HERO_RAIL_SPEED = 24;        /* px per second - a slow, cinematic drift */

  function buildHeroRail(video, sources) {
    var hero = video.closest ? video.closest('.hero') : document.querySelector('.hero');
    if (!hero) { return; }

    var front = railLayer('hero__rail');
    var back = railLayer('hero__rail hero__rail--back');

    /* the back row starts part-way along, so the two are never in step */
    back.firstChild.style.animationDelay = '-18s';

    video.parentNode.insertBefore(back, video);
    video.parentNode.insertBefore(front, video);
    video.parentNode.removeChild(video);

    var loaded = 0;
    var wanted = front.querySelectorAll('img').length;

    function ready() {
      loaded += 1;
      /* measured once most of the row is in, so the widths are real */
      if (loaded >= Math.min(wanted, sources.length)) { measure(); }
    }

    [front, back].forEach(function (layer) {
      var imgs = layer.querySelectorAll('img');
      for (var i = 0; i < imgs.length; i += 1) {
        imgs[i].addEventListener('load', ready);
        imgs[i].addEventListener('error', ready);
      }
    });

    /* One pass has to be at least as wide as the screen, or the moment it
       has slid away there is nothing behind it yet and a bare strip opens at
       the edge. Ten posters cover a laptop comfortably; a very wide screen,
       or a short one where the posters are small, needs the list laid down
       more than once per pass. That is worked out from the measured width
       rather than assumed. */
    function measure() {
      var width = window.innerWidth || document.documentElement.clientWidth;
      var refilled = false;

      [front, back].forEach(function (layer) {
        var track = layer.firstChild;
        var copies = Number(track.getAttribute('data-copies')) || 2;
        var setWidth = track.scrollWidth / copies;
        if (!setWidth) { return; }

        var wanted = Math.max(2, 2 * Math.ceil(width / setWidth));
        if (wanted !== copies) {
          fill(track, wanted);
          refilled = true;
        }
      });

      /* the refilled tracks are measured on the next pass, not this one */
      if (refilled) {
        window.setTimeout(measure, 60);
        return;
      }

      [front, back].forEach(function (layer) {
        var track = layer.firstChild;
        /* one pass is half the track: the list is always laid an even
           number of times, so the two halves are identical */
        var pass = track.scrollWidth / 2;
        if (!pass) { return; }

        track.style.setProperty('--rail-shift', pass + 'px');
        track.style.setProperty('--rail-seconds', (pass / HERO_RAIL_SPEED).toFixed(2) + 's');
      });

      document.documentElement.classList.add('has-hero-rail');
    }

    /* a stalled `load` must never leave the masthead empty */
    window.setTimeout(function () {
      if (!document.documentElement.classList.contains('has-hero-rail')) { measure(); }
    }, 2200);

    /* Nothing should be drifting while the masthead is off screen. The track
       is a large promoted layer - a few thousand pixels of poster - and there
       is no reason to keep a compositor and a battery busy moving it where
       nobody is looking. */
    if (typeof window.IntersectionObserver === 'function') {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          [front, back].forEach(function (layer) {
            var track = layer.firstChild;
            if (!track) { return; }
            /* '' hands it back to the stylesheet, which runs it */
            track.style.animationPlayState = entry.isIntersecting ? '' : 'paused';
          });
        });
      }, { threshold: 0 }).observe(hero);
    }

    /* the track is sized from the viewport, so a resize re-measures it */
    var settle = null;
    window.addEventListener('resize', function () {
      window.clearTimeout(settle);
      settle = window.setTimeout(measure, 220);
    }, { passive: true });

    /* Lays the list down `copies` times. Always an even number, so the track
       divides into two identical halves and the loop cannot seam. */
    function fill(track, copies) {
      while (track.firstChild) { track.removeChild(track.firstChild); }

      for (var pass = 0; pass < copies; pass += 1) {
        for (var i = 0; i < sources.length; i += 1) {
          var img = document.createElement('img');
          img.className = 'hero__rail-poster';
          img.src = sources[i];
          img.alt = '';
          img.decoding = 'async';
          img.draggable = false;
          /* Every copy after the first points at a URL the browser has
             already fetched, so they cost nothing to leave eager - and a
             lazy image inside a track being moved by a CSS animation can be
             slow to notice it has come into view, which would show as a gap
             sliding through the row. */
          track.appendChild(img);
        }
      }

      track.setAttribute('data-copies', String(copies));
    }

    function railLayer(className) {
      var layer = document.createElement('div');
      layer.className = className;
      layer.setAttribute('aria-hidden', 'true');

      var track = document.createElement('div');
      track.className = 'hero__rail-track';
      fill(track, 2);

      layer.appendChild(track);
      return layer;
    }
  }

  /* Replaces the background film element with a plain image. The hero keeps
     exactly the same layers - the image sits where the film would have, under
     the same tint and bloom - so nothing else about the masthead changes. */
  function showHeroStill(video, src) {
    var img = document.createElement('img');
    img.className = video.className;
    img.id = video.id;
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    img.setAttribute('decoding', 'async');
    img.draggable = false;

    img.addEventListener('load', function () {
      document.documentElement.classList.add('has-hero-video');
    });

    /* a missing still simply leaves the masthead as it is */
    img.addEventListener('error', function () {
      document.documentElement.classList.remove('has-hero-video');
      if (img.parentNode) { img.parentNode.removeChild(img); }
    });

    if (video.parentNode) { video.parentNode.replaceChild(img, video); }
    img.src = src;
  }

  /* The hero film. It is only revealed once a real file has decoded a frame,
     so a missing or broken video leaves the hero exactly as it is rather than
     flashing an empty black box. It pauses off screen, and never loads at all
     for visitors who ask for reduced motion. */
  function wireHeroVideo() {
    var video = document.getElementById('hero-bg');
    if (!video) { return; }

    /* A rail of posters, if one has been given, takes the masthead. It is
       lighter than a film by an order of magnitude and it never stops. */
    var rail = Array.isArray(CONFIG.heroRail) ? CONFIG.heroRail.filter(function (src) {
      return typeof src === 'string' && src.length > 0;
    }) : [];

    if (rail.length) {
      buildHeroRail(video, rail);
      return;
    }

    var src = CONFIG.heroVideo;
    var poster = CONFIG.heroPoster;

    /* Someone who has asked their system for less movement gets the still
       rather than a loop - and rather than nothing at all. */
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if (poster) { showHeroStill(video, poster); }
      else { video.remove(); }
      return;
    }

    /* No film named: the still stands on its own if there is one. */
    if (!src) {
      if (poster) { showHeroStill(video, poster); }
      return;
    }

    /* The still is the film's own poster frame. It costs about 90 KB and
       paints almost at once, so the masthead is warm from the first moment
       while the several megabytes of film are still arriving behind it. The
       first decoded frame then takes its place with nothing to see. */
    if (poster) {
      video.setAttribute('poster', poster);
      document.documentElement.classList.add('has-hero-video');
    }

    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;
    video.playsInline = true;

    video.addEventListener('loadeddata', function () {
      document.documentElement.classList.add('has-hero-video');

      var attempt = video.play();
      if (attempt && attempt.catch) { attempt.catch(function () {}); }

      /* The fade-in is a nicety. A transition can be left pinned at its start
         value if the frame that should run it is dropped, which would leave a
         loaded, playing film invisible behind the ground. Same safety net as
         the template previews use. */
      window.setTimeout(function () {
        if (!video.getAttribute('src')) { return; }
        if (parseFloat(window.getComputedStyle(video).opacity) >= 0.9) { return; }

        video.style.transition = 'none';
        video.style.opacity = '1';
      }, 1600);
    });

    video.addEventListener('error', function () {
      document.documentElement.classList.remove('has-hero-video');
      video.removeAttribute('src');
      video.style.opacity = '';
      video.style.transition = '';
    });

    video.setAttribute('preload', 'auto');
    video.setAttribute('src', src);
    try { video.load(); } catch (err) { /* nothing to do */ }

    /* stop paying for frames once the hero has scrolled away */
    if (typeof window.IntersectionObserver === 'function') {
      var hero = document.querySelector('.hero');
      if (hero) {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (!video.getAttribute('src')) { return; }

            try {
              if (entry.isIntersecting) {
                var resume = video.play();
                if (resume && resume.catch) { resume.catch(function () {}); }
              } else {
                video.pause();
              }
            } catch (err) { /* nothing to do */ }
          });
        }, { threshold: 0.05 }).observe(hero);
      }
    }
  }

  function wireCustomBuild() {
    var price = document.getElementById('custom-price');
    if (price && isFinite(Number(CONFIG.customPrice))) {
      price.textContent = money(CONFIG.customPrice);
    }

    var cta = document.getElementById('custom-wa');
    if (!cta) { return; }

    var text = CONFIG.customMessage || "Hello RagaHru, I would like to enquire about a custom-designed wedding website. Could you please share the details and the next steps? Thank you.";
    var digits = String(CONFIG.whatsappNumber || '').replace(/\D/g, '');
    var base = digits.length >= 8 ? 'https://wa.me/' + digits : 'https://wa.me/';

    cta.setAttribute('href', base + '?text=' + encodeURIComponent(text));
    cta.setAttribute('aria-label', 'Enquire on WhatsApp about a custom wedding website');
  }

  function wireSocial() {
    var instagram = document.getElementById('footer-instagram');
    if (instagram && CONFIG.instagramUrl) {
      instagram.setAttribute('href', CONFIG.instagramUrl);
      instagram.setAttribute('aria-label', 'RagaHru on Instagram');
    }

    var whatsapp = document.getElementById('footer-whatsapp');
    if (whatsapp) {
      var digits = String(CONFIG.whatsappNumber || '').replace(/\D/g, '');
      whatsapp.setAttribute('href', digits.length >= 8 ? 'https://wa.me/' + digits : 'https://wa.me/');
      whatsapp.setAttribute('aria-label', 'Chat with RagaHru on WhatsApp');
    }
  }

  function init() {
    var year = document.getElementById('footer-year');
    if (year) { year.textContent = String(new Date().getFullYear()); }

    wireLogo();
    wireHeroVideo();
    cacheModal();
    render();
    wireCustomBuild();
    wireSocial();
    copyProtection();
    stickyHeader();
    openingSequence();

    revealOnScroll(document.querySelectorAll('.custom .reveal'));

    if (String(CONFIG.whatsappNumber || '').replace(/\D/g, '').length < 8) {
      if (window.console && console.info) {
        console.info('[RagaHru] Add your number to config/site-config.js to complete the WhatsApp links.');
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
