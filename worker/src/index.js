// almister-api — Cloudflare Worker (R2 binding: VIDEOS)
// Endpoints:
//   POST /upload/start     {fileName, contentType, folder}            -> {key, uploadId}
//   PUT  /upload/part?key&uploadId&partNumber  (body = chunk)         -> {partNumber, etag}
//   POST /upload/complete  {key, uploadId, parts:[{partNumber,etag}]} -> {key, size, url}
//   POST /upload/abort     {key, uploadId}                            -> {ok:true}
//   PUT  /upload/fixed?key=teacher-avatar.jpg | icons/<name>.png      -> {key, url}
//   POST /upload/delete    {key}                                      -> {ok:true}
//   GET|HEAD /v/<key>      public streaming with Range support
//   GET  /health

const JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
const MAX_PART_BYTES = 100 * 1024 * 1024;       // Workers request body limit
const MAX_FILE_BYTES = 5 * 1024 * 1024 * 1024;  // 5 GB per file
const ALLOWED_EXT = {
  video: ['mp4', 'webm', 'mov', 'mkv', 'm4v'],
  pdf: ['pdf'],
  image: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
};
const FIXED_KEY_RE = /^(teacher-avatar\.jpg|icons\/[A-Za-z0-9._-]{1,80}\.png)$/;

// ---------- helpers ----------
const json = (data, status = 200, extra = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...extra },
  });

function b64urlToBytes(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
const decodeJson = (part) => JSON.parse(new TextDecoder().decode(b64urlToBytes(part)));

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const h = {
    'Access-Control-Allow-Methods': 'GET, HEAD, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, Range',
    'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges, ETag',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
  if (origin && allowed.includes(origin)) h['Access-Control-Allow-Origin'] = origin;
  return h;
}

// ---------- Firebase ID token verification (RS256, Google JWKS) ----------
export async function verifyFirebaseToken(token, env, fetchImpl = fetch) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) throw new Error('bad_token');
  const header = decodeJson(parts[0]);
  const payload = decodeJson(parts[1]);
  if (header.alg !== 'RS256' || !header.kid) throw new Error('bad_alg');

  const res = await fetchImpl(JWKS_URL, { cf: { cacheTtl: 3600, cacheEverything: true } });
  if (!res.ok) throw new Error('jwks_unavailable');
  const { keys = [] } = await res.json();
  const jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) throw new Error('unknown_kid');

  const key = await crypto.subtle.importKey(
    'jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']
  );
  const ok = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5', key, b64urlToBytes(parts[2]),
    new TextEncoder().encode(`${parts[0]}.${parts[1]}`)
  );
  if (!ok) throw new Error('bad_signature');

  const now = Math.floor(Date.now() / 1000);
  const pid = env.FIREBASE_PROJECT_ID;
  if (payload.aud !== pid) throw new Error('bad_aud');
  if (payload.iss !== `https://securetoken.google.com/${pid}`) throw new Error('bad_iss');
  if (!payload.sub) throw new Error('bad_sub');
  if (!payload.exp || payload.exp < now) throw new Error('expired');
  if (payload.iat && payload.iat > now + 300) throw new Error('bad_iat');
  return payload;
}

