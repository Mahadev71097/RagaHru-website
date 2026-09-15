/* =========================================================================
   TEMPLATE REGISTRY
   -------------------------------------------------------------------------
   This is the single source of truth for the whole marketplace.

   FOLDERS
     Preview videos live at:

         templates/<collection>/<folder>/preview/preview.mp4

     so a template only has to say which collection and which folder it is
     in. The path is built for you and can never drift out of step with the
     folders on disk.

   TO ADD A TEMPLATE
     1. Create   templates/hindu/HN03/preview/
     2. Put      preview.mp4 and poster.jpg inside it
     3. Copy one object below, paste it in, and change the values

   TO ADD A WHOLE NEW COLLECTION (house warming, baby shower, birthday...)
     1. Create   templates/housewarming/HW01/preview/preview.mp4
     2. Set      collection: "housewarming"   on the entry
     3. Optionally give it a nicer heading in config/site-config.js

     The new section appears on the page by itself. An empty collection never
     renders, so the folder can exist long before the video does.

   NAMES
     You do not write them. THE FOLDER IS THE NAME:

         templates/hindu/HN01/      ->  HN01
         templates/hindu/HN02/      ->  HN02
         templates/christian/CH01/  ->  CH01
         templates/islamic/IS01/    ->  IS01

     Two letters for the collection, then two digits. That code is what
     appears under the phone, in the large preview, and in the WhatsApp
     message - so an enquiry names exactly one template, and the folder it
     lives in is obvious from the enquiry itself.

     Name the folder and you have named the template. Nothing renumbers when
     you add or remove one, because nothing is counted: a code that has gone
     out to a client stays put.

     If a folder is NOT named that way, a code is worked out instead from the
     collection's `code` in config/site-config.js and the template's place in
     that collection, oldest first - so an older folder still gets a sensible
     HN01, HN02 without being renamed.

   FIELDS
     id            unique text id, never repeated
     collection    "hindu" | "christian" | "islamic" | anything you add
     folder        the folder name inside that collection
     description   1-2 short lines
     price         selling price, number only
     originalPrice struck-through price, number only
     music         true / false
     rsvp          true / false
     multilingual  true / false  -> shows the highlighted Languages badge
     createdAt     "YYYY-MM-DD"  -> newest first, and drives the NEW badge

   POSTERS
     Every card and every hero phone shows a STILL, never a film. Put the
     still beside the video it belongs to:

         templates/<collection>/<folder>/preview/poster.jpg

     and it is found on its own - .webp and .png are tried too, so whichever
     you export works. The film is downloaded only when a visitor opens the
     large preview, so a page of fifty templates costs fifty small images to
     browse rather than fifty videos.

   OPTIONAL
     previewPath   only if a video sits somewhere off-convention
     posterPath    only if a poster sits somewhere off-convention
     code          only to force a code rather than let it be worked out
   ========================================================================= */

const templates = [
  {
    id: "HN02",
    collection: "hindu",
    folder: "HN02",
    description: "A new hindu invitation. Edit this line.",
    price: 999,
    originalPrice: 1499,
    music: true,
    rsvp: true,
    multilingual: true,
    createdAt: "2026-09-13"
  },

  {
    id: "HN01",
    collection: "hindu",
    folder: "HN01",
    description: "A cinematic South Indian wedding experience with elegant storytelling.",
    price: 999,
    originalPrice: 1499,
    music: true,
    rsvp: true,
    multilingual: true,
    createdAt: "2026-09-09"
  },

  {
    id: "CH01",
    collection: "christian",
    folder: "CH01",
    description: "A refined and romantic wedding experience.",
    price: 999,
    originalPrice: 1499,
    music: true,
    rsvp: false,
    multilingual: true,
    createdAt: "2026-09-08"
  },

  {
    id: "IS01",
    collection: "islamic",
    folder: "IS01",
    description: "An elegant contemporary wedding invitation experience.",
    price: 999,
    originalPrice: 1499,
    music: false,
    rsvp: true,
    multilingual: false,
    createdAt: "2026-09-07"
  }

  /* -----------------------------------------------------------------
     ADD TEMPLATE 04 BY UNCOMMENTING AND EDITING THE BLOCK BELOW.
     Remember the comma after the object above it.

  ,{
    id: "HN03",
    collection: "hindu",
    folder: "HN03",
    description: "A modern Hindu wedding invitation with a quiet, editorial feel.",
    price: 999,
    originalPrice: 1499,
    music: true,
    rsvp: true,
    multilingual: true,
    createdAt: "2026-09-13"
  }
  ----------------------------------------------------------------- */
];

