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
     1. Create   templates/hindu/template-04/preview/
     2. Put      preview.mp4   inside it
     3. Copy one object below, paste it in, and change the values

   TO ADD A WHOLE NEW COLLECTION (house warming, baby shower, birthday...)
     1. Create   templates/housewarming/template-01/preview/preview.mp4
     2. Set      collection: "housewarming"   on the entry
     3. Optionally give it a nicer heading in config/site-config.js

     The new section appears on the page by itself. An empty collection never
     renders, so the folder can exist long before the video does.

   FIELDS
     id            unique text id, never repeated
     name          shown under the phone, and in the WhatsApp message
     collection    "hindu" | "christian" | "islamic" | anything you add
     folder        the folder name inside that collection
     description   1-2 short lines
     price         selling price, number only
     originalPrice struck-through price, number only
     music         true / false
     rsvp          true / false
     multilingual  true / false  -> shows the highlighted Languages badge
     createdAt     "YYYY-MM-DD"  -> newest first, and drives the NEW badge

   OPTIONAL
     previewPath   only if a video sits somewhere off-convention
     posterPath    a still frame shown while the video loads, or if it fails.
                   This project is video-only, so it is normally left out.
   ========================================================================= */

const templates = [
  {
    id: "hindu-template-05",
    name: "Template 05",
    collection: "hindu",
    folder: "template-05",
    description: "A new hindu invitation. Edit this line.",
    price: 999,
    originalPrice: 1499,
    music: true,
    rsvp: true,
    multilingual: true,
    createdAt: "2026-09-13"
  },

  {
    id: "hindu-01",
    name: "Template 01",
    collection: "hindu",
    folder: "template-01",
    description: "A cinematic South Indian wedding experience with elegant storytelling.",
    price: 999,
    originalPrice: 1499,
    music: true,
    rsvp: true,
    multilingual: true,
    createdAt: "2026-09-09"
  },

  {
    id: "christian-01",
    name: "Template 02",
    collection: "christian",
    folder: "template-02",
    description: "A refined and romantic wedding experience.",
    price: 999,
    originalPrice: 1499,
    music: true,
    rsvp: false,
    multilingual: true,
    createdAt: "2026-09-08"
  },

  {
    id: "islamic-01",
    name: "Template 03",
    collection: "islamic",
    folder: "template-03",
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
    id: "hindu-02",
    name: "Template 04",
    collection: "hindu",
    folder: "template-04",
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

   - previewPath is built from collection + folder, unless one was given
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
  }
}(templates));
