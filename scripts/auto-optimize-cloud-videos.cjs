process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');
const { spawn } = require('child_process');

const r2Config = {
  accountId: '819fc4abad6f24879c065cd0dac920ed',
  bucketName: 'educational-videos',
  publicDomain: 'https://pub-6209dd5b4b61403592d78976eb48cac8.r2.dev',
  endpoint: 'https://819fc4abad6f24879c065cd0dac920ed.r2.cloudflarestorage.com',
  accessKeyId: '720c71c362801fdd04575a8d62562b49',
  secretAccessKey: '610a605c26d80b82b7958c6da7bd7f44f0df3196b7f2910d87b9e0f3968f1bc8'
};

function generatePresignedPutUrl({ bucket, key, accountId, accessKey, secretKey, expiresIn = 7200 }) {
  const host = `${accountId}.r2.cloudflarestorage.com`;
  const now = new Date();
  const amzDate = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const dateStamp = amzDate.slice(0, 8);
  const region = 'auto';
  const service = 's3';

  const pathStr = '/' + bucket + '/' + key.replace(/^\/+/, '');
  const credential = `${accessKey}/${dateStamp}/${region}/${service}/aws4_request`;

  const queryParams = [
    'X-Amz-Algorithm=AWS4-HMAC-SHA256',
    'X-Amz-Credential=' + encodeURIComponent(credential),
    'X-Amz-Date=' + amzDate,
    'X-Amz-Expires=' + expiresIn,
    'X-Amz-SignedHeaders=host'
  ].sort().join('&');

  const canonicalHeaders = 'host:' + host + '\n';
  const signedHeaders = 'host';
  const canonicalRequest = 'PUT\n' + pathStr + '\n' + queryParams + '\n' + canonicalHeaders + '\n' + signedHeaders + '\nUNSIGNED-PAYLOAD';

  const crHash = crypto.createHash('sha256').update(canonicalRequest).digest('hex');
  const stringToSign = 'AWS4-HMAC-SHA256\n' + amzDate + '\n' + dateStamp + '/' + region + '/' + service + '/aws4_request\n' + crHash;

  function hmac(k, d) {
    return crypto.createHmac('sha256', k).update(d).digest();
  }

  const kDate = hmac('AWS4' + secretKey, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, 'aws4_request');
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

  return `https://${host}${pathStr}?${queryParams}&X-Amz-Signature=${signature}`;
}

