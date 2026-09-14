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

  /* Optional hero background video. Drop the file in and it is used; leave
     the folder empty and the hero stays as it is. */
  heroVideo: "assets/hero/hero.mp4",

  /* How long a template carries the NEW badge, in days after createdAt */
  newForDays: 21,

  /* Custom build: a designed-from-scratch wedding website */
  customPrice: 1499,
  customMessage: "Hello RagaHru, I would like to enquire about a custom-designed wedding website. Could you please share the details and the next steps? Thank you.",

  /* Social */
  instagramUrl: "https://www.instagram.com/ragahru?stkn=OG56d3F5OHJvdgrd&utm_source=qr",

  /* The logo file. The first one that loads is used; if none are present the
     refined RagaHru wordmark is shown instead, so nothing ever breaks. */
  logoSources: [
    "assets/logo/ragahru-logo.png",
    "assets/logo/ragahru-logo.jpg",
    "assets/logo/ragahru-logo.webp"
  ],

  /* Section headings, and the order the sections appear in.

     A collection listed here gets this heading and this position. A
     collection that is NOT listed still appears - it is added at the end with
     a heading made from its own name - so the site never hides templates just
     because this list was not updated.

     To add house warming, baby shower or birthday invitations later, create
     templates/<collection>/... , set collection: "<collection>" on the entry,
     and add a line here for a nicer heading: */
  collections: [
    { key: "hindu",     label: "Hindu Weddings" },
    { key: "christian", label: "Christian Weddings" },
    { key: "islamic",   label: "Islamic Weddings" }

    /* , { key: "housewarming", label: "House Warming" } */
    /* , { key: "babyshower",   label: "Baby Shower" }   */
    /* , { key: "birthday",     label: "Birthday" }      */
  ]
};
