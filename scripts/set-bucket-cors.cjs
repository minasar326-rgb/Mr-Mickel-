const crypto = require('crypto');

const accountId = '819fc4abad6f24879c065cd0dac920ed';
const bucket = 'educational-videos';
const accessKey = '720c71c362801fdd04575a8d62562b49';
const secretKey = '610a605c26d80b82b7958c6da7bd7f44f0df3196b7f2910d87b9e0f3968f1bc8';
const host = accountId + '.r2.cloudflarestorage.com';

const corsXml = `<CORSConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
  <CORSRule>
    <AllowedOrigin>*</AllowedOrigin>
    <AllowedMethod>GET</AllowedMethod>
    <AllowedMethod>PUT</AllowedMethod>
    <AllowedMethod>POST</AllowedMethod>
    <AllowedMethod>HEAD</AllowedMethod>
    <AllowedMethod>DELETE</AllowedMethod>
    <AllowedHeader>*</AllowedHeader>
    <ExposeHeader>ETag</ExposeHeader>
    <ExposeHeader>Content-Range</ExposeHeader>
    <ExposeHeader>Accept-Ranges</ExposeHeader>
    <ExposeHeader>Content-Length</ExposeHeader>
    <MaxAgeSeconds>86400</MaxAgeSeconds>
  </CORSRule>
</CORSConfiguration>`;

const bodyHash = crypto.createHash('sha256').update(corsXml).digest('hex');
const now = new Date();
const amzDate = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
const dateStamp = amzDate.slice(0, 8);
const path = '/' + bucket;
const queryParams = 'cors=';
const credential = accessKey + '/' + dateStamp + '/auto/s3/aws4_request';

const canonicalHeaders = 'content-type:application/xml\nhost:' + host + '\nx-amz-content-sha256:' + bodyHash + '\nx-amz-date:' + amzDate + '\n';
const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';
const canonicalRequest = 'PUT\n' + path + '\n' + queryParams + '\n' + canonicalHeaders + '\n' + signedHeaders + '\n' + bodyHash;
const crHash = crypto.createHash('sha256').update(canonicalRequest).digest('hex');
const stringToSign = 'AWS4-HMAC-SHA256\n' + amzDate + '\n' + dateStamp + '/auto/s3/aws4_request\n' + crHash;

function hmac(k, d) { return crypto.createHmac('sha256', k).update(d).digest(); }
const kDate = hmac('AWS4' + secretKey, dateStamp);
const kRegion = hmac(kDate, 'auto');
const kService = hmac(kRegion, 's3');
const kSigning = hmac(kService, 'aws4_request');
const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

const url = 'https://' + host + path + '?cors';

async function run() {
  const r = await fetch(url, {
    method: 'PUT',
    headers: {
      'Host': host,
      'Content-Type': 'application/xml',
      'x-amz-date': amzDate,
      'x-amz-content-sha256': bodyHash,
      'Authorization': 'AWS4-HMAC-SHA256 Credential=' + credential + ', SignedHeaders=' + signedHeaders + ', Signature=' + signature
    },
    body: corsXml
  });
  console.log('PutBucketCors status:', r.status);
  console.log('Response body:', await r.text());
}

run().catch(console.error);
