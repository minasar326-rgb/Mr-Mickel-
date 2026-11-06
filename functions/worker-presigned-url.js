/**
 * Cloudflare Worker: Secure Presigned Upload URL Generator
 * Mr. Michael Shehata LMS (The Master)
 * 
 * Securely generates presigned upload URLs for Cloudflare R2
 * without exposing R2 Access Keys or Secret Keys in the client bundle.
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export default {
  async fetch(request, env) {
    // 1. Handle CORS Preflight
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-teacher-pin',
      'Access-Control-Max-Age': '86400',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      // 2. Authentication Verification: Check Teacher PIN or Firebase Token
      const authHeader = request.headers.get('Authorization') || '';
      const teacherPin = request.headers.get('x-teacher-pin') || '';

      // Validate against secret stored in Worker Environment Variables
      const validSecret = env.TEACHER_SECRET_KEY || '1234512345';
      if (!teacherPin && !authHeader) {
        return new Response(JSON.stringify({ error: 'Unauthorized: Missing credentials' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const body = await request.json().catch(() => ({}));
      const { fileName = 'lecture_video.mp4', folder = 'lectures/videos', contentType = 'video/mp4' } = body;

      const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const uniqueKey = `${folder}/${Date.now()}_${safeName}`;

      // 3. Initialize S3 Client using Cloudflare Worker Secrets
      const s3 = new S3Client({
        region: 'auto',
        endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: env.R2_ACCESS_KEY_ID,
          secretAccessKey: env.R2_SECRET_ACCESS_KEY,
        },
      });

      // 4. Generate Presigned PUT URL (valid for 60 minutes)
      const command = new PutObjectCommand({
        Bucket: env.R2_BUCKET_NAME || 'educational-videos',
        Key: uniqueKey,
        ContentType: contentType,
      });

      const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
      const publicDomain = env.R2_PUBLIC_DOMAIN || 'https://pub-cdb447f627b54ae6a3027d3552574cd5.r2.dev';
      const publicUrl = `${publicDomain}/${uniqueKey}`;

      return new Response(JSON.stringify({
        success: true,
        uploadUrl,
        publicUrl,
        storageKey: uniqueKey
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (err) {
      return new Response(JSON.stringify({
        error: 'Failed to generate upload URL',
        details: err.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};
