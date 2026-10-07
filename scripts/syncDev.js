import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const sourceHtml = path.resolve(rootDir, 'index.source.html');
const targetHtml = path.resolve(rootDir, 'index.html');

if (fs.existsSync(sourceHtml)) {
  fs.copyFileSync(sourceHtml, targetHtml);
  console.log('✅ Restored index.source.html -> index.html for Vite dev/build');
} else {
  console.warn('⚠️ index.source.html not found, keeping existing index.html');
}
