// r2Storage.js — الرفع بيتم عن طريق سيرفر الرفع (Cloudflare Worker)، مفيش أي مفاتيح R2 في المتصفح.
import { auth } from './firebase';
import { validateUploadedFile } from './securityValidator.js';
import { createUploader, UploadError } from './uploadCore.js';

export { UploadError };

// إعدادات عامة (بدون أسرار). publicDomain للروابط القديمة المرفوعة قبل كده.
export const r2Config = {
  bucketName: 'educational-videos',
  publicDomain: 'https://pub-6209dd5b4b61403592d78976eb48cac8.r2.dev',
};

// عنوان سيرفر الرفع (Cloudflare Worker). ملفات .env.* مش بتترفع على GitHub (متجاهلة في .gitignore)،
// فالـ build على GitHub Actions مش هيشوفها. العنوان مش سر، فبنحطه هنا كقيمة افتراضية.
// بعد ما تنشر الـ Worker (npx wrangler deploy) هيطلعلك عنوان زي https://almister-api.xxxx.workers.dev
// الصقه مكان القيمة اللي تحت (وسيبه من غير / في الآخر).
const DEFAULT_UPLOAD_API_URL = 'https://almister-api.YOUR-SUBDOMAIN.workers.dev';
const envUrl = (import.meta.env?.VITE_UPLOAD_API_URL || '').trim();
const resolved = (envUrl || DEFAULT_UPLOAD_API_URL).replace(/\/+$/, '');
// لو لسه فيه YOUR-SUBDOMAIN يبقى متضبطش، والرفع هيرجّع رسالة واضحة بدل ما يفشل بصمت
export const UPLOAD_API_URL = resolved.includes('YOUR-SUBDOMAIN') ? '' : resolved;

async function getFirebaseToken() {
  const user = auth.currentUser;
  if (!user) {
    throw new UploadError(
      'NOT_SIGNED_IN',
      'لازم تسجل دخول بحساب Google الخاص بالمدرس قبل رفع الملفات، وبعدين جرّب تاني.'
    );
  }
  return user.getIdToken();
}

const uploader = createUploader({ apiBase: UPLOAD_API_URL, getToken: getFirebaseToken });

/**
 * رفع ملف (فيديو / PDF / صورة) على R2 عن طريق سيرفر الرفع.
 * بيرمي UploadError برسالة عربية واضحة لو فشل، ومبيرجعش نجاح كاذب أبدًا.
 */
export async function uploadFileToR2(file, folderPath = 'lectures/videos', onProgress, category = 'video', signal) {
  const validation = await validateUploadedFile(file, category);
  if (!validation.valid) {
    throw new UploadError('INVALID_FILE', validation.error || 'فشل التحقق الأمني من الملف.');
  }
  const res = await uploader.uploadFile(file, { folder: folderPath, category, onProgress, signal });
  return {
    success: true,
    downloadUrl: res.url,
    publicUrl: res.url,
    storageKey: res.key,
    fileName: file.name,
    fileSize: file.size,
  };
}

async function toBlob(fileOrDataUrl, fallbackType) {
  if (typeof fileOrDataUrl === 'string' && fileOrDataUrl.startsWith('data:')) {
    const [meta, b64] = fileOrDataUrl.split(';base64,');
    const type = meta.split(':')[1] || fallbackType;
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type });
  }
  if (fileOrDataUrl instanceof Blob) return fileOrDataUrl;
  return null;
}

/** صورة المدرس (مفتاح ثابت teacher-avatar.jpg) */
export async function uploadTeacherAvatarToR2(fileOrDataUrl) {
  try {
    const blob = await toBlob(fileOrDataUrl, 'image/jpeg');
    if (!blob) return null;
    await uploader.uploadFixed(blob, 'teacher-avatar.jpg');
    try {
      fetch('https://graph.facebook.com/?id=https://minasar326-rgb.github.io/Mr-Mickel-/&scrape=true', { method: 'POST' }).catch(() => {});
    } catch (_) {}
    return `${r2Config.publicDomain}/teacher-avatar.jpg`;
  } catch (err) {
    console.error('Failed to update teacher-avatar.jpg:', err);
    return null;
  }
}

/** أيقونات التطبيق (icons/<name>.png) */
export async function uploadAppIconToR2(iconBlob, filename = 'icon-512x512.png') {
  try {
    const key = `icons/${filename}`;
    await uploader.uploadFixed(iconBlob, key);
    return `${r2Config.publicDomain}/${key}`;
  } catch (err) {
    console.warn('Failed to upload app icon:', err);
    return null;
  }
}

/** حذف ملف (للتراجع عن رفع) */
export async function deleteFileFromR2(storageKey) {
  if (!storageKey) return false;
  try {
    await uploader.deleteObject(storageKey);
    return true;
  } catch (err) {
    console.warn(`Failed to delete object (${storageKey}):`, err.message);
    return false;
  }
}

/**
 * تأكد إن رابط الفيديو شغال فعلاً (HEAD أو Range) قبل ما المحاضرة تتنشر.
 */
export async function verifyVideoUrl(url) {
  if (!url || typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
    return { valid: false, error: 'رابط الفيديو غير صالح أو ليس رابط ويب مباشر' };
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    let res;
    try {
      res = await fetch(url, { method: 'HEAD', signal: controller.signal });
    } catch (_) {
      res = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-1024' }, signal: controller.signal });
    }
    if (res && (res.status === 200 || res.status === 206 || res.status === 304)) {
      return {
        valid: true,
        status: res.status,
        contentLength: res.headers.get('content-length'),
        contentType: res.headers.get('content-type') || 'video/mp4',
      };
    }
    return { valid: false, status: res?.status || 0, error: `استجاب السيرفر بكود خطأ (${res?.status})` };
  } catch (err) {
    const isCors = err.name === 'TypeError';
    return {
      valid: false,
      isCors,
      error: isCors
        ? 'المتصفح مقدرش يوصل لرابط الفيديو (مشكلة اتصال أو CORS).'
        : (err.message || 'تعذر الاتصال برابط الفيديو'),
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
