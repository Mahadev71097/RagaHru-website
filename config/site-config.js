/* =========================================================================
   SITE CONFIGURATION
   -------------------------------------------------------------------------
   This is the ONLY file you need to edit to change your contact details.

   whatsappNumber
     Put your WhatsApp number here in FULL INTERNATIONAL FORMAT,
     digits only — no "+", no spaces, no dashes.

     Example for India (country code 91):
         whatsappNumber: "919876543210"

     Until you replace the placeholder below, the WhatsApp buttons still
     work — they simply open WhatsApp with the message pre-filled and let
     the visitor choose the contact.
   ========================================================================= */

const SITE_CONFIG = {
  /* ---- CHANGE THIS ---- */
  whatsappNumber: "919380092620",

  /* Public marketplace brand (used in the header, watermark and footer) */
  brandName: "RagaHru",

  /* Currency symbol used for all prices */
  currencySymbol: "\u20B9",

  /* The message that is pre-filled in WhatsApp.
     {template} is automatically replaced with the template name, so the
     enquiry says which design it is about in its own first line. */
  enquiryMessage: "Hello RagaHru, I would like to enquire about {template} for our wedding. Could you please share the details and the next steps? Thank you.",

  /* THE POSTER RAIL BEHIND THE MASTHEAD
     -----------------------------------------------------------------------
     A single unbroken row of posters drifting slowly across the top of the
     page, the way a cinema runs its front-of-house. It loops forever and
     never seams.

         assets/hero/rail/poster-01.jpg ... poster-10.jpg

     To change one, replace the file with your own of the same name. To add
     or remove one, add or remove a line here - the row measures itself and
     keeps the same drift speed either way.

     Portrait, 2:3 (about 400 x 600). They sit under the espresso ground and
     the warm bloom, so they read as atmosphere, never as the subject.

     Empty this list and the masthead falls back to heroPoster / heroVideo
     below, which is how it behaved before the rail existed. */
  heroRail: [
    "assets/hero/rail/poster-01.jpg",
    "assets/hero/rail/poster-02.jpg",
    "assets/hero/rail/poster-03.jpg",
    "assets/hero/rail/poster-04.jpg",
    "assets/hero/rail/poster-05.jpg",
    "assets/hero/rail/poster-06.jpg",
    "assets/hero/rail/poster-07.jpg",
    "assets/hero/rail/poster-08.jpg",
    "assets/hero/rail/poster-09.jpg",
    "assets/hero/rail/poster-10.jpg"
  ],

  /* The masthead background film, and the still that stands in for it.
     Both are only reached when heroRail above is empty.

     heroPoster is shown the instant the page opens - it is about 90 KB - and
     the film plays over it as soon as it has arrived. Without it the hero
     would sit dark for as long as the several megabytes take to download.
     It is also what someone who has asked their system for less movement
     sees instead of the loop.

     Either may be left empty. No film: the still stays. Neither: the hero
     keeps its own deep tone, which is how the page looked before any of
     this was added. */
  heroPoster: "assets/hero/hero-poster.jpg",
  heroVideo: "assets/hero/hero.mp4",

  /* THE THREE PHONES IN THE MASTHEAD
     -----------------------------------------------------------------------
     One image per phone, in this order: left, centre, right.

         assets/hero/posters/phone-01.jpg
         assets/hero/posters/phone-02.jpg
         assets/hero/posters/phone-03.jpg

     To change what the masthead shows, replace a file with your own of the
     same name. Nothing else needs editing, and the catalogue below is not
     affected - these are the hero's own artwork, not the template posters.

     Portrait, roughly 9:16. About 420px wide is plenty; they are never
     displayed larger than about 200px.

     Empty this list and the masthead goes back to cycling the templates
     from js/templates.js instead. */
  heroPhonePosters: [
    "assets/hero/posters/phone-01.jpg",
    "assets/hero/posters/phone-02.jpg",
    "assets/hero/posters/phone-03.jpg"
  ],

  /* How long a template carries the NEW badge, in days after createdAt */
  newForDays: 21,

  /* Custom build: a designed-from-scratch wedding website */
  customPrice: 1499,
  customMessage: "Hello RagaHru, I would like to enquire about a custom-designed wedding website. Could you please share the details and the next steps? Thank you.",

  /* Social */
  instagramUrl: "https://www.instagram.com/ragahru?stkn=OG56d3F5OHJvdgrd&utm_source=qr",

  /* The brand artwork. The first file that loads is the one used, so the
     lighter WebP is tried first and the PNG catches anything that cannot
     read it. If none are present the refined RagaHru wordmark is shown
     instead, so nothing ever breaks.

     logoSources  the full lockup - monogram, name and line together. It is
                  shown large, on the cream surfaces that suit it: the
                  opening card and the footer.
     markSources  the monogram on its own. The full lockup is unreadable at
                  the height of the bar, and its maroon does not carry on the
                  dark masthead, so the header wears the gold mark beside the
                  RagaHru name instead. */
  logoSources: [
    "assets/logo/ragahru-logo.webp",
    "assets/logo/ragahru-logo.png"
  ],

  markSources: [
    "assets/logo/ragahru-mark.webp",
    "assets/logo/ragahru-mark.png"
  ],

  /* Section headings, and the order the sections appear in.

     A collection listed here gets this heading and this position. A
     collection that is NOT listed still appears - it is added at the end with
     a heading made from its own name - so the site never hides templates just
     because this list was not updated.

     To add house warming, baby shower or birthday invitations later, create
     templates/<collection>/... , set collection: "<collection>" on the entry,
     and add a line here for a nicer heading.

     `code` is the prefix every template in that collection is named with:
     the first Hindu template is HN1, the second HN2, and so on. That code
     appears under the phone and in the WhatsApp message, so an enquiry
     names one template and only one. */
  collections: [
    { key: "hindu",     label: "Hindu Weddings",     code: "HN" },
    { key: "christian", label: "Christian Weddings", code: "CH" },
    { key: "islamic",   label: "Islamic Weddings",   code: "IS" }

    /* , { key: "housewarming", label: "House Warming", code: "HW" } */
    /* , { key: "babyshower",   label: "Baby Shower",   code: "BS" } */
    /* , { key: "birthday",     label: "Birthday",      code: "BD" } */
  ]
};
