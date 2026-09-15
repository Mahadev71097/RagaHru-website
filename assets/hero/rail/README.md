# assets/hero/rail/ — the posters drifting behind the masthead

A single unbroken row of posters passing slowly across the top of the page,
the way a cinema runs its front-of-house. It loops forever and never seams.

```
poster-01.jpg
poster-02.jpg
...
poster-10.jpg
```

## To change one

Replace the file with your own, **keeping the same name**. Save, refresh, done.

## To add or remove one

Add or remove the line in `heroRail` in `config/site-config.js`. The row
measures itself, so it keeps the same drift speed and the same seamless loop
however many there are — ten, six, or twenty.

## What to export

| | |
| --- | --- |
| Shape | Portrait, **2:3** — the classic poster shape |
| Size | **400 x 600** |
| Format | `.jpg` |
| Weight | Under 50 KB each |

They sit **under** the espresso ground and the warm bloom, so only about a
seventh of each one comes through. They are atmosphere behind the headline,
never the subject — which means they do not need to be sharp, and they must
never be so bright or so busy that the headline has to fight them.

Avoid posters that are mostly white or mostly empty; mid-tone, warm, detailed
images work best at this opacity.

## How the loop works

The list is laid down **twice**, and the row slides left by exactly the width
of one pass. At the end of that slide the second copy is sitting precisely
where the first began, so the jump back to the start cannot be seen.

On a very wide screen, or a short one where the posters are small, one pass
might be narrower than the window — a bare strip would open at the edge. The
row notices and lays the list down more times per pass. Nothing to configure.

Speed is **24 pixels per second**, measured from the real width so a phone and
a wide desktop drift at the same pace. To change it, edit `HERO_RAIL_SPEED`
in `js/app.js`.

Someone who has asked their system for reduced motion sees the row standing
still instead.

## To switch it off

Empty the list in `config/site-config.js`:

```js
heroRail: [],
```

The masthead then falls back to `heroPoster` / `heroVideo` — a still, or the
background film — exactly as it behaved before the rail existed.
