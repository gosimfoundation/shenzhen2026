// @ts-check
import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';
import speakerData from './src/json/Speakers.json';

const wordDocumentMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

/** @type {import('vite').Plugin} */
const docxMimePlugin = {
  name: 'gosim-docx-mime',
  configureServer(server) {
    server.middlewares.use((request, response, next) => {
      if (request.url?.split('?')[0].endsWith('.docx')) {
        response.setHeader('Content-Type', wordDocumentMime);
      }
      next();
    });
  },
  configurePreviewServer(server) {
    server.middlewares.use((request, response, next) => {
      if (request.url?.split('?')[0].endsWith('.docx')) {
        response.setHeader('Content-Type', wordDocumentMime);
      }
      next();
    });
  },
};

// https://astro.build/config
export default defineConfig({
  redirects: Object.fromEntries(speakerData.speakers.flatMap((speaker) =>
    (speaker.legacyIds || []).flatMap((id) => ['', '/zh'].map((prefix) => [
      `${prefix}/speakers/${id}/`,
      `${prefix}/speakers/${speaker.id}/`,
    ])),
  )),
  integrations: [sitemap({
    filter: (page) => !new URL(page).pathname.replace(/\/$/, '').endsWith('/sponsors-edit'),
  })],
  site: "https://shenzhen2026.gosim.org/",
  vite: {
    plugins: [docxMimePlugin],
  },
});
