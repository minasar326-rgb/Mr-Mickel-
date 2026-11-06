const crypto = require('crypto');
const fs = require('fs');

const accountId = '819fc4abad6f24879c065cd0dac920ed';
const bucket = 'educational-videos';
const accessKey = '720c71c362801fdd04575a8d62562b49';
const secretKey = '610a605c26d80b82b7958c6da7bd7f44f0df3196b7f2910d87b9e0f3968f1bc8';
const host = accountId + '.r2.cloudflarestorage.com';

function generatePresignedPutUrl(key, expiresIn = 7200) {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const dateStamp = amzDate.slice(0, 8);
  const region = 'auto';
  const service = 's3';
  const path = '/' + bucket + '/' + key.replace(/^\/+/, '');
  const credential = accessKey + '/' + dateStamp + '/' + region + '/' + service + '/aws4_request';
  const queryParams = [
    'X-Amz-Algorithm=AWS4-HMAC-SHA256',
    'X-Amz-Credential=' + encodeURIComponent(credential),
    'X-Amz-Date=' + amzDate,
    'X-Amz-Expires=' + expiresIn,
    'X-Amz-SignedHeaders=host'
  ].sort().join('&');
  const canonicalHeaders = 'host:' + host + '\n';
  const signedHeaders = 'host';
  const canonicalRequest = 'PUT\n' + path + '\n' + queryParams + '\n' + canonicalHeaders + '\n' + signedHeaders + '\nUNSIGNED-PAYLOAD';
  const crHash = crypto.createHash('sha256').update(canonicalRequest).digest('hex');
  const stringToSign = 'AWS4-HMAC-SHA256\n' + amzDate + '\n' + dateStamp + '/' + region + '/' + service + '/aws4_request\n' + crHash;
  function hmac(k, d) { return crypto.createHmac('sha256', k).update(d).digest(); }
  const kDate = hmac('AWS4' + secretKey, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, 'aws4_request');
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');
  return 'https://' + host + path + '?' + queryParams + '&X-Amz-Signature=' + signature;
}

async function uploadToR2(key, body, contentType) {
  const putUrl = generatePresignedPutUrl(key);
  const res = await fetch(putUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body
  });
  if (!res.ok) {
    throw new Error(`Failed to upload ${key}: ${res.status} ${res.statusText}`);
  }
  return res.status;
}

async function main() {
  const manifestJsonPath = 'public/lectures-manifest.json';
  if (!fs.existsSync(manifestJsonPath)) {
    throw new Error('public/lectures-manifest.json not found');
  }

  const parsed = JSON.parse(fs.readFileSync(manifestJsonPath, 'utf8'));
  const rawLectures = Array.isArray(parsed) ? parsed : (parsed.lectures || []);
  const deletedLectureIds = parsed.deletedLectureIds || [];
  console.log(`Loaded ${rawLectures.length} lectures and ${deletedLectureIds.length} deleted IDs from ${manifestJsonPath}`);

  // Also include the custom stage 'stage-1793823759992' (ثالثه ابتدائى) so it exists across all devices
  const customStage = {
    id: 'stage-1793823759992',
    name: 'ثالثه ابتدائى',
    badge: 'المنهج المطور 🌟',
    description: 'شرح تفاعلي ومبسط لطلاب الصف الثالث الابتدائي مع مذكرات وتدريبات وبنك أسئلة.',
    lecturesCount: 1,
    studentsCount: 1,
    color: '#0E7490',
    pricePerMonth: '110 ج.م',
    features: ['صوتيات وفونكس مبسط', 'قصص وأناشيد تعليمية', 'تدريب على التحدث', 'تواصل مباشر مع ولي الأمر'],
    order: 10,
    isHidden: false
  };

  const payload = {
    lectures: rawLectures,
    stages: parsed.stages || [customStage],
    sections: parsed.sections || [],
    deletedLectureIds: deletedLectureIds,
    timestamp: Date.now()
  };

  const jsonContent = JSON.stringify(payload);
  const jsContent = `(function() {
  var payload = ${JSON.stringify(payload)};
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

  // Write local copies in public/ and root
  fs.writeFileSync('public/lectures-manifest.json', jsonContent, 'utf8');
  fs.writeFileSync('public/lectures-manifest.js', jsContent, 'utf8');
  fs.writeFileSync('lectures-manifest.json', jsonContent, 'utf8');
  fs.writeFileSync('lectures-manifest.js', jsContent, 'utf8');
  console.log('Updated public/ and root lectures-manifest files locally');

  // Upload to Cloudflare R2
  const jsonStatus = await uploadToR2('lectures-manifest.json', jsonContent, 'application/json; charset=utf-8');
  console.log(`Uploaded lectures-manifest.json to Cloudflare R2 (HTTP ${jsonStatus})`);

  const jsStatus = await uploadToR2('lectures-manifest.js', jsContent, 'application/javascript; charset=utf-8');
  console.log(`Uploaded lectures-manifest.js to Cloudflare R2 (HTTP ${jsStatus})`);

  // Verify CDN access
  const cdnRes = await fetch('https://pub-6209dd5b4b61403592d78976eb48cac8.r2.dev/lectures-manifest.js?t=' + Date.now());
  console.log(`Verified CDN GET lectures-manifest.js (HTTP ${cdnRes.status}, size: ${(await cdnRes.text()).length} bytes)`);
}

main().catch(err => {
  console.error('Error syncing cloud manifest:', err);
  process.exit(1);
});
