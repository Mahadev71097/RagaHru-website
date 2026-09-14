# assets/hero/

The hero background video goes here:

```
assets/hero/hero.mp4
```

That is the only file needed. Drop it in and refresh — nothing else to edit.
The path can be changed with `heroVideo` in `config/site-config.js`.

## How it behaves

- It sits **behind** the espresso ground, under a warm scrim, so the dual-tone
  colour and the headline legibility are unchanged. The video reads as depth,
  not as a backdrop competing with the type.
- Muted, looping, inline, autoplaying.
- If the file is missing the hero looks exactly as it does today — the plain
  espresso ground. Nothing breaks.
- It pauses when the hero scrolls out of view, and never loads at all for
  visitors who ask for reduced motion.

## What to export

| Setting    | Value                                             |
| ---------- | ------------------------------------------------- |
| Resolution | 1920 x 1080 (landscape — it is a background)      |
| Format     | MP4, H.264                                        |
| Length     | 8-15 s, and make it loop seamlessly               |
| File size  | Keep under 3 MB; it loads on every first visit    |
| Audio      | None needed — it always plays muted               |
| Content    | Slow, soft movement. Fabric, candlelight, florals.
             Anything fast or high-contrast will fight the headline.          |
