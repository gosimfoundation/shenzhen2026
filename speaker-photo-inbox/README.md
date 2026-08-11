# Speaker photo inbox

This folder contains editing copies only for speakers who do not yet have a
finished portrait.

1. Import the latest CFP exports:

   ```bash
   npm run import-speakers -- /path/to/proposals-accepted.json /path/to/speakers-photos.zip
   ```

2. Edit only the JPG files created in this folder.
3. Export each finished portrait as a PNG with the same base filename into
   `public/images/speakers/confirmed/`.
4. Sync the finished files to the website:

   ```bash
   npm run sync-speaker-images
   ```

The import command never deletes or overwrites files in `confirmed`. The sync
command updates the speaker JSON and removes completed editing copies from this
inbox.
