const FIREBASE_AUTH_ORIGIN = 'https://mr-mi-586d2.firebaseapp.com';

export async function onRequest(context) {
  const requestUrl = new URL(context.request.url);
  const upstream = new URL(`${FIREBASE_AUTH_ORIGIN}${requestUrl.pathname}${requestUrl.search}`);

  const headers = new Headers(context.request.headers);
  headers.delete('host');
  headers.delete('cookie');

  const init = {
    method: context.request.method,
    headers,
    redirect: 'manual'
  };

  if (!['GET', 'HEAD'].includes(context.request.method)) {
    init.body = context.request.body;
  }

  const upstreamResponse = await fetch(upstream.toString(), init);
  const responseHeaders = new Headers(upstreamResponse.headers);
  responseHeaders.delete('content-security-policy');
  responseHeaders.delete('x-frame-options');
  responseHeaders.set('cache-control', 'no-store');

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders
  });
}
