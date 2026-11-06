const crypto = require('crypto');

const accountId = '819fc4abad6f24879c065cd0dac920ed';
const bucket = 'educational-videos';
const accessKey = '720c71c362801fdd04575a8d62562b49';
const secretKey = '610a605c26d80b82b7958c6da7bd7f44f0df3196b7f2910d87b9e0f3968f1bc8';
const host = accountId + '.r2.cloudflarestorage.com';

async function generatePresignedPutUrl(key, expiresIn = 7200) {
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

async function run() {
  const putUrl = await generatePresignedPutUrl('lectures-manifest.js');
  const jsContent = 'window.__onLecturesManifest && window.__onLecturesManifest([{"id":"test-cross-device-js","title":"مزامنة فورية عبر كافة الأجهزة","stageId":"sec-3"}]);';
  const res = await fetch(putUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/javascript; charset=utf-8' },
    body: jsContent
  });
  console.log('PUT lectures-manifest.js status:', res.status);

  // Now test fetching from public CDN
  const cdnRes = await fetch('https://pub-6209dd5b4b61403592d78976eb48cac8.r2.dev/lectures-manifest.js?t=' + Date.now());
  console.log('CDN GET status:', cdnRes.status);
  console.log('Content-Type:', cdnRes.headers.get('content-type'));
  console.log('Body:', await cdnRes.text());
}

run().catch(console.error);
