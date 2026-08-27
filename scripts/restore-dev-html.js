/**
 * restore-dev-html.js
 *
 * Restores the source index.html that points to /src/main.jsx so that
 * `npm run dev` (Vite dev server) works correctly.
 *
 * Run this script BEFORE `npm run dev`.
 */

import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const root = process.cwd();
const indexHtmlPath = join(root, 'index.html');

const SOURCE_HTML = `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
    <meta name="theme-color" content="#1a1a1a" />
    <meta name="description" content="Barberia - Reserva tu cita de forma rapida y facil." />
    <title>Barberia Premium | Reserva tu cita</title>
    <script>
      // GitHub Pages SPA redirect handler
      (function() {
        try {
          var query = window.location.search.slice(1);
          if (query && query.startsWith('/')) {
            var route = query.split('/').slice(1).join('/').replace(/~and~/g, '&');
            var newPath = '/' + route + window.location.hash;
            window.history.replaceState(null, '', newPath);
          }
        } catch (e) {}
      })();
    </script>
  </head>
  <body>
    <noscript>Necesitas habilitar JavaScript.</noscript>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`;

if (existsSync(indexHtmlPath)) {
  console.log('[restore-dev] Writing source index.html (for `npm run dev`)...');
} else {
  console.log('[restore-dev] Creating source index.html...');
}

writeFileSync(indexHtmlPath, SOURCE_HTML, 'utf-8');
console.log('[restore-dev] Done. Now `npm run dev` will work correctly.');
