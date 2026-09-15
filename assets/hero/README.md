# assets/hero/

The hero background video goes here:

```
assets/hero/hero.mp4
```

That is the only file needed. Drop it in and refresh — nothing else to edit.
The path can be changed with `heroVideo` in `config/site-config.js`.

Put a still beside it as well:

```
assets/hero/hero-poster.jpg
```

It is shown the instant the page opens, so the masthead is never dark while
the film is still arriving, and it is what someone who has asked for reduced
motion sees instead of the loop. Export it as **a frame of the film itself,
at the film's own size** — otherwise the first decoded frame jumps. Named by
`heroPoster` in the same config file.

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
