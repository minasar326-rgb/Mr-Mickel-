import { 
  S3Client, 
  PutObjectCommand, 
  DeleteObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand 
} from '@aws-sdk/client-s3';
import { validateUploadedFile, generateCollisionProofKey, sanitizeFileName } from './securityValidator.js';

// Official Cloudflare R2 Configuration for Mr. Michael Shehata Platform
export const r2Config = {
  accountId: '13683452db95c0fd11352a54efc368b4',
  bucketName: 'educational-videos',
  publicDomain: 'https://pub-cdb447f627b54ae6a3027d3552574cd5.r2.dev',
  endpoint: 'https://13683452db95c0fd11352a54efc368b4.r2.cloudflarestorage.com',
  accessKeyId: import.meta.env?.VITE_R2_ACCESS_KEY_ID || '',
  secretAccessKey: import.meta.env?.VITE_R2_SECRET_ACCESS_KEY || ''
};

// Initialize S3 Client targeting Cloudflare R2 on demand
export function getR2Client() {
  const accessKeyId = r2Config.accessKeyId || (typeof localStorage !== 'undefined' ? localStorage.getItem('ms_r2_key') : '') || '';
  const secretAccessKey = r2Config.secretAccessKey || (typeof localStorage !== 'undefined' ? localStorage.getItem('ms_r2_secret') : '') || '';

  if (!accessKeyId || !secretAccessKey) {
    return null;
  }

  return new S3Client({
    region: 'auto',
    endpoint: r2Config.endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey
    }
  });
}

/**
 * Sleep helper for exponential backoff retries
 */
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Execute an operation with automatic retries and exponential backoff
 */
async function retryOperation(fn, maxRetries = 3, initialDelayMs = 1000) {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (attempt >= maxRetries) throw err;
      const delay = initialDelayMs * Math.pow(2, attempt - 1);
      console.warn(`[R2 Auto-Retry] Network glitch on attempt ${attempt}. Retrying in ${delay}ms...`);
      await wait(delay);
    }
  }
}

/**
 * Delete a file or abortive artifact from Cloudflare R2 (Rollback helper)
 * @param {string} storageKey 
 */
export async function deleteFileFromR2(storageKey) {
  if (!storageKey) return false;
  try {
    const client = getR2Client();
    if (!client) return false;
    const command = new DeleteObjectCommand({
      Bucket: r2Config.bucketName,
      Key: storageKey
    });
    await client.send(command);
    return true;
  } catch (err) {
    console.warn(`Failed to delete object from R2 (${storageKey}):`, err.message);
    return false;
  }
}

/**
 * Upload file with chunked / resumable multipart support, auto-retry, and atomic rollback
 * @param {File|Blob} file 
 * @param {string} folderPath 
 * @param {function} onProgress 
 * @param {'video'|'pdf'|'image'} category 
 */
