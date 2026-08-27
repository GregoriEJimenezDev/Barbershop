/**
 * copy-dist-to-root.js
 *
 * After `vite build`, the production bundle is in `dist/`.
 * GitHub Pages (when configured to serve from the main branch root)
 * ignores `dist/` and serves whatever is in the repo root.
 *
 * This script copies the contents of `dist/` into the project root so
 * GitHub Pages can serve the compiled app directly, while keeping the
 * source `index.html` (which points to /src/main.jsx) for `npm run dev`.
 *
 * IMPORTANT: the source index.html is preserved via a backup/restore cycle
 * so that dev mode still works after running build.
 */

import { existsSync, copyFileSync, mkdirSync, readdirSync, statSync, unlinkSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';

const root = process.cwd();
const dist = join(root, 'dist');
const sourceHtmlPath = join(root, 'index.html');
const devHtmlBackup = join(root, '.dev-index.html');

if (!existsSync(dist)) {
  console.error('[copy-dist] dist/ does not exist. Run vite build first.');
  process.exit(1);
}

// 1. Save the current (source/dev) index.html as backup
if (existsSync(sourceHtmlPath)) {
  const current = readFileSync(sourceHtmlPath, 'utf-8');
  // Only backup if it looks like the dev HTML (references /src/main.jsx)
  if (current.includes('/src/main.jsx')) {
    copyFileSync(sourceHtmlPath, devHtmlBackup);
    console.log('[copy-dist] Saved dev index.html as .dev-index.html');
  }
}

// 2. Copy all files from dist/ to root
function copyRecursive(srcDir, destDir) {
  const entries = readdirSync(srcDir);
  for (const entry of entries) {
    const srcPath = join(srcDir, entry);
    const destPath = join(destDir, entry);
    const stat = statSync(srcPath);

    if (stat.isDirectory()) {
      if (!existsSync(destPath)) {
        mkdirSync(destPath, { recursive: true });
      }
      copyRecursive(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

copyRecursive(dist, root);
console.log('[copy-dist] Copied dist/ contents to project root');

// 3. Restore the dev index.html so future `npm run dev` works
if (existsSync(devHtmlBackup)) {
  // Only restore if root index.html is now the compiled one
  const current = readFileSync(sourceHtmlPath, 'utf-8');
  if (current.includes('./assets/')) {
    copyFileSync(devHtmlBackup, sourceHtmlPath);
    unlinkSync(devHtmlBackup);
    console.log('[copy-dist] Restored dev index.html for next `npm run dev`');
  }
}

console.log('[copy-dist] Done. GitHub Pages will now serve the compiled bundle.');
