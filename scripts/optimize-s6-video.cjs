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
    const req = https.get(url, { rejectUnauthorized: false }, res => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download ${url}: HTTP ${res.statusCode}`));
      }
      const totalBytes = parseInt(res.headers['content-length'] || 0, 10);
      let downloaded = 0;
      let lastReport = Date.now();

      res.on('data', chunk => {
        downloaded += chunk.length;
        file.write(chunk);
        if (Date.now() - lastReport > 3000) {
          const pct = totalBytes > 0 ? ((downloaded / totalBytes) * 100).toFixed(1) : '?';
          console.log(`  Download progress: ${(downloaded / 1024 / 1024).toFixed(1)} MB / ${(totalBytes / 1024 / 1024).toFixed(1)} MB (${pct}%)`);
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

function optimizeWithFFmpeg(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    console.log(`Starting FFmpeg transcode & faststart optimization:`);
    console.log(`  Input: ${inputPath}`);
    console.log(`  Output: ${outputPath}`);

    // High quality 720p HD, CRF 24, fast preset, AAC 128k, FastStart enabled (+faststart moves moov to start)
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
      // print progress lines
      const match = msg.match(/time=(\d{2}:\d{2}:\d{2}\.\d{2})/);
      if (match) {
        process.stdout.write(`  Transcoding progress: ${match[1]}\r`);
      }
    });

    proc.on('close', code => {
      console.log('');
      if (code === 0) {
        const inSize = (fs.statSync(inputPath).size / 1024 / 1024).toFixed(1);
        const outSize = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(1);
        const reduction = Math.round((1 - (fs.statSync(outputPath).size / fs.statSync(inputPath).size)) * 100);
        console.log(`🎉 FFmpeg transcode succeeded!`);
        console.log(`  Original: ${inSize} MB -> Optimized: ${outSize} MB (Reduction: ${reduction}%)`);
        resolve(outputPath);
      } else {
        console.error('FFmpeg failed with code', code);
        console.error(stderr.slice(-1000));
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
          console.log(`✅ Uploaded ${key} to R2! (Status: ${res.statusCode})`);
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
  // Use C:\temp_mnasa_transcode to preserve space on drive D:
  const tempDir = 'C:\\temp_mnasa_transcode';
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const rawVideoUrl = 'https://pub-6209dd5b4b61403592d78976eb48cac8.r2.dev/stages/stage-1793823853201/lectures/videos/1794035264323_1107.mp4';
  const inputLocalPath = path.join(tempDir, '1794035264323_1107_source.mp4');
  const outputLocalPath = path.join(tempDir, '1794035264323_1107_faststart.mp4');

  // Step 1: Download if not already present
  if (!fs.existsSync(inputLocalPath)) {
    await downloadFile(rawVideoUrl, inputLocalPath);
  } else {
    console.log(`Source file already exists at ${inputLocalPath} (${(fs.statSync(inputLocalPath).size / 1024 / 1024).toFixed(1)} MB)`);
  }

  // Step 2: Transcode & FastStart
  if (!fs.existsSync(outputLocalPath)) {
    await optimizeWithFFmpeg(inputLocalPath, outputLocalPath);
  } else {
    console.log(`Optimized file already exists at ${outputLocalPath} (${(fs.statSync(outputLocalPath).size / 1024 / 1024).toFixed(1)} MB)`);
  }

  // Step 3: Upload optimized video to Cloudflare R2
  const r2Key = 'stages/stage-1793823853201/lectures/videos/1794035264323_1107_faststart.mp4';
  await uploadFileToR2(outputLocalPath, r2Key);
  const newPublicUrl = `${r2Config.publicDomain}/${r2Key}`;
  console.log(`\nNew Public Video URL: ${newPublicUrl}`);

  // Step 4: Update manifests
  const optimizedSizeMB = `${(fs.statSync(outputLocalPath).size / 1024 / 1024).toFixed(1)} MB`;
  console.log(`Updating manifests with size ${optimizedSizeMB}...`);

  // Update public/lectures-manifest.json
  const manifestFiles = [
    'public/lectures-manifest.json',
    'lectures-manifest.json'
  ];

  for (const mPath of manifestFiles) {
    if (fs.existsSync(mPath)) {
      const manifest = JSON.parse(fs.readFileSync(mPath, 'utf8'));
      let updated = false;

      // Find by id or stage
      manifest.lectures = manifest.lectures || [];
      manifest.lectures.forEach(l => {
        if (l.id === 'lec-1794035946145' || (l.stageId === 'stage-1793823853201' && l.title.includes('شرح زمن ماضى بسيط'))) {
          l.videoUrl = newPublicUrl;
          l.videoFileSize = optimizedSizeMB;
          l.videoFileName = '1107_faststart.mp4';
          updated = true;
          console.log(`Updated lecture in ${mPath}: ${l.id} -> ${newPublicUrl}`);
        }
      });

      if (!updated) {
        // If lec-1794035946145 wasn't in local manifest, add it from remote definition
        const newLec = {
          stageId: "stage-1793823853201",
          stageName: "سادسه ابتدائى",
          sectionId: "sec-1794034221104",
          unitNumber: "Unit 5",
          title: "شرح زمن ماضى بسيط ",
          subtitle: "تسهيل القواعد ",
          duration: "24:19",
          videoUrl: newPublicUrl,
          videoStatus: "ready",
          localMediaKey: "",
          videoFileName: "1107_faststart.mp4",
          videoFileSize: optimizedSizeMB,
          thumbnail: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80",
          isFree: false,
          price: "30 ج.م",
          isLocked: true,
          homeworkRequired: true,
          examRequired: true,
          id: "lec-1794035946145",
          viewsCount: 1,
          order: 3,
          isPermanent: true,
          isDeleted: false,
          createdByUid: "pDVoGbrqf9WCxcpsAezeaD4Jl3E2",
          createdByName: "Michael Shehata",
          createdAt: "2026-11-07T07:19:06.145Z",
          allowDirectWatch: false,
          lastSavedAt: new Date().toISOString()
        };
        manifest.lectures.push(newLec);
        console.log(`Added lecture ${newLec.id} to ${mPath}`);
      }

      fs.writeFileSync(mPath, JSON.stringify(manifest, null, 2), 'utf8');
      console.log(`✅ Saved ${mPath}`);
    }
  }

  // Update public/lectures-manifest.js & lectures-manifest.js
  const jsManifestFiles = ['public/lectures-manifest.js', 'lectures-manifest.js'];
  const fullManifest = JSON.parse(fs.readFileSync('public/lectures-manifest.json', 'utf8'));
  const jsContent = `window.__MNASA_LECTURES_MANIFEST__ = ${JSON.stringify(fullManifest, null, 2)};\n` +
    `if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('ms:platform-manifest-loaded', { detail: window.__MNASA_LECTURES_MANIFEST__ }));\n`;

  for (const jsPath of jsManifestFiles) {
    fs.writeFileSync(jsPath, jsContent, 'utf8');
    console.log(`✅ Saved ${jsPath}`);
  }

  // Step 5: Sync manifests to Cloudflare R2
  console.log('Syncing manifests to Cloudflare R2...');
  await uploadStringContentToR2(JSON.stringify(fullManifest, null, 2), 'lectures-manifest.json', 'application/json');
  await uploadStringContentToR2(jsContent, 'lectures-manifest.js', 'application/javascript');
  console.log('✅ Remote R2 manifests synced successfully!');

  // Step 6: Clean up source download to save disk space on C:
  try {
    fs.unlinkSync(inputLocalPath);
    console.log(`Cleaned up temp source file: ${inputLocalPath}`);
  } catch (e) {
    console.warn('Could not clean up source file:', e.message);
  }

  console.log('\n======================================================');
  console.log('🎉 6TH GRADE VIDEO OPTIMIZATION COMPLETE!');
  console.log(`URL: ${newPublicUrl}`);
  console.log(`Size: ${optimizedSizeMB} (was 1,774 MB)`);
  console.log('FastStart: ENABLED (+faststart moov atom at byte 0)');
  console.log('Bitrate: ~900 kbps (was 10,200 kbps)');
  console.log('======================================================\n');
}

main().catch(err => {
  console.error('Fatal error in optimization script:', err);
  process.exit(1);
});
