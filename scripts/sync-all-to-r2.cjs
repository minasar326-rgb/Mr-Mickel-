const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

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

async function uploadToR2(content, key, contentType) {
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
  console.log('Reading full manifest from public/lectures-manifest.json...');
  const manifest = JSON.parse(fs.readFileSync('public/lectures-manifest.json', 'utf8'));

  // Ensure ALL active lectures are NOT in deletedLectureIds
  const activeIds = new Set((manifest.lectures || []).map(l => l.id).filter(Boolean));
  console.log(`Found ${manifest.lectures.length} active lectures in manifest:`, Array.from(activeIds));

  const cleanDeletedIds = (manifest.deletedLectureIds || []).filter(id => id && !activeIds.has(id));
  manifest.deletedLectureIds = cleanDeletedIds;
  manifest.updatedAt = new Date().toISOString();

  const jsonStr = JSON.stringify(manifest);
  fs.writeFileSync('public/lectures-manifest.json', jsonStr, 'utf8');
  fs.writeFileSync('lectures-manifest.json', jsonStr, 'utf8');

  const jsContent = `(function() {
  var payload = ${jsonStr};
  window.__MS_LECTURES_MANIFEST__ = payload.lectures || payload;
  window.__MS_STAGES_MANIFEST__ = payload.stages || [];
  window.__MS_SECTIONS_MANIFEST__ = payload.sections || [];
  window.__MS_DELETED_LECTURES__ = payload.deletedLectureIds || [];
  window.__MS_PLATFORM_MANIFEST__ = payload;
  if (typeof window.__onLecturesManifest === 'function') {
    try { window.__onLecturesManifest(payload); } catch(e) {}
  }
  try {
    window.dispatchEvent(new CustomEvent('ms:platform-manifest-loaded', { detail: payload }));
  } catch(e) {}
})();`;

  fs.writeFileSync('public/lectures-manifest.js', jsContent, 'utf8');
  fs.writeFileSync('lectures-manifest.js', jsContent, 'utf8');

  console.log('Uploading lectures-manifest.json to Cloudflare R2...');
  await uploadToR2(jsonStr, 'lectures-manifest.json', 'application/json');

  console.log('Uploading lectures-manifest.js to Cloudflare R2...');
  await uploadToR2(jsContent, 'lectures-manifest.js', 'application/javascript');

  console.log('\n🎉 ALL MANIFESTS ON CLOUDFLARE R2 AND LOCAL STORAGE SYNCHRONIZED PERFECTLY!');
}

main().catch(err => {
  console.error('Fatal error syncing to R2:', err);
  process.exit(1);
});
