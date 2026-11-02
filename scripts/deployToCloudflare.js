import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Try reading .env file if running locally
try {
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const [k, ...v] = line.trim().split('=');
      if (k && v.length) process.env[k.trim()] = v.join('=').trim();
    });
  }
} catch (e) {}

const r2Config = {
  accountId: process.env.R2_ACCOUNT_ID,
  bucketName: process.env.R2_BUCKET_NAME,
  publicDomain: process.env.R2_PUBLIC_DOMAIN,
  endpoint: process.env.R2_ENDPOINT,
  accessKeyId: process.env.R2_ACCESS_KEY_ID || process.env.VITE_R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || process.env.VITE_R2_SECRET_ACCESS_KEY
};

const missingR2Env = Object.entries(r2Config)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingR2Env.length > 0) {
  console.error(`R2 deployment configuration missing: ${missingR2Env.join(', ')}`);
  process.exit(1);
}

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
      CacheControl: ext === '.html' ? 'no-cache, no-store, must-revalidate' : 'public, max-age=31536000, immutable',
      Metadata: {
        'robots': 'noindex, nofollow, noarchive'
      }
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
