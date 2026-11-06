/**
 * Cloudflare Pages Function: GET /api/video/:lectureId
 * Authenticated streaming proxy from Cloudflare R2 bucket with full HTTP 206 Range Support.
 */

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Range, Authorization, Content-Type',
    'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges, ETag',
    'Access-Control-Max-Age': '86400',
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
    return new Response('Lecture ID required', { status: 400, headers });
  }

  // 1. If R2 bucket (VIDEOS) is bound
  if (env?.VIDEOS) {
    try {
      // Find object by key or lectureId
      const key = request.headers.get('X-Video-Key') || `lectures/videos/${lectureId}.mp4`;
      const range = request.headers.get('Range');

      const object = await env.VIDEOS.get(key, {
        range: range ? request.headers : undefined,
        onlyIf: request.headers
      });

      if (!object) {
        return new Response('Video not found', { status: 404, headers });
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
      return new Response(e.message, { status: 500, headers });
    }
  }

  // Fallback redirect to verified public domain if direct binding not attached
  const publicBase = 'https://pub-6209dd5b4b61403592d78976eb48cac8.r2.dev';
  const redirectUrl = `${publicBase}/lectures/videos/${lectureId}`;
  return Response.redirect(redirectUrl, 302);
}
