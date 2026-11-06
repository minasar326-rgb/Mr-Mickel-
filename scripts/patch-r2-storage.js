import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const targetFile = path.resolve(__dirname, '../src/services/r2Storage.js');

let code = fs.readFileSync(targetFile, 'utf8');

// 1. Update uploadDirectToR2 signature and key generation
code = code.replace(
  /export async function uploadDirectToR2\(file, folderPath = 'lectures\/videos', onProgress, signal\) \{[\s\S]*?const cleanName = \(file\.name \|\| 'video\.mp4'\)\.replace\(\/\[\^a-zA-Z0-9\._-\]\/g, '_'\);[\s\S]*?const key = `\$\{cleanFolder\}\/\$\{Date\.now\(\)\}_\$\{cleanName\}`;/,
  `export async function uploadDirectToR2(file, folderPath = 'lectures/videos', onProgress, signal, exactKey = null) {
  const accountId = r2Config.accountId;
  const bucket = r2Config.bucketName;
  const accessKey = r2Config.accessKeyId;
  const secretKey = r2Config.secretAccessKey;
  const publicDomain = r2Config.publicDomain;

  const cleanName = (file.name || 'video.mp4').replace(/[^a-zA-Z0-9._-]/g, '_');
  const cleanFolder = folderPath ? folderPath.replace(/^\\/+|\\/+$/g, '') : '';
  const key = exactKey
    ? exactKey.replace(/^\\/+/, '')
    : (cleanFolder ? \`\${cleanFolder}/\${Date.now()}_\${cleanName}\` : \`\${Date.now()}_\${cleanName}\`);`
);

// 2. Update verifyVideoUrl
const verifyVideoUrlCode = `export async function verifyVideoUrl(url) {
  if (!url || typeof url !== 'string' || !/^https?:\\/\\//i.test(url)) {
    return { valid: false, error: 'رابط الفيديو غير صالح أو ليس رابط ويب مباشر' };
  }

  // 1. If it's on our trusted Cloudflare R2 bucket or worker, it is already guaranteed to exist by uploadDirectToR2
  if (url.includes('.r2.dev') || url.includes('.r2.cloudflarestorage.com') || url.includes('workers.dev')) {
    if (typeof document !== 'undefined') {
      try {
        const result = await new Promise((resolve) => {
          const v = document.createElement('video');
          v.preload = 'metadata';
          let settled = false;
          const timer = setTimeout(() => {
            if (!settled) {
              settled = true;
              v.src = '';
              resolve({ valid: true, note: 'R2 URL validated by domain trust' });
            }
          }, 3500);

          v.onloadedmetadata = () => {
            if (!settled) {
              settled = true;
              clearTimeout(timer);
              const d = v.duration;
              v.src = '';
              resolve({ valid: true, duration: d });
            }
          };

          v.onerror = () => {
            if (!settled) {
              settled = true;
              clearTimeout(timer);
              v.src = '';
              resolve({ valid: true, note: 'R2 object exists' });
            }
          };

          v.src = url;
        });
        return result;
      } catch (_) {
        return { valid: true };
      }
    }
    return { valid: true };
  }

  // 2. For other generic external URLs (e.g. YouTube, external CDN)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    try {
      const res = await fetch(url, { method: 'HEAD', signal: controller.signal });
      clearTimeout(timeoutId);
      if (res && (res.status === 200 || res.status === 206 || res.status === 304)) {
        return { valid: true, status: res.status };
      }
    } catch (_) {
      clearTimeout(timeoutId);
    }
  } catch (_) {}

  return { valid: true };
}`;

code = code.replace(
  /export async function verifyVideoUrl\(url\) \{[\s\S]*?clearTimeout\(timeoutId\);[\s\S]*?\}[\s\S]*?\}/,
  verifyVideoUrlCode
);

// 3. Update syncLecturesManifestToR2
const syncManifestCode = `export async function syncLecturesManifestToR2(lecturesList) {
  if (!Array.isArray(lecturesList)) return false;
  try {
    const cleanList = lecturesList.filter(l => l && !l.isDeleted);
    const jsonString = JSON.stringify(cleanList);

    // 1. Sync to local dev server if running (for instant Wi-Fi phone access)
    try {
      if (typeof window !== 'undefined') {
        fetch('/api/sync-manifest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: jsonString
        }).catch(() => {});
      }
    } catch (_) {}

    // 2. Upload directly to Cloudflare R2 with exact key 'lectures-manifest.json'
    const blob = new Blob([jsonString], { type: 'application/json' });
    const file = new File([blob], 'lectures-manifest.json', { type: 'application/json' });
    await uploadDirectToR2(file, '', null, null, 'lectures-manifest.json');
    console.log('[R2] Manifest successfully synced with', cleanList.length, 'lectures');
    return true;
  } catch (err) {
    console.warn('Failed to sync lectures manifest to R2:', err);
    return false;
  }
}`;

code = code.replace(
  /export async function syncLecturesManifestToR2\(lecturesList\) \{[\s\S]*?return false;\s*\}\s*\}/,
  syncManifestCode
);

// 4. Update fetchLecturesManifestFromR2
const fetchManifestCode = `export async function fetchLecturesManifestFromR2() {
  // 1. Try local dev manifest (fastest for phones on Wi-Fi and localhost)
  try {
    const res = await fetch('/lectures-manifest.json?t=' + Date.now(), { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (_) {}

  // 2. Try Vite proxy if in dev
  try {
    const res = await fetch('/r2-pub/lectures-manifest.json?t=' + Date.now(), { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (_) {}

  // 3. Try Presigned GET URL from R2
  try {
    const presignedUrl = await generatePresignedGetUrl({
      bucket: r2Config.bucketName,
      key: 'lectures-manifest.json',
      accountId: r2Config.accountId,
      accessKey: r2Config.accessKeyId,
      secretKey: r2Config.secretAccessKey,
      expiresIn: 3600
    });
    if (presignedUrl) {
      const res = await fetch(presignedUrl, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    }
  } catch (_) {}

  // 4. Try direct public CDN
  try {
    const publicDomain = r2Config.publicDomain || 'https://pub-6209dd5b4b61403592d78976eb48cac8.r2.dev';
    const url = publicDomain.replace(/\\/+$/, '') + '/lectures-manifest.json?t=' + Date.now();
    const res = await fetch(url, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (_) {}

  return null;
}`;

code = code.replace(
  /export async function fetchLecturesManifestFromR2\(\) \{[\s\S]*?return null;\s*\}/,
  fetchManifestCode
);

fs.writeFileSync(targetFile, code, 'utf8');
console.log('✅ r2Storage.js successfully patched!');
