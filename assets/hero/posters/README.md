# assets/hero/posters/ — the three phones in the masthead

These are the three images shown in the phones at the top of the page.

```
phone-01.jpg     the LEFT phone
phone-02.jpg     the CENTRE phone
phone-03.jpg     the RIGHT phone
```

## To change one

Replace the file with your own, **keeping the same name**. Save, refresh, and
that phone shows the new image. Nothing else needs editing.

The phones keep drifting between the three positions as they always have, so
an image travels with its phone rather than staying in one spot.

## What to export

| | |
| --- | --- |
| Shape | Portrait, roughly **9:16** |
| Size | About **420 x 840** is plenty |
| Format | `.jpg` — `.png` and `.webp` also work |
| Weight | Aim under 100 KB each |

They are never displayed larger than about 200px wide, so anything bigger than
420px is weight for nothing.

**If you are screenshotting a phone**, crop the status bar off the top first —
the clock and battery look wrong inside a phone mock-up. The three files here
were cut from `assets/hero/hero.mp4` with that strip already removed.

## These are not the template posters

The catalogue further down the page uses each template's own poster, which
lives beside its video:

```
templates/<collection>/<folder>/preview/poster.jpg
```

Changing a file in this folder does **not** affect the catalogue, and adding a
new template does **not** change the masthead. That separation is the point:
the first thing a visitor sees is chosen, not inherited from whichever
templates happen to be newest.

## To go back to the automatic behaviour

Empty the list in `config/site-config.js`:

```js
heroPhonePosters: [],
```

The masthead then cycles the templates from `js/templates.js` again, using
each one's own poster.