/* -------------------------------------------------------------------------
   Fill in what the convention already implies. Nothing below needs editing.

   - previewPath and posterPath are built from collection + folder, unless
     one was given
   - each template is given its code - from its folder name where that is
     already a code, and otherwise from its collection and its age
   - `religion` is kept as an alias of `collection`, so entries written either
     way keep working
   ------------------------------------------------------------------------- */
(function resolveTemplatePaths(list) {
  if (!Array.isArray(list)) { return; }

  for (var i = 0; i < list.length; i += 1) {
    var entry = list[i];
    if (!entry || typeof entry !== 'object') { continue; }

    var collection = entry.collection || entry.religion;
    var folder = entry.folder || entry.id;

    if (collection) {
      entry.collection = collection;
      entry.religion = collection;
    }

    if (!entry.previewPath && collection && folder) {
      entry.previewPath = 'templates/' + collection + '/' + folder + '/preview/preview.mp4';
    }

    if (!entry.posterPath && collection && folder) {
      entry.posterPath = 'templates/' + collection + '/' + folder + '/preview/poster.jpg';
    }
  }

  /* ---------------------------------------------------------------------
     Codes. Numbered within a collection, OLDEST FIRST, so the first Hindu
     template ever added is HN1 and stays HN1 however many arrive after it.
     The page still shows the newest first; that is the order things are
     read in, not the order they were named in.
     --------------------------------------------------------------------- */
  var config = (typeof SITE_CONFIG === 'object' && SITE_CONFIG) ? SITE_CONFIG : {};
  var defined = Array.isArray(config.collections) ? config.collections : [];

  /* two digits, always: HN1 is written HN01 */
  function pad(value) {
    var n = String(parseInt(value, 10));
    return n.length < 2 ? '0' + n : n;
  }

  /* "HN01" -> "HN01", "hn1" -> "HN01", "template-01" -> "" */
  function codeFromFolder(folder) {
    var match = String(folder || '').match(/^([A-Za-z]{2,4})[-_]?(\d{1,3})$/);
    return match ? match[1].toUpperCase() + pad(match[2]) : '';
  }

  function prefixFor(key) {
    for (var i = 0; i < defined.length; i += 1) {
      if (String(defined[i].key).toLowerCase() === key && defined[i].code) {
        return String(defined[i].code).toUpperCase();
      }
    }
    /* a collection nobody has given a code: first two letters of its name */
    return key.slice(0, 2).toUpperCase();
  }

  function age(entry) {
    var t = Date.parse(entry.createdAt);
    return isNaN(t) ? 0 : t;
  }

  var buckets = {};
  for (var j = 0; j < list.length; j += 1) {
    var item = list[j];
    if (!item || !item.collection) { continue; }
    var key = String(item.collection).toLowerCase();
    if (!buckets[key]) { buckets[key] = []; }
    buckets[key].push(item);
  }

  Object.keys(buckets).forEach(function (key) {
    buckets[key]
      .slice()
      .sort(function (a, b) { return age(a) - age(b); })
      .forEach(function (entry, index) {
        if (!entry.code) {
          /* the folder, where it already says so; otherwise its age */
          entry.code = codeFromFolder(entry.folder) ||
                       (prefixFor(key) + pad(index + 1));
        }
        if (!entry.name) { entry.name = entry.code; }
      });
  });
}(templates));
