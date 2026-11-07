const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');
const { execSync, spawn } = require('child_process');

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
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileStats.size
      }
    }, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`✅ Successfully uploaded ${r2Key} to Cloudflare R2! (Status: ${res.statusCode}, Size: ${(fileStats.size / 1024 / 1024).toFixed(1)} MB)`);
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
    console.log(`Downloading: ${url} -> ${destPath}`);
    const file = fs.createWriteStream(destPath);
    const req = https.get(url, res => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download ${url}: HTTP ${res.statusCode}`));
      }
      const totalBytes = parseInt(res.headers['content-length'] || 0, 10);
      let downloaded = 0;
      let lastReport = Date.now();

      res.on('data', chunk => {
        downloaded += chunk.length;
        file.write(chunk);
        if (Date.now() - lastReport > 2000) {
          const pct = totalBytes > 0 ? ((downloaded / totalBytes) * 100).toFixed(1) : '?';
          console.log(`  Progress: ${(downloaded / 1024 / 1024).toFixed(1)} MB (${pct}%)`);
          lastReport = Date.now();
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

function optimizeVideoWithFFmpeg(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    console.log(`Starting FFmpeg transcode & faststart optimization:\n  Input: ${inputPath}\n  Output: ${outputPath}`);
    
    // Scale to max width 1280 (720p HD), CRF 24, fast preset, AAC audio 128k, movflags +faststart
    const args = [
      '-y',
      '-i', inputPath,
      '-vf', "scale='min(1280,iw)':-2",
      '-c:v', 'libx264',
      '-crf', '24',
      '-preset', 'fast',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      outputPath
    ];

    const proc = spawn('ffmpeg', args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    proc.stderr.on('data', d => {
      stderr += d.toString();
    });

    proc.on('close', code => {
      if (code === 0) {
        const inSize = (fs.statSync(inputPath).size / 1024 / 1024).toFixed(1);
        const outSize = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(1);
        const reduction = Math.round((1 - (fs.statSync(outputPath).size / fs.statSync(inputPath).size)) * 100);
        console.log(`🎉 Optimization succeeded!\n  Original: ${inSize} MB -> Optimized: ${outSize} MB (Reduction: ${reduction}%, FastStart enabled)`);
        resolve(outputPath);
      } else {
        console.error('FFmpeg error:', stderr.slice(-1000));
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
      headers: {
        'Content-Type': contentType,
        'Content-Length': Buffer.byteLength(content)
      }
    }, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`✅ Uploaded manifest ${key} to R2! (Status: ${res.statusCode})`);
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

async function main() {
  const tempDir = path.resolve('temp_transcode');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

  const manifestPath = path.resolve('public/lectures-manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  // Target the 3 user-uploaded lectures from R2
  const targetLectureIds = ['lec-1794004864599', 'lec-1794002706071', 'lec-1794001152669'];

  for (const lecId of targetLectureIds) {
    const lec = manifest.lectures.find(l => l.id === lecId);
    if (!lec) {
      console.warn(`Lecture ${lecId} not found in manifest, skipping.`);
      continue;
    }

    console.log(`\n======================================================`);
    console.log(`🚀 PROCESSING LECTURE: "${lec.title}" (${lec.id})`);
    console.log(`Current URL: ${lec.videoUrl}`);
    console.log(`======================================================`);

    const rawUrl = lec.videoUrl;
    if (!rawUrl || !rawUrl.includes('r2.dev')) {
      console.log(`Not an R2 video URL, skipping.`);
      continue;
    }

    const urlObj = new URL(rawUrl);
    const r2Key = decodeURIComponent(urlObj.pathname.replace(/^\/+/, ''));
    const ext = path.extname(r2Key) || '.mp4';
    const baseName = path.basename(r2Key, ext);

    const inputLocalPath = path.join(tempDir, `${lec.id}_original${ext}`);
    const outputLocalPath = path.join(tempDir, `${lec.id}_faststart_optimized.mp4`);

    // Check if we already have the local file for lec-1794004864599 from earlier test
    if (lecId === 'lec-1794004864599' && fs.existsSync('temp_optimized.mp4')) {
      console.log(`Using existing test-optimized file for ${lec.title}`);
      fs.copyFileSync('temp_optimized.mp4', outputLocalPath);
    } else {
      // 1. Download
      await downloadFile(rawUrl, inputLocalPath);

      // 2. Transcode & Optimize with FFmpeg
      await optimizeVideoWithFFmpeg(inputLocalPath, outputLocalPath);
    }

    // 3. Upload Optimized File to R2
    // We upload to key with suffix _stream.mp4 or same key
    const optimizedR2Key = r2Key.replace(/\.mp4$/i, '_faststart.mp4');
    console.log(`Uploading optimized video to R2 as: ${optimizedR2Key}`);
    await uploadFileToR2(outputLocalPath, optimizedR2Key, 'video/mp4');

    const newPublicUrl = `${r2Config.publicDomain}/${optimizedR2Key}`;
    const newFileSize = (fs.statSync(outputLocalPath).size / 1024 / 1024).toFixed(1) + ' MB';

    // 4. Update lecture in manifest
    lec.videoUrl = newPublicUrl;
    lec.videoFileSize = newFileSize;
    lec.isStreamOptimized = true;

    console.log(`✅ Lecture "${lec.title}" updated:`);
    console.log(`   New URL: ${newPublicUrl}`);
    console.log(`   New Size: ${newFileSize}`);

    // Clean up local temp files to save disk
    try {
      if (fs.existsSync(inputLocalPath)) fs.unlinkSync(inputLocalPath);
      if (fs.existsSync(outputLocalPath)) fs.unlinkSync(outputLocalPath);
    } catch (e) {}
  }

  manifest.updatedAt = new Date().toISOString();

  // Save to all manifest locations
  console.log('\nUpdating manifest across all project locations...');
  const manifestJsonStr = JSON.stringify(manifest, null, 2);
  const manifestJsStr = `(function() {\n  var payload = ${JSON.stringify(manifest)};\n  if (typeof window !== "undefined") window.__CACHED_LECTURES_MANIFEST__ = payload;\n  if (typeof module !== "undefined" && module.exports) module.exports = payload;\n})();`;

  fs.writeFileSync('public/lectures-manifest.json', manifestJsonStr, 'utf8');
  fs.writeFileSync('lectures-manifest.json', manifestJsonStr, 'utf8');
  fs.writeFileSync('public/lectures-manifest.js', manifestJsStr, 'utf8');
  fs.writeFileSync('lectures-manifest.js', manifestJsStr, 'utf8');

  // Also update src/data/lecturesData.js
  const lecturesDataPath = path.resolve('src/data/lecturesData.js');
  if (fs.existsSync(lecturesDataPath)) {
    let dataContent = fs.readFileSync(lecturesDataPath, 'utf8');
    for (const lecId of targetLectureIds) {
      const lec = manifest.lectures.find(l => l.id === lecId);
      if (lec) {
        const regex = new RegExp(`(id:\\s*['"]${lecId}['"][\\s\\S]*?videoUrl:\\s*['"])([^'"]+)(['"])`);
        dataContent = dataContent.replace(regex, `$1${lec.videoUrl}$3`);
      }
    }
    fs.writeFileSync(lecturesDataPath, dataContent, 'utf8');
    console.log('✅ Updated src/data/lecturesData.js');
  }

  // Upload manifest to R2
  console.log('\nUploading updated manifest to Cloudflare R2...');
  await uploadStringContentToR2(manifestJsonStr, 'lectures-manifest.json', 'application/json');
  await uploadStringContentToR2(manifestJsStr, 'lectures-manifest.js', 'application/javascript');

  console.log('\n🎉 ALL 3 LECTURE VIDEOS AND MANIFESTS TRANSCODED & DEPLOYED SUCCESSFULLY!');
}

main().catch(err => {
  console.error('Fatal transcode error:', err);
  process.exit(1);
});