async function uploadFileToR2(filePath, r2Key, contentType = 'video/mp4') {
  const fileStats = fs.statSync(filePath);
  const fileStream = fs.createReadStream(filePath);
  const presignedUrl = generatePresignedPutUrl({
    bucket: r2Config.bucketName,
    key: r2Key,
    accountId: r2Config.accountId,
    accessKey: r2Config.accessKeyId,
    secretKey: r2Config.secretAccessKey
  });

  return new Promise((resolve, reject) => {
    const u = new URL(presignedUrl);
    const req = https.request({
      protocol: u.protocol,
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'PUT',
      rejectUnauthorized: false,
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileStats.size
      }
    }, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`✅ Uploaded ${r2Key} to Cloudflare R2! (${(fileStats.size / 1024 / 1024).toFixed(1)} MB)`);
          resolve(true);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });
    req.on('error', reject);
    fileStream.pipe(req);
  });
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    console.log(`[AutoTranscode] Downloading: ${url}`);
    const file = fs.createWriteStream(destPath);
    const req = https.get(url, { rejectUnauthorized: false }, res => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download ${url}: HTTP ${res.statusCode}`));
      }
      const totalBytes = parseInt(res.headers['content-length'] || 0, 10);
      let downloaded = 0;
      let lastLog = Date.now();

      res.on('data', chunk => {
        downloaded += chunk.length;
        file.write(chunk);
        if (Date.now() - lastLog > 4000) {
          const pct = totalBytes > 0 ? ((downloaded / totalBytes) * 100).toFixed(1) : '?';
          console.log(`  Download: ${(downloaded / 1024 / 1024).toFixed(1)} MB / ${(totalBytes / 1024 / 1024).toFixed(1)} MB (${pct}%)`);
          lastLog = Date.now();
        }
      });

      res.on('end', () => {
        file.end();
        console.log(`✅ Download complete: ${(downloaded / 1024 / 1024).toFixed(1)} MB`);
        resolve(destPath);
      });
    });
    req.on('error', reject);
  });
}

function transcodeWithFFmpeg(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    console.log(`[AutoTranscode] Starting FFmpeg 720p HD + FastStart optimization...`);
    const args = [
      '-y',
      '-i', inputPath,
      '-vf', "scale='min(1280,iw)':-2",
      '-c:v', 'libx264',
      '-crf', '24',
      '-preset', 'fast',
      '-maxrate', '1400k',
      '-bufsize', '2800k',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      outputPath
    ];

    const proc = spawn('ffmpeg', args, { stdio: ['ignore', 'inherit', 'pipe'] });
    let stderr = '';
    proc.stderr.on('data', d => {
      const msg = d.toString();
      stderr += msg;
      const match = msg.match(/time=(\d{2}:\d{2}:\d{2}\.\d{2})/);
      if (match) {
        process.stdout.write(`  Transcoding: ${match[1]}\r`);
      }
    });

    proc.on('close', code => {
      console.log('');
      if (code === 0) {
        const inMB = (fs.statSync(inputPath).size / 1024 / 1024).toFixed(1);
        const outMB = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(1);
        const reduction = Math.round((1 - (fs.statSync(outputPath).size / fs.statSync(inputPath).size)) * 100);
        console.log(`🎉 Transcoding success: ${inMB} MB -> ${outMB} MB (Reduction: ${reduction}%, FastStart enabled)`);
        resolve(outputPath);
      } else {
        console.error('FFmpeg failed code:', code);
        reject(new Error(`FFmpeg exited with code ${code}`));
      }
    });
    proc.on('error', reject);
  });
}

async function uploadStringContentToR2(content, key, contentType) {
  const url = generatePresignedPutUrl({
    bucket: r2Config.bucketName,
    key,
    accountId: r2Config.accountId,
    accessKey: r2Config.accessKeyId,
    secretKey: r2Config.secretAccessKey
  });

  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request({
      protocol: u.protocol,
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'PUT',
      rejectUnauthorized: false,
      headers: {
        'Content-Type': contentType,
        'Content-Length': Buffer.byteLength(content)
      }
    }, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(true);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });
    req.on('error', reject);
    req.write(content);
    req.end();
  });
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { rejectUnauthorized: false }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          resolve(JSON.parse(d));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function checkVideoHeader(url) {
  return new Promise((resolve) => {
    try {
      const u = new URL(url);
      const req = https.request({
        hostname: u.hostname,
        path: u.pathname + u.search,
        method: 'HEAD',
        rejectUnauthorized: false
      }, res => {
        const length = parseInt(res.headers['content-length'] || 0, 10);
        resolve({ statusCode: res.statusCode, length });
      });
      req.on('error', () => resolve({ statusCode: 0, length: 0 }));
      req.end();
    } catch (_) {
      resolve({ statusCode: 0, length: 0 });
    }
  });
}

async function checkAndOptimizeAllVideos() {
  console.log(`\n[${new Date().toLocaleTimeString('ar-EG')}] 🔍 Checking Cloudflare R2 manifest for any unoptimized videos...`);
  const tempDir = 'C:\\temp_mnasa_transcode';
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const manifestUrl = `${r2Config.publicDomain}/lectures-manifest.json?t=${Date.now()}`;
  let manifest;
  try {
    manifest = await fetchJson(manifestUrl);
  } catch (err) {
    console.warn('[AutoTranscode] Could not fetch remote manifest:', err.message);
    const localManifestPath = path.resolve('public/lectures-manifest.json');
    if (fs.existsSync(localManifestPath)) {
      manifest = JSON.parse(fs.readFileSync(localManifestPath, 'utf8'));
    } else {
      return;
    }
  }

  const initialDeletedSet = new Set(manifest.deletedLectureIds || []);
  const lectures = (manifest.lectures || []).filter(l => l && l.id && !initialDeletedSet.has(l.id));
  let manifestChanged = false;

  for (const lec of lectures) {
    const rawUrl = lec.videoUrl;
    if (!rawUrl || !rawUrl.includes('r2.dev')) continue;

    // Check if the video is already faststart
    const isFastStartUrl = rawUrl.includes('_faststart.mp4');
    const header = await checkVideoHeader(rawUrl);
    const sizeMB = header.length > 0 ? (header.length / (1024 * 1024)).toFixed(1) : 0;

    // Criteria for needing optimization:
    // 1. Not faststart, OR
    // 2. Size > 300 MB (which indicates camera raw recording that will stutter on mobile), OR
    // 3. Raw MP4 filename without faststart tag
    const needsOptimization = !isFastStartUrl || Number(sizeMB) > 300;

    if (!needsOptimization) {
      continue;
    }

    console.log(`\n======================================================`);
    console.log(`🚀 FOUND UNOPTIMIZED LECTURE: "${lec.title}" (${lec.id})`);
    console.log(`  Current Size: ${sizeMB} MB | FastStart: ${isFastStartUrl}`);
    console.log(`  Current URL: ${rawUrl}`);
    console.log(`======================================================`);

    const urlObj = new URL(rawUrl);
    const r2Key = decodeURIComponent(urlObj.pathname.replace(/^\/+/, ''));
    const ext = path.extname(r2Key) || '.mp4';
    const baseName = path.basename(r2Key, ext).replace(/_faststart/g, '');

    const inputLocalPath = path.join(tempDir, `${lec.id}_input${ext}`);
    const outputLocalPath = path.join(tempDir, `${lec.id}_faststart.mp4`);

    try {
      // 1. Download
      await downloadFile(rawUrl, inputLocalPath);

      // 2. FFmpeg transcode & faststart
      await transcodeWithFFmpeg(inputLocalPath, outputLocalPath);

      // 3. Upload to R2 with _faststart.mp4 key
      const newKey = `${path.dirname(r2Key)}/${baseName}_faststart.mp4`.replace(/\\/g, '/');
      await uploadFileToR2(outputLocalPath, newKey);

      const newPublicUrl = `${r2Config.publicDomain}/${newKey}`;
      const newSizeMB = `${(fs.statSync(outputLocalPath).size / 1024 / 1024).toFixed(1)} MB`;

      // 4. Update lecture in manifest
      lec.videoUrl = newPublicUrl;
      lec.videoFileSize = newSizeMB;
      lec.videoFileName = `${baseName}_faststart.mp4`;
      manifestChanged = true;

      console.log(`✅ Lecture "${lec.title}" successfully optimized to: ${newPublicUrl} (${newSizeMB})`);

      // 5. Cleanup
      try { fs.unlinkSync(inputLocalPath); } catch (_) {}
      try { fs.unlinkSync(outputLocalPath); } catch (_) {}
    } catch (err) {
      console.error(`❌ Failed to optimize lecture ${lec.id}:`, err.message);
    }
  }

  if (manifestChanged) {
    console.log('[AutoTranscode] Saving and syncing updated manifests to Cloudflare R2...');
    let latestManifest = manifest;
    try {
      latestManifest = await fetchJson(manifestUrl);
    } catch (_) {}

    const latestDeletedSet = new Set([
      ...(manifest.deletedLectureIds || []),
      ...(latestManifest.deletedLectureIds || [])
    ]);

    const updatedUrlMap = new Map();
    lectures.forEach(l => {
      if (l.videoUrl && l.videoUrl.includes('_faststart.mp4')) {
        updatedUrlMap.set(l.id, l.videoUrl);
      }
    });

    const finalLectures = (latestManifest.lectures || [])
      .filter(l => l && l.id && !latestDeletedSet.has(l.id))
      .map(l => {
        if (updatedUrlMap.has(l.id)) {
          return { ...l, videoUrl: updatedUrlMap.get(l.id) };
        }
        return l;
      });

    latestManifest.lectures = finalLectures;
    latestManifest.deletedLectureIds = Array.from(latestDeletedSet);
    latestManifest.updatedAt = new Date().toISOString();
    const jsonStr = JSON.stringify(latestManifest, null, 2);

    // Save locally
    ['public/lectures-manifest.json', 'lectures-manifest.json'].forEach(p => {
      if (fs.existsSync(path.dirname(p))) fs.writeFileSync(p, jsonStr, 'utf8');
    });

    const jsContent = `(function() {
  var payload = ${jsonStr};
  window.__MS_LECTURES_MANIFEST__ = payload.lectures || payload;
  window.__MS_STAGES_MANIFEST__ = payload.stages || [];
  window.__MS_SECTIONS_MANIFEST__ = payload.sections || [];
  window.__MS_CODES_MANIFEST__ = payload.codes || [];
  window.__MS_DELETED_LECTURES__ = payload.deletedLectureIds || [];
  window.__MNASA_LECTURES_MANIFEST__ = payload;
  window.__MS_PLATFORM_MANIFEST__ = payload;
  if (typeof window.__onLecturesManifest === 'function') {
    try { window.__onLecturesManifest(payload); } catch(e) {}
  }
  try {
    window.dispatchEvent(new CustomEvent('ms:platform-manifest-loaded', { detail: payload }));
  } catch(e) {}
})();\n`;

    ['public/lectures-manifest.js', 'lectures-manifest.js'].forEach(p => {
      if (fs.existsSync(path.dirname(p))) fs.writeFileSync(p, jsContent, 'utf8');
    });

    // Upload to R2
    await uploadStringContentToR2(jsonStr, 'lectures-manifest.json', 'application/json');
    await uploadStringContentToR2(jsContent, 'lectures-manifest.js', 'application/javascript');
    console.log('🎉 All manifests synced with newly optimized FastStart streams!');
  } else {
    console.log('✅ All lecture videos are already 100% optimized with FastStart!');
  }
}

async function main() {
  const isDaemon = process.argv.includes('--daemon');
  if (isDaemon) {
    console.log('🛡️ Starting Automated Video Optimization Daemon (Checking every 60 seconds)...');
    while (true) {
      try {
        await checkAndOptimizeAllVideos();
      } catch (err) {
        console.error('[AutoTranscode Daemon] Error during check cycle:', err.message);
      }
      await new Promise(r => setTimeout(r, 60000));
    }
  } else {
    await checkAndOptimizeAllVideos();
  }
}

main().catch(console.error);
