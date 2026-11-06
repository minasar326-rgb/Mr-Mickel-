// uploadCore.js — رفع الملفات لسيرفر الرفع (Cloudflare Worker) بدون أي مفاتيح في المتصفح.
// منطق نقي (من غير استيراد firebase) علشان يتجرّب بسهولة.

export class UploadError extends Error {
  constructor(code, message, detail) {
    super(message);
    this.name = 'UploadError';
    this.code = code;
    this.detail = detail;
  }
}

export const PART_SIZE = 10 * 1024 * 1024; // 10MB (الحد الأدنى في R2 هو 5MB لكل جزء ما عدا الأخير)
const MAX_RETRIES = 3;

const NETWORK_MSG = 'تعذر الاتصال بسيرفر الرفع. تأكد من الإنترنت وحاول تاني.';

export function createUploader({
  apiBase,
  getToken,
  XHR = globalThis.XMLHttpRequest,
  fetchImpl = (...a) => globalThis.fetch(...a),
  sleep = (ms) => new Promise((r) => setTimeout(r, ms)),
}) {
  const base = String(apiBase || '').replace(/\/+$/, '');

  const ensureConfigured = () => {
    if (!base) {
      throw new UploadError(
        'NOT_CONFIGURED',
        'عنوان سيرفر الرفع غير مضبوط (VITE_UPLOAD_API_URL). انشر الـ Worker وحط عنوانه في .env.production.'
      );
    }
  };

  const errorFromResponse = async (res) => {
    let data = {};
    try { data = await res.json(); } catch (_) {}
    const msg = data.message || `السيرفر رجّع خطأ (${res.status}).`;
    const code = res.status === 401 ? 'AUTH' : res.status === 403 ? 'FORBIDDEN' : res.status === 413 ? 'TOO_LARGE' : 'SERVER';
    return new UploadError(code, msg, data.detail || data.error);
  };

  async function api(path, { method = 'POST', body } = {}) {
    ensureConfigured();
    const token = await getToken();
    let res;
    try {
      res = await fetchImpl(`${base}${path}`, {
        method,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (e) {
      throw new UploadError('NETWORK', NETWORK_MSG, e && e.message);
    }
    if (!res.ok) throw await errorFromResponse(res);
    return res.json();
  }

  // رفع جزء واحد بـ XHR علشان نقدر نعرف نسبة التقدم الحقيقية
  function xhrPut(url, blob, token, contentType, onBytes, signal) {
    return new Promise((resolve, reject) => {
      const xhr = new XHR();
      xhr.open('PUT', url);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      if (contentType) xhr.setRequestHeader('Content-Type', contentType);
      xhr.upload.onprogress = (e) => { if (e.lengthComputable) onBytes(e.loaded); };
      xhr.onload = () => {
        let data = {};
        try { data = JSON.parse(xhr.responseText || '{}'); } catch (_) {}
        if (xhr.status >= 200 && xhr.status < 300) return resolve(data);
        const code = xhr.status === 401 ? 'AUTH' : xhr.status === 403 ? 'FORBIDDEN' : 'SERVER';
        const err = new UploadError(code, data.message || `السيرفر رجّع خطأ (${xhr.status}).`, data.detail || data.error);
        err.status = xhr.status;
        reject(err);
      };
      xhr.onerror = () => reject(new UploadError('NETWORK', NETWORK_MSG));
      xhr.ontimeout = () => reject(new UploadError('NETWORK', NETWORK_MSG));
      xhr.onabort = () => reject(new UploadError('ABORTED', 'تم إلغاء الرفع.'));
      if (signal) {
        if (signal.aborted) return reject(new UploadError('ABORTED', 'تم إلغاء الرفع.'));
        signal.addEventListener('abort', () => xhr.abort(), { once: true });
      }
      xhr.send(blob);
    });
  }

  async function putPartWithRetry(url, blob, contentType, onBytes, signal) {
    let lastErr;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const token = await getToken(); // Firebase بيجدد التوكن تلقائيًا لو قرب ينتهي
        return await xhrPut(url, blob, token, contentType, onBytes, signal);
      } catch (e) {
        lastErr = e;
        const retryable = e.code === 'NETWORK' || (e.code === 'SERVER' && e.status >= 500);
        if (!retryable || attempt === MAX_RETRIES) break;
        onBytes(0);
        await sleep(1000 * 2 ** (attempt - 1));
      }
    }
    throw lastErr;
  }

  async function verifyRemote(url) {
    try {
      const res = await fetchImpl(url, { method: 'GET', headers: { Range: 'bytes=0-1' } });
      return res.status === 200 || res.status === 206;
    } catch (_) {
      return false;
    }
  }

  async function uploadFile(file, { folder = 'lectures/videos', category = 'video', onProgress, signal } = {}) {
    ensureConfigured();
    const total = file.size || 0;
    const totalMB = (total / (1024 * 1024)).toFixed(1);
    const report = (sent, state = 'uploading', extra = {}) => {
      if (!onProgress) return;
      const pct = total ? Math.min(99, Math.floor((sent / total) * 100)) : 0;
      onProgress({
        percent: state === 'completed' ? 100 : pct,
        transferredMB: (Math.min(sent, total) / (1024 * 1024)).toFixed(1),
        totalMB,
        state,
        ...extra,
      });
    };

    report(0, 'starting');
    const { key, uploadId } = await api('/upload/start', {
      body: {
        fileName: file.name || 'upload.bin',
        contentType: file.type || '',
        folder,
        category,
        size: total,
      },
    });

    const parts = [];
    try {
      const totalParts = Math.max(1, Math.ceil(total / PART_SIZE));
      let sentBefore = 0;
      for (let n = 1; n <= totalParts; n++) {
        if (signal && signal.aborted) throw new UploadError('ABORTED', 'تم إلغاء الرفع.');
        const start = (n - 1) * PART_SIZE;
        const end = Math.min(start + PART_SIZE, total);
        const blob = file.slice(start, end);
        const url = `${base}/upload/part?key=${encodeURIComponent(key)}&uploadId=${encodeURIComponent(uploadId)}&partNumber=${n}`;
        const res = await putPartWithRetry(
          url, blob, 'application/octet-stream',
          (loaded) => report(sentBefore + loaded, 'uploading', { currentPart: n, totalParts }),
          signal
        );
        parts.push({ partNumber: res.partNumber, etag: res.etag });
        sentBefore += end - start;
        report(sentBefore, 'uploading', { currentPart: n, totalParts });
      }

      const done = await api('/upload/complete', { body: { key, uploadId, parts } });
      if (!(await verifyRemote(done.url))) {
        throw new UploadError('VERIFY', 'الملف اترفع لكن مش بيفتح من الرابط. حاول ترفعه تاني.');
      }
      report(total, 'completed');
      return { key: done.key, size: done.size, url: done.url };
    } catch (e) {
      // تنظيف: إلغاء الرفع الناقص علشان ميفضلش ملف نصف مرفوع في R2
      try { await api('/upload/abort', { body: { key, uploadId } }); } catch (_) {}
      throw e instanceof UploadError ? e : new UploadError('UNKNOWN', e.message || 'فشل الرفع.', e.stack);
    }
  }

  async function uploadFixed(blob, key) {
    ensureConfigured();
    const token = await getToken();
    let res;
    try {
      res = await fetchImpl(`${base}/upload/fixed?key=${encodeURIComponent(key)}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': blob.type || 'application/octet-stream' },
        body: blob,
      });
    } catch (e) {
      throw new UploadError('NETWORK', NETWORK_MSG, e && e.message);
    }
    if (!res.ok) throw await errorFromResponse(res);
    return res.json();
  }

  async function deleteObject(key) {
    return api('/upload/delete', { body: { key } });
  }

  return { uploadFile, uploadFixed, deleteObject };
}
