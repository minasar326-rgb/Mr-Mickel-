import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');

if (fs.existsSync(distDir)) {
  const files = fs.readdirSync(distDir);
  for (const file of files) {
    const srcPath = path.join(distDir, file);
    const destPath = path.join(rootDir, file);
    const stat = fs.statSync(srcPath);

    if (stat.isFile()) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied ${file} -> root`);
    } else if (stat.isDirectory()) {
      fs.cpSync(srcPath, destPath, { recursive: true });
      console.log(`Copied directory ${file} -> root`);
    }
  }
  console.log('✅ Successfully synced dist assets to root for GitHub Pages!');
} else {
  console.error('❌ dist directory does not exist! Run vite build first.');
}
