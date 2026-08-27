# Speaker photo inbox

This folder contains editing copies only for speakers who do not yet have a
finished portrait.

1. Import the latest CFP exports:

   ```bash
   npm run import-speakers -- /path/to/proposals-accepted.json /path/to/speakers-photos.zip
   ```

2. Edit only the JPG, JPEG, PNG, or WebP files created in this folder.
3. Export each finished portrait as a PNG with the same base filename into
   `public/images/speakers/confirmed/`.
4. Refresh the local page, or include the new PNG in the next deployment. The
   website already looks for the canonical PNG filename and falls back to the
   placeholder while the file is missing.

The optional sync command only removes completed editing copies from this
inbox and normalizes existing JSON records:

   ```bash
   npm run sync-speaker-images
   ```

The import command never deletes or overwrites files in `confirmed`. The sync
command removes completed editing copies from this inbox; it is not required to
make a newly added PNG appear on the website.