export function isTeacher(payload, env) {
  if (payload.role === 'teacher' || payload.admin === true) return true;
  const emails = (env.TEACHER_EMAILS || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  return Boolean(payload.email && payload.email_verified && emails.includes(String(payload.email).toLowerCase()));
}

async function requireTeacher(request, env) {
  const auth = request.headers.get('Authorization') || '';
  const m = auth.match(/^Bearer (.+)$/i);
  if (!m) return { error: json({ error: 'unauthorized', message: 'سجّل دخول بحساب المدرس أولاً.' }, 401) };
  let payload;
  try {
    payload = await verifyFirebaseToken(m[1], env);
  } catch (e) {
    return { error: json({ error: 'invalid_token', message: 'جلسة الدخول غير صالحة، سجّل دخول من جديد.', detail: e.message }, 401) };
  }
  if (!isTeacher(payload, env)) {
    return { error: json({ error: 'forbidden', message: 'هذا الحساب غير مصرح له بالرفع.' }, 403) };
  }
  return { payload };
}

// ---------- validation ----------
export function safeFolder(folder) {
  const f = String(folder || 'lectures/videos').replace(/^\/+|\/+$/g, '');
  if (!/^[A-Za-z0-9/_-]{1,160}$/.test(f) || f.includes('..') || f.includes('//')) return null;
  return f;
}
export function safeName(name) {
  const base = String(name || 'file').split(/[\\/]/).pop();
  const cleaned = base.replace(/[^A-Za-z0-9._-]/g, '_').replace(/_+/g, '_').slice(-80);
  return cleaned || 'file';
}
function extOf(name) {
  const i = name.lastIndexOf('.');
  return i === -1 ? '' : name.slice(i + 1).toLowerCase();
}
function validKey(key) {
  return typeof key === 'string' && key.length > 0 && key.length < 400 && !key.includes('..') && !key.startsWith('/');
}

// ---------- Range-capable streaming ----------
async function serveObject(request, env) {
  const url = new URL(request.url);
  const key = decodeURIComponent(url.pathname.slice('/v/'.length));
  if (!validKey(key)) return json({ error: 'bad_key' }, 400);

  const baseHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges, ETag',
    'Accept-Ranges': 'bytes',
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'public, max-age=86400',
  };

  if (request.method === 'HEAD') {
    const head = await env.VIDEOS.head(key);
    if (!head) return new Response(null, { status: 404, headers: baseHeaders });
    const h = new Headers(baseHeaders);
    head.writeHttpMetadata(h);
    if (!h.get('Content-Type')) h.set('Content-Type', 'video/mp4');
    h.set('ETag', head.httpEtag);
    h.set('Content-Length', String(head.size));
    return new Response(null, { status: 200, headers: h });
  }

  const hasRange = request.headers.has('Range');
  const obj = await env.VIDEOS.get(key, hasRange ? { range: request.headers } : undefined);
  if (!obj) return json({ error: 'not_found' }, 404, baseHeaders);

  const h = new Headers(baseHeaders);
  obj.writeHttpMetadata(h);
  if (!h.get('Content-Type')) h.set('Content-Type', 'video/mp4');
  h.set('ETag', obj.httpEtag);

  if (hasRange && obj.range) {
    let start, length;
    if ('suffix' in obj.range) {
      length = Math.min(obj.range.suffix, obj.size);
      start = obj.size - length;
    } else {
      start = obj.range.offset ?? 0;
      length = obj.range.length ?? (obj.size - start);
    }
    const end = start + length - 1;
    h.set('Content-Range', `bytes ${start}-${end}/${obj.size}`);
    h.set('Content-Length', String(length));
    return new Response(obj.body, { status: 206, headers: h });
  }
  h.set('Content-Length', String(obj.size));
  return new Response(obj.body, { status: 200, headers: h });
}

