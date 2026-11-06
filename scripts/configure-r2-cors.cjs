const crypto = require('crypto');

const accountId = '819fc4abad6f24879c065cd0dac920ed';
const bucket = 'educational-videos';
const accessKey = '720c71c362801fdd04575a8d62562b49';
const secretKey = '610a605c26d80b82b7958c6da7bd7f44f0df3196b7f2910d87b9e0f3968f1bc8';
const host = `${accountId}.r2.cloudflarestorage.com`;

const corsXml = `<?xml version="1.0" encoding="UTF-8"?>
<CORSConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
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
    <MaxAgeSeconds>3600</MaxAgeSeconds>
  </CORSRule>
</CORSConfiguration>`;

const md5 = crypto.createHash('md5').update(corsXml, 'utf8').digest('base64');
const sha256 = crypto.createHash('sha256').update(corsXml, 'utf8').digest('hex');

const now = new Date();
const amzDate = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
const dateStamp = amzDate.slice(0, 8);
const region = 'auto';
const service = 's3';

const path = `/${bucket}`;
const queryParams = 'cors=';

const canonicalHeaders = `content-md5:${md5}\nhost:${host}\nx-amz-content-sha256:${sha256}\nx-amz-date:${amzDate}\n`;
const signedHeaders = 'content-md5;host;x-amz-content-sha256;x-amz-date';

const canonicalRequest = `PUT\n${path}\n${queryParams}\n${canonicalHeaders}\n${signedHeaders}\n${sha256}`;
const crHash = crypto.createHash('sha256').update(canonicalRequest, 'utf8').digest('hex');
const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${dateStamp}/${region}/${service}/aws4_request\n${crHash}`;

function hmac(k, d) {
  return crypto.createHmac('sha256', k).update(d, 'utf8').digest();
}

const kDate = hmac('AWS4' + secretKey, dateStamp);
const kRegion = hmac(kDate, region);
const kService = hmac(kRegion, service);
const kSigning = hmac(kService, 'aws4_request');
const signature = crypto.createHmac('sha256', kSigning).update(stringToSign, 'utf8').digest('hex');

const authHeader = `AWS4-HMAC-SHA256 Credential=${accessKey}/${dateStamp}/${region}/${service}/aws4_request, SignedHeaders=${signedHeaders}, Signature=${signature}`;

async function run() {
  const url = `https://${host}${path}?cors`;
  console.log('Sending PUT to:', url);
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Host': host,
      'Content-MD5': md5,
      'x-amz-content-sha256': sha256,
      'x-amz-date': amzDate,
      'Authorization': authHeader,
      'Content-Type': 'application/xml'
    },
    body: corsXml
  });

  console.log('PUT CORS status:', res.status);
  const text = await res.text();
  console.log('Response body:', text || '(empty 200 OK)');
}

run().catch(console.error);
