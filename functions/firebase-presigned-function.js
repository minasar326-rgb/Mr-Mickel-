/**
 * Firebase Cloud Function: generateSecureUploadUrl
 * Mr. Michael Shehata LMS (The Master)
 * 
 * Verifies Firebase Auth & Teacher Admin permissions,
 * then returns a secure Presigned PUT URL for Cloudflare R2 or Firebase Storage.
 */

const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

if (!admin.apps.length) {
  admin.initializeApp();
}

exports.generateSecureUploadUrl = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Verify Authorization Bearer Token
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or malformed Authorization header' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    // Verify teacher admin permissions
    const allowedEmails = [
      'teacher@gmail.com',
      'mrmichaelshehata@gmail.com',
      'admin@themaster.com',
      'saryanymina@gmail.com'
    ];

    if (!allowedEmails.includes(decodedToken.email) && !decodedToken.admin) {
      return res.status(403).json({ error: 'Forbidden: Teacher Admin access required' });
    }

    // 2. Generate Presigned URL
    const { fileName = 'lecture.mp4', folder = 'lectures/videos', contentType = 'video/mp4' } = req.body;
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageKey = `${folder}/${Date.now()}_${safeName}`;

    const r2AccountId = process.env.R2_ACCOUNT_ID || '13683452db95c0fd11352a54efc368b4';
    const s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
      }
    });

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME || 'educational-videos',
      Key: storageKey,
      ContentType: contentType
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
    const publicDomain = process.env.R2_PUBLIC_DOMAIN || 'https://pub-cdb447f627b54ae6a3027d3552574cd5.r2.dev';

    return res.status(200).json({
      success: true,
      uploadUrl,
      publicUrl: `${publicDomain}/${storageKey}`,
      storageKey
    });

  } catch (err) {
    console.error('Error generating presigned upload URL:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});