// ---------- router ----------
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const cors = corsHeaders(request, env);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (path === '/health') return json({ ok: true }, 200, cors);

    if (path.startsWith('/v/') && (request.method === 'GET' || request.method === 'HEAD')) {
      return serveObject(request, env);
    }

    const withCors = (res) => {
      for (const [k, v] of Object.entries(cors)) res.headers.set(k, v);
      return res;
    };

    try {
      if (!path.startsWith('/upload/')) return withCors(json({ error: 'not_found' }, 404));
      const { error, payload } = await requireTeacher(request, env);
      if (error) return withCors(error);

      // --- start ---
      if (path === '/upload/start' && request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const folder = safeFolder(body.folder);
        if (!folder) return withCors(json({ error: 'bad_folder', message: 'مسار الرفع غير صالح.' }, 400));
        const name = safeName(body.fileName);
        const ext = extOf(name);
        const category = body.category in ALLOWED_EXT ? body.category : 'video';
        if (!ALLOWED_EXT[category].includes(ext)) {
          return withCors(json({ error: 'bad_type', message: `صيغة الملف (.${ext || '؟'}) غير مسموحة.` }, 400));
        }
        if (Number(body.size) > MAX_FILE_BYTES) {
          return withCors(json({ error: 'too_large', message: 'حجم الملف أكبر من الحد المسموح (5GB).' }, 413));
        }
        const rand = crypto.randomUUID().slice(0, 8);
        const key = `${folder}/${Date.now()}-${rand}-${name}`;
        const mp = await env.VIDEOS.createMultipartUpload(key, {
          httpMetadata: { contentType: body.contentType || (category === 'video' ? 'video/mp4' : 'application/octet-stream') },
          customMetadata: { uploadedBy: payload.sub },
        });
        return withCors(json({ key, uploadId: mp.uploadId }));
      }

      // --- part ---
      if (path === '/upload/part' && request.method === 'PUT') {
        const key = url.searchParams.get('key');
        const uploadId = url.searchParams.get('uploadId');
        const partNumber = Number(url.searchParams.get('partNumber'));
        if (!validKey(key) || !uploadId || !Number.isInteger(partNumber) || partNumber < 1 || partNumber > 10000) {
          return withCors(json({ error: 'bad_request' }, 400));
        }
        const buf = await request.arrayBuffer();
        if (buf.byteLength === 0 || buf.byteLength > MAX_PART_BYTES) {
          return withCors(json({ error: 'bad_part_size' }, 400));
        }
        const mp = env.VIDEOS.resumeMultipartUpload(key, uploadId);
        const part = await mp.uploadPart(partNumber, buf);
        return withCors(json({ partNumber: part.partNumber, etag: part.etag }));
      }

      // --- complete ---
      if (path === '/upload/complete' && request.method === 'POST') {
        const { key, uploadId, parts } = await request.json().catch(() => ({}));
        if (!validKey(key) || !uploadId || !Array.isArray(parts) || parts.length === 0) {
          return withCors(json({ error: 'bad_request' }, 400));
        }
        const sorted = parts
          .map((p) => ({ partNumber: Number(p.partNumber), etag: String(p.etag) }))
          .sort((a, b) => a.partNumber - b.partNumber);
        const mp = env.VIDEOS.resumeMultipartUpload(key, uploadId);
        await mp.complete(sorted);
        const head = await env.VIDEOS.head(key);
        if (!head || head.size === 0) {
          return withCors(json({ error: 'verify_failed', message: 'الملف لم يُحفظ بشكل صحيح على السحابة.' }, 502));
        }
        const publicUrl = `${url.origin}/v/${key.split('/').map(encodeURIComponent).join('/')}`;
        return withCors(json({ key, size: head.size, url: publicUrl }));
      }

      // --- abort ---
      if (path === '/upload/abort' && request.method === 'POST') {
        const { key, uploadId } = await request.json().catch(() => ({}));
        if (validKey(key) && uploadId) {
          try { await env.VIDEOS.resumeMultipartUpload(key, uploadId).abort(); } catch (_) {}
        }
        return withCors(json({ ok: true }));
      }

      // --- fixed-key small uploads (avatar / icons) ---
      if (path === '/upload/fixed' && request.method === 'PUT') {
        const key = url.searchParams.get('key') || '';
        if (!FIXED_KEY_RE.test(key)) return withCors(json({ error: 'bad_key' }, 400));
        const buf = await request.arrayBuffer();
        if (buf.byteLength === 0 || buf.byteLength > 5 * 1024 * 1024) {
          return withCors(json({ error: 'bad_size' }, 400));
        }
        await env.VIDEOS.put(key, buf, {
          httpMetadata: {
            contentType: request.headers.get('Content-Type') || 'image/png',
            cacheControl: 'no-cache, no-store, max-age=0, must-revalidate',
          },
        });
        return withCors(json({ key, url: `${url.origin}/v/${key}` }));
      }

      // --- delete ---
      if (path === '/upload/delete' && request.method === 'POST') {
        const { key } = await request.json().catch(() => ({}));
        if (!validKey(key)) return withCors(json({ error: 'bad_key' }, 400));
        await env.VIDEOS.delete(key);
        return withCors(json({ ok: true }));
      }

      return withCors(json({ error: 'not_found' }, 404));
    } catch (e) {
      return withCors(json({ error: 'server_error', message: 'حصل خطأ في سيرفر الرفع.', detail: String(e && e.message || e) }, 500));
    }
  },
};
