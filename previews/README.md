# previews/ — working folder

This folder is a **staging area for you**, not something the website reads.

Nothing in here is displayed on the marketplace. It is a convenient place to
keep raw screen recordings and exports while you are preparing them.

## The workflow

1. Record or export the raw video of a wedding website here, for example
   `previews/template-04-raw.mov`.
2. Trim it, resize it to **1080 x 1920** and export it as **H.264 MP4**.
3. Move the finished video into the template's own folder:

   ```
   templates/template-04/preview/preview.mp4
   ```

4. Add the template to `js/templates.js` — see the main README, section 3.

The marketplace is video-only: no poster image is needed.

## Recommended export settings

| Setting    | Value                                     |
| ---------- | ----------------------------------------- |
| Resolution | 1080 x 1920                               |
| Aspect     | 9:16 vertical                             |
| Format     | MP4, H.264 video, AAC audio               |
| Frame rate | 30 fps                                    |
| Duration   | 10-20 s (home page), 30-60 s (detailed)   |
| File size  | 2-5 MB ideally, under 8 MB                |
| Audio      | Not needed - previews always play muted   |

Large raw files (`.mov`, `.avi`, `.mkv`, `.prproj`) placed in this folder are
ignored by git — see `.gitignore`.
