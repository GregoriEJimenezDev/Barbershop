/**
 * copy-dist-to-root.js
 *
 * Copies the contents of dist/ to the project root after `vite build`.
 * Required because GitHub Pages is configured to serve from the main
 * branch root, not from the artifact produced by static.yml.
 *
 * IMPORTANT:
 * - This script OVERWRITES index.html with the compiled version
 * - For development (`npm run dev`), restore the source HTML first:
 *     `node scripts/restore-dev-html.js`
 */

import { existsSync, copyFileSync, mkdirSync, readdirSync, statSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const root = process.cwd();
const dist = join(root, 'dist');

if (!existsSync(dist)) {
  console.error('[copy-dist] dist/ does not exist. Run `npm run build:raw` first.');
  process.exit(1);
}

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
console.log('[copy-dist] GitHub Pages will now serve the compiled bundle.');
console.log('');
console.log('⚠️  index.html has been overwritten with the compiled version.');
console.log('   To restore the source HTML for development, run:');
console.log('     node scripts/restore-dev-html.js');
