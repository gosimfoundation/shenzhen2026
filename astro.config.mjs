// @ts-check
import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';

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
  integrations: [sitemap()],
  site: "https://shenzhen2026.gosim.org/",
  vite: {
    plugins: [docxMimePlugin],
  },
});
