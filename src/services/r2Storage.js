import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Official Cloudflare R2 Configuration for Mr. Michael Shehata Platform
export const r2Config = {
  accountId: '13683452db95c0fd11352a54efc368b4',
  bucketName: 'educational-videos',
  publicDomain: 'https://pub-cdb447f627b54ae6a3027d3552574cd5.r2.dev',
  endpoint: 'https://13683452db95c0fd11352a54efc368b4.r2.cloudflarestorage.com',
  accessKeyId: 'e2511c27de74bb1b59dff09039768fd4',
  secretAccessKey: '8ccb099cca5fd7ba3456f5dd57fae4a527c37ff28ae7fd25648ffadbb7d41978'
};

// Initialize S3 Client targeting Cloudflare R2
export const r2Client = new S3Client({
  region: 'auto',
  endpoint: r2Config.endpoint,
  credentials: {
    accessKeyId: r2Config.accessKeyId,
    secretAccessKey: r2Config.secretAccessKey
  }
});

/**
 * Upload any video or file directly to Cloudflare R2 with progress simulation & public CDN URL
 * @param {File|Blob} file 
 * @param {string} folderPath 
 * @param {function} onProgress 
 */
export async function uploadFileToR2(file, folderPath = 'lectures/videos', onProgress) {
  try {
    const cleanName = (file.name || 'video.mp4').replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueKey = `${folderPath}/${Date.now()}_${cleanName}`;
    const totalBytes = file.size || 0;
    const totalMB = (totalBytes / (1024 * 1024)).toFixed(1);

    if (onProgress) {
      onProgress({ percent: 15, transferredMB: (Number(totalMB) * 0.15).toFixed(1), totalMB });
    }

    // Read file as Uint8Array for browser upload compatibility
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    if (onProgress) {
      onProgress({ percent: 50, transferredMB: (Number(totalMB) * 0.5).toFixed(1), totalMB });
    }

    const command = new PutObjectCommand({
      Bucket: r2Config.bucketName,
      Key: uniqueKey,
      Body: uint8Array,
      ContentType: file.type || 'video/mp4',
      Metadata: {
        originalName: file.name || 'video.mp4',
        uploadedBy: 'Teacher Michael Shehata'
      }
    });

    await r2Client.send(command);

    if (onProgress) {
      onProgress({ percent: 100, transferredMB: totalMB, totalMB });
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
  } catch (error) {
    console.error('Cloudflare R2 Upload Error:', error);
    throw error;
  }
}

/**
 * Upload the teacher's profile avatar to the permanent public URL
 * so social media link previews (WhatsApp, Facebook) update automatically.
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

    await r2Client.send(command);

    // Automatically trigger Facebook & WhatsApp scrapers in background to purge cache instantly
    try {
      fetch('https://graph.facebook.com/?id=https://minasar326-rgb.github.io/Mr-Mickel-/&scrape=true', { method: 'POST' }).catch(() => {});
    } catch (e) {}

    return `${r2Config.publicDomain}/teacher-avatar.jpg`;
  } catch (err) {
    console.error('Failed to update teacher-avatar.jpg on R2:', err);
    return null;
  }
}

