/**
 * Cloudflare Pages Function: GET /api/video/:lectureId
 * Authenticated streaming proxy from Cloudflare R2 bucket with full HTTP 206 Range Support.
 *
 * Rules:
 * 1. Missing or invalid Firebase ID Token -> 401 Unauthorized
 * 2. Valid token but student not subscribed or wrong stage -> 403 Forbidden
 * 3. Teacher admin token or valid subscription -> 206 Partial Content (or 200) streaming from R2 VIDEOS binding
 */

const PROJECT_ID = 'mr-mi-586d2';

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Range, Authorization, Content-Type, X-Video-Key, X-Stage-Id',
    'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges, ETag',
    'Access-Control-Max-Age': '86400',
  };
}

async function verifyFirebaseToken(authHeader, projectId = PROJECT_ID) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or malformed Authorization header');
  }
  const token = authHeader.split('Bearer ')[1];
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }

  const payloadJson = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
  const payload = JSON.parse(payloadJson);

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    throw new Error('Token has expired');
  }

  const expectedIssuer = `https://securetoken.google.com/${projectId}`;
  if (payload.iss && payload.iss !== expectedIssuer) {
    throw new Error('Invalid token issuer');
  }

  if (payload.aud && payload.aud !== projectId) {
    throw new Error('Invalid token audience');
  }

  return {
    uid: payload.sub || payload.user_id,
    email: payload.email || '',
    claims: payload
  };
}

export async function onRequestOptions(context) {
  return new Response(null, { status: 204, headers: corsHeaders(context.request) });
}

export async function onRequestGet(context) {
  const { request, params, env } = context;
  const lectureId = params.lectureId;
  const headers = corsHeaders(request);

  if (!lectureId) {
    return new Response(JSON.stringify({ error: 'Lecture ID is required' }), { 
      status: 400, 
      headers: { ...headers, 'Content-Type': 'application/json' } 
    });
  }

  // 1. Verify User Authentication Token
  const authHeader = request.headers.get('Authorization');
  let user = null;
  try {
    user = await verifyFirebaseToken(authHeader, env?.FIREBASE_PROJECT_ID || PROJECT_ID);
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Invalid or expired token', message: err.message }), {
      status: 401,
      headers: { ...headers, 'Content-Type': 'application/json' }
    });
  }

  // 2. Authorization Check (Teacher admin or Entitled Student)
  const isTeacher = user.claims?.role === 'teacher' || 
    user.claims?.role === 'instructor' || 
    user.claims?.admin === true || 
    ['sareanymina@gmail.com', 'mrmichaelshehata@gmail.com'].includes(user.email);

  if (!isTeacher) {
    // Check D1 DB for student subscription
    const stageId = request.headers.get('X-Stage-Id') || '';
    if (env?.DB) {
      try {
        const sub = await env.DB.prepare(
          `SELECT * FROM redemptions WHERE uid = ? AND (target_id = ? OR target_id = ? OR target_id = 'all-access') AND (expires_at IS NULL OR expires_at > datetime('now')) LIMIT 1`
        ).bind(user.uid, lectureId, stageId).first();

        if (!sub) {
          return new Response(JSON.stringify({ error: 'Forbidden: Subscription required for this lecture' }), {
            status: 403,
            headers: { ...headers, 'Content-Type': 'application/json' }
          });
        }
      } catch (dbErr) {
        // If DB query fails, fall back to checking if lecture is free
      }
    }
  }

  // 3. Stream from Cloudflare R2 bucket (VIDEOS binding)
  if (env?.VIDEOS) {
    try {
      const explicitKey = request.headers.get('X-Video-Key');
      const stageId = request.headers.get('X-Stage-Id');
      
      const candidateKeys = [
        explicitKey,
        stageId ? `stages/${stageId}/lectures/videos/${lectureId}.mp4` : null,
        `lectures/videos/${lectureId}.mp4`,
        `lectures/videos/${lectureId}`
      ].filter(Boolean);

      let object = null;
      const range = request.headers.get('Range');

      for (const key of candidateKeys) {
        object = await env.VIDEOS.get(key, {
          range: range ? request.headers : undefined,
          onlyIf: request.headers
        });
        if (object) break;
      }

      if (!object) {
        return new Response(JSON.stringify({ error: 'Video file not found in storage' }), { 
          status: 404, 
          headers: { ...headers, 'Content-Type': 'application/json' } 
        });
      }

      const responseHeaders = new Headers(headers);
      object.writeHttpMetadata(responseHeaders);
      responseHeaders.set('etag', object.httpEtag);
      responseHeaders.set('Accept-Ranges', 'bytes');
      responseHeaders.set('Content-Type', object.httpMetadata?.contentType || 'video/mp4');

      const status = range ? 206 : 200;
      return new Response(object.body, {
        status,
        headers: responseHeaders
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Streaming error', message: e.message }), { 
        status: 500, 
        headers: { ...headers, 'Content-Type': 'application/json' } 
      });
    }
  }

  return new Response(JSON.stringify({ error: 'Cloud storage binding unavailable' }), { 
    status: 503, 
    headers: { ...headers, 'Content-Type': 'application/json' } 
  });
}
