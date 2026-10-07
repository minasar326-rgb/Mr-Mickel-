import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const r2Config = {
  accountId: '13683452db95c0fd11352a54efc368b4',
  bucketName: 'educational-videos',
  publicDomain: 'https://pub-cdb447f627b54ae6a3027d3552574cd5.r2.dev',
  endpoint: 'https://13683452db95c0fd11352a54efc368b4.r2.cloudflarestorage.com',
  accessKeyId: 'e2511c27de74bb1b59dff09039768fd4',
  secretAccessKey: '8ccb099cca5fd7ba3456f5dd57fae4a527c37ff28ae7fd25648ffadbb7d41978'
};

const s3 = new S3Client({
  region: 'auto',
  endpoint: r2Config.endpoint,
  credentials: {
    accessKeyId: r2Config.accessKeyId,
    secretAccessKey: r2Config.secretAccessKey
  }
});

const mimeMap = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8'
};

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });
  return arrayOfFiles;
}

async function deploy() {
  const distDir = path.resolve('dist');
  console.log('🚀 Starting Cloudflare Live Deployment from:', distDir);

  if (!fs.existsSync(distDir)) {
    console.error('dist directory does not exist! Please run npm run build first.');
    process.exit(1);
  }

  const allFiles = getAllFiles(distDir);
  console.log(`Found ${allFiles.length} files to upload to Cloudflare CDN...`);

  for (const file of allFiles) {
    const relativePath = path.relative(distDir, file).replace(/\\/g, '/');
    const ext = path.extname(file).toLowerCase();
    const contentType = mimeMap[ext] || 'application/octet-stream';
    const body = fs.readFileSync(file);

    console.log(`Uploading: ${relativePath} (${contentType})...`);
    await s3.send(new PutObjectCommand({
      Bucket: r2Config.bucketName,
      Key: relativePath,
      Body: body,
      ContentType: contentType,
      CacheControl: ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable'
    }));
  }

  console.log('\n=============================================');
  console.log('✅ ALL WEBSITE FILES DEPLOYED TO CLOUDFLARE LIVE CDN!');
  console.log('🌐 Main Website URL:', `${r2Config.publicDomain}/index.html`);
  console.log('=============================================\n');
}

deploy().catch(err => {
  console.error('❌ Deployment error:', err);
  process.exit(1);
});
