# templates/

Preview videos live here, grouped by collection.

```
templates/
    <collection>/
        <folder>/
            preview/
                preview.mp4
```

So the current three are:

```
templates/hindu/template-01/preview/preview.mp4
templates/christian/template-02/preview/preview.mp4
templates/islamic/template-03/preview/preview.mp4
```

## Adding a template to an existing collection

1. Create the folder, e.g. `templates/hindu/template-04/preview/`
2. Put `preview.mp4` inside it
3. Double-click `tools/sync-templates.bat` — it adds the entry for you —
   then edit its name and description in `js/templates.js`

   (Or add the entry by hand with `collection: "hindu"` and
   `folder: "template-04"`.)

You do **not** write the path out. It is built from the collection and the
folder name, so the two can never drift apart.

## Adding a whole new collection

Say you want house-warming invitations:

1. Create `templates/housewarming/template-01/preview/preview.mp4`
2. In `js/templates.js`, set `collection: "housewarming"` on the entry
3. Optionally add a nicer heading in `config/site-config.js`:

   ```js
   { key: "housewarming", label: "House Warming" }
   ```

The new section appears on the page by itself, in the order listed in
site-config. A collection with no templates never renders, so you can create
the folder long before you have anything to put in it.

**Only `preview.mp4` belongs in these folders.** No wedding website HTML, CSS,
JS or images — the marketplace shows video previews and nothing else.
