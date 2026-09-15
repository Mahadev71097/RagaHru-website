/* =========================================================================
   SYNC TEMPLATES
   -------------------------------------------------------------------------
   Scans the templates/ folders and adds anything new to js/templates.js.

   NAME THE FOLDER AFTER THE TEMPLATE:

       templates/hindu/HN03/preview/preview.mp4
       templates/hindu/HN03/preview/poster.jpg

   Two letters for the collection, then two digits. That folder name becomes
   the code shown on the card and sent in the WhatsApp enquiry, so there is
   never a question about which folder an enquiry is about.

   Run it after you paste a new template folder in:

       node tools/sync-templates.js

   or just double-click  tools/sync-templates.bat

   Why this exists: a static website cannot read your hard drive. The browser
   only ever receives files it asks for by name, so the page cannot discover a
   folder by itself. This script does the looking, and writes the one line the
   page needs.

   It is careful:
     - existing entries are never touched, reformatted or reordered
     - new entries are inserted at the top of the list with today's date
     - a template whose folder has vanished is reported, never deleted
   ========================================================================= */

'use strict';

var fs = require('fs');
var path = require('path');

var ROOT = path.resolve(__dirname, '..');
var TEMPLATES_DIR = path.join(ROOT, 'templates');
var REGISTRY = path.join(ROOT, 'js', 'templates.js');

/* ---------------------------------------------------------------------- */

function readRegistry() {
  var source = fs.readFileSync(REGISTRY, 'utf8');

  /* run the file in a sandbox to get the array it declares */
  var list;
  try {
    list = new Function(source + '\n;return templates;')();
  } catch (err) {
    console.error('\n  Could not read js/templates.js — is there a typo in it?');
    console.error('  ' + err.message + '\n');
    process.exit(1);
  }

  return { source: source, list: Array.isArray(list) ? list : [] };
}

function scanFolders() {
  if (!fs.existsSync(TEMPLATES_DIR)) { return []; }

  var found = [];

  fs.readdirSync(TEMPLATES_DIR, { withFileTypes: true }).forEach(function (collection) {
    if (!collection.isDirectory()) { return; }

    var collectionDir = path.join(TEMPLATES_DIR, collection.name);

    fs.readdirSync(collectionDir, { withFileTypes: true }).forEach(function (folder) {
      if (!folder.isDirectory()) { return; }

      found.push({
        collection: collection.name,
        folder: folder.name,
        hasVideo: fs.existsSync(path.join(collectionDir, folder.name, 'preview', 'preview.mp4')),
        hasPoster: fs.existsSync(path.join(collectionDir, folder.name, 'preview', 'poster.jpg'))
      });
    });
  });

  return found;
}

/* The folder IS the name, so the folder is the id too: a folder called HN03
   gives id "HN03", which is the code the card and the WhatsApp message will
   carry. Only a folder named some other way needs its collection bolted on
   to stay unique. */
function uniqueId(collection, folder, taken) {
  var base = /^[A-Za-z]{2,4}[-_]?\d{1,3}$/.test(folder)
    ? String(folder).toUpperCase().replace(/[-_]/g, '')
    : (collection + '-' + folder).toLowerCase().replace(/[^a-z0-9-]+/g, '-');

  var id = base;
  var n = 2;

  while (taken.indexOf(id) !== -1) {
    id = base + '-' + n;
    n += 1;
  }
  return id;
}

function today() {
  var d = new Date();
  var pad = function (v) { return String(v).length < 2 ? '0' + v : String(v); };
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

function entryText(entry) {
  return [
    '  {',
    '    id: "' + entry.id + '",',
    /* no name: js/templates.js gives it its code (HN1, CH1, IS1 ...) */
    '    collection: "' + entry.collection + '",',
    '    folder: "' + entry.folder + '",',
    '    description: "' + entry.description + '",',
    '    price: 999,',
    '    originalPrice: 1499,',
    '    music: true,',
    '    rsvp: true,',
    '    multilingual: true,',
    '    createdAt: "' + entry.createdAt + '"',
    '  },',
    ''
  ].join('\n');
}

/* ---------------------------------------------------------------------- */

function main() {
  var registry = readRegistry();
  var onDisk = scanFolders();

  var known = {};
  var takenIds = [];

  registry.list.forEach(function (entry) {
    var collection = entry.collection || entry.religion;
    var folder = entry.folder || entry.id;
    known[collection + '/' + folder] = true;
    if (entry.id) { takenIds.push(entry.id); }
  });

  var added = [];

  onDisk.forEach(function (item) {
    if (known[item.collection + '/' + item.folder]) { return; }

    var id = uniqueId(item.collection, item.folder, takenIds);
    takenIds.push(id);

    added.push({
      id: id,
      collection: item.collection,
      folder: item.folder,
      description: 'A new ' + item.collection + ' invitation. Edit this line.',
      createdAt: today(),
      hasVideo: item.hasVideo,
      hasPoster: item.hasPoster
    });
  });

  /* folders that went away */
  var missing = registry.list.filter(function (entry) {
    var collection = entry.collection || entry.religion;
    var folder = entry.folder || entry.id;

    return !onDisk.some(function (item) {
      return item.collection === collection && item.folder === folder;
    });
  });

  console.log('\n  RagaHru — template sync');
  console.log('  ' + new Array(40).join('-'));
  console.log('  folders found:      ' + onDisk.length);
  console.log('  already listed:     ' + (onDisk.length - added.length));

  if (!added.length) {
    console.log('  nothing new to add.');
  } else {
    var marker = 'const templates = [';
    var at = registry.source.indexOf(marker);

    if (at === -1) {
      console.error('\n  Could not find "const templates = [" in js/templates.js.\n');
      process.exit(1);
    }

    var insertAt = at + marker.length;
    var block = '\n' + added.map(entryText).join('\n');
    var updated = registry.source.slice(0, insertAt) + block + registry.source.slice(insertAt);

    fs.writeFileSync(REGISTRY, updated, 'utf8');

    console.log('  added:              ' + added.length);
    added.forEach(function (entry) {
      console.log('    + ' + entry.collection + '/' + entry.folder +
                  '  ->  ' + entry.id +
                  (entry.hasVideo ? '' : '   (no preview.mp4 yet)') +
                  (entry.hasPoster ? '' : '   (no poster.jpg yet)'));
    });
  }

  if (missing.length) {
    console.log('\n  listed but no folder on disk (left alone, delete by hand if you meant to):');
    missing.forEach(function (entry) {
      console.log('    ? ' + (entry.collection || entry.religion) + '/' +
                  (entry.folder || entry.id));
    });
  }

  /* The poster is what a card actually SHOWS, so a missing one is the more
     urgent of the two: without it the card reads "Preview coming soon" even
     though the film is sitting right there beside it. */
  var noPoster = onDisk.filter(function (item) { return !item.hasPoster; });
  if (noPoster.length) {
    console.log('\n  waiting for a poster.jpg  (the card shows this):');
    noPoster.forEach(function (item) {
      console.log('    - templates/' + item.collection + '/' + item.folder + '/preview/poster.jpg');
    });
  }

  var noVideo = onDisk.filter(function (item) { return !item.hasVideo; });
  if (noVideo.length) {
    console.log('\n  waiting for a preview.mp4:');
    noVideo.forEach(function (item) {
      console.log('    - templates/' + item.collection + '/' + item.folder + '/preview/preview.mp4');
    });
  }

  if (added.length) {
    console.log('\n  Open js/templates.js and edit the description of the new');
    console.log('  entries, then refresh the site. The name is the folder.');
  }
  console.log('');
}

main();