export async function uploadFileToR2(file, folderPath = 'lectures/videos', onProgress, category = 'video') {
  // 1. Pre-upload security and magic-number validation
  const validation = await validateUploadedFile(file, category);
  if (!validation.valid) {
    throw new Error(validation.error || 'فشل التحقق الأمني من الملف.');
  }

  const client = getR2Client();
  if (!client) {
    throw new Error('بيانات الاتصال بـ Cloudflare R2 غير مهيأة. يرجى تزويد مفاتيح الوصول.');
  }

  const uniqueKey = generateCollisionProofKey(folderPath, file.name || 'upload.bin');
  const totalBytes = file.size || 0;
  const totalMB = (totalBytes / (1024 * 1024)).toFixed(1);
  const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunk minimum for S3 multipart

  // Case A: Small files (<= 5MB) - Single direct PutObject with auto-retry
  if (totalBytes <= CHUNK_SIZE) {
    if (onProgress) {
      onProgress({ percent: 10, transferredMB: '0.0', totalMB, state: 'reading' });
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    if (onProgress) {
      onProgress({ percent: 40, transferredMB: (Number(totalMB) * 0.4).toFixed(1), totalMB, state: 'uploading' });
    }

    const command = new PutObjectCommand({
      Bucket: r2Config.bucketName,
      Key: uniqueKey,
      Body: uint8Array,
      ContentType: file.type || (category === 'video' ? 'video/mp4' : 'application/pdf'),
      Metadata: {
        originalName: sanitizeFileName(file.name || 'file'),
        uploadedBy: 'Teacher Michael Shehata'
      }
    });

    await retryOperation(() => client.send(command), 3);

    if (onProgress) {
      onProgress({ percent: 100, transferredMB: totalMB, totalMB, state: 'completed' });
    }

    const publicUrl = `${r2Config.publicDomain}/${uniqueKey}`;
    return {
      success: true,
      downloadUrl: publicUrl,
      publicUrl: publicUrl,
      storageKey: uniqueKey,
      fileName: file.name,
      fileSize: file.size
    };
  }

  // Case B: Large files (> 5MB) - Resumable Chunked Multipart Upload with Atomic Rollback
  let uploadId = null;
  const parts = [];
  const totalParts = Math.ceil(totalBytes / CHUNK_SIZE);
  let bytesTransferred = 0;

  try {
    // 1. Initialize Multipart Upload
    const createCommand = new CreateMultipartUploadCommand({
      Bucket: r2Config.bucketName,
      Key: uniqueKey,
      ContentType: file.type || 'video/mp4',
      Metadata: {
        originalName: sanitizeFileName(file.name || 'video.mp4'),
        uploadedBy: 'Teacher Michael Shehata'
      }
    });
    const createRes = await retryOperation(() => client.send(createCommand), 3);
    uploadId = createRes.UploadId;

    // 2. Upload chunks sequentially with retry
    for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
      const start = (partNumber - 1) * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, totalBytes);
      const chunkBlob = file.slice(start, end);
      const chunkBuffer = await chunkBlob.arrayBuffer();
      const chunkArray = new Uint8Array(chunkBuffer);

      const partCommand = new UploadPartCommand({
        Bucket: r2Config.bucketName,
        Key: uniqueKey,
        UploadId: uploadId,
        PartNumber: partNumber,
        Body: chunkArray
      });

      const partRes = await retryOperation(() => client.send(partCommand), 3);
      parts.push({
        ETag: partRes.ETag,
        PartNumber: partNumber
      });

      bytesTransferred += chunkArray.length;
      const progressPercent = Math.min(Math.round((bytesTransferred / totalBytes) * 100), 99);
      const transferredMB = (bytesTransferred / (1024 * 1024)).toFixed(1);

      if (onProgress) {
        onProgress({
          percent: progressPercent,
          transferredMB,
          totalMB,
          currentPart: partNumber,
          totalParts,
          state: 'uploading'
        });
      }
    }

    // 3. Complete Multipart Upload
    const completeCommand = new CompleteMultipartUploadCommand({
      Bucket: r2Config.bucketName,
      Key: uniqueKey,
      UploadId: uploadId,
      MultipartUpload: { Parts: parts }
    });
    await retryOperation(() => client.send(completeCommand), 3);

    if (onProgress) {
      onProgress({ percent: 100, transferredMB: totalMB, totalMB, state: 'completed' });
    }

    const publicUrl = `${r2Config.publicDomain}/${uniqueKey}`;
    return {
      success: true,
      downloadUrl: publicUrl,
      publicUrl: publicUrl,
      storageKey: uniqueKey,
      fileName: file.name,
      fileSize: file.size
    };
  } catch (uploadError) {
    // 4. ATOMIC ROLLBACK: Abort multipart upload so no orphaned chunks or ghost files remain
    if (uploadId) {
      try {
        console.warn(`[R2 Rollback] Aborting multipart upload for ${uniqueKey}...`);
        const abortCommand = new AbortMultipartUploadCommand({
          Bucket: r2Config.bucketName,
          Key: uniqueKey,
          UploadId: uploadId
        });
        await client.send(abortCommand);
      } catch (abortErr) {
        console.error('Failed to abort multipart upload:', abortErr);
      }
    }
    throw uploadError;
  }
}

/**
 * Upload the teacher's profile avatar to the permanent public URL
 * @param {File|string} fileOrDataUrl
 */
export async function uploadTeacherAvatarToR2(fileOrDataUrl) {
  try {
    let uint8Array;
    let contentType = 'image/jpeg';

    if (typeof fileOrDataUrl === 'string' && fileOrDataUrl.startsWith('data:')) {
      const parts = fileOrDataUrl.split(';base64,');
      contentType = parts[0].split(':')[1] || 'image/jpeg';
      const binaryString = atob(parts[1]);
      uint8Array = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        uint8Array[i] = binaryString.charCodeAt(i);
      }
    } else if (fileOrDataUrl instanceof Blob || fileOrDataUrl instanceof File) {
      const buffer = await fileOrDataUrl.arrayBuffer();
      uint8Array = new Uint8Array(buffer);
      contentType = fileOrDataUrl.type || 'image/jpeg';
    } else {
      return null;
    }

    const command = new PutObjectCommand({
      Bucket: r2Config.bucketName,
      Key: 'teacher-avatar.jpg',
      Body: uint8Array,
      ContentType: contentType,
      CacheControl: 'no-cache, no-store, max-age=0, must-revalidate'
    });

    const client = getR2Client();
    if (!client) return null;
    await client.send(command);

    try {
      fetch('https://graph.facebook.com/?id=https://minasar326-rgb.github.io/Mr-Mickel-/&scrape=true', { method: 'POST' }).catch(() => {});
    } catch (e) {}

    return `${r2Config.publicDomain}/teacher-avatar.jpg`;
  } catch (err) {
    console.error('Failed to update teacher-avatar.jpg on R2:', err);
    return null;
  }
}

/**
 * Upload the dynamically generated branded App Icon to Cloudflare R2
 * @param {Blob} iconBlob 
 * @param {string} filename 
 */
export async function uploadAppIconToR2(iconBlob, filename = 'icon-512x512.png') {
  try {
    const arrayBuffer = await iconBlob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const key = `icons/${filename}`;

    const command = new PutObjectCommand({
      Bucket: r2Config.bucketName,
      Key: key,
      Body: uint8Array,
      ContentType: 'image/png',
      CacheControl: 'no-cache, no-store, max-age=0, must-revalidate'
    });

    const client = getR2Client();
    if (!client) return null;
    await client.send(command);
    return `${r2Config.publicDomain}/${key}`;
  } catch (err) {
    console.warn('Failed to upload app icon to R2:', err);
    return null;
  }
}
