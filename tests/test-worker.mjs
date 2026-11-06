import worker, { verifyFirebaseToken, isTeacher, safeFolder, safeName } from '../worker/src/index.js';
import assert from 'node:assert/strict';

const env0 = { FIREBASE_PROJECT_ID: 'mr-mi-586d2', TEACHER_EMAILS: 'teacher@x.com', ALLOWED_ORIGINS: 'https://site.github.io' };
const b64u = (b) => Buffer.from(b).toString('base64url');
const kp = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1,0,1]), hash: 'SHA-256' }, true, ['sign','verify']);
const jwk = { ...(await crypto.subtle.exportKey('jwk', kp.publicKey)), kid: 'k1', alg: 'RS256', use: 'sig' };
async function mint(claims, kid='k1') {
  const h = b64u(JSON.stringify({ alg:'RS256', kid, typ:'JWT' }));
  const now = Math.floor(Date.now()/1000);
  const p = b64u(JSON.stringify({ aud:'mr-mi-586d2', iss:'https://securetoken.google.com/mr-mi-586d2', sub:'u1', iat: now-10, exp: now+3600, ...claims }));
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', kp.privateKey, new TextEncoder().encode(`${h}.${p}`));
  return `${h}.${p}.${b64u(sig)}`;
}
// mock global fetch for JWKS
globalThis.fetch = async (u) => new Response(JSON.stringify({ keys:[jwk] }), { status:200 });

// ---- in-memory R2 mock ----
const store = new Map(); const uploads = new Map();
const R2 = {
  async createMultipartUpload(key, opts){ const id='up'+uploads.size; uploads.set(id,{key,parts:new Map(),opts}); return { uploadId:id }; },
  resumeMultipartUpload(key, id){ const u=uploads.get(id); return {
    async uploadPart(n, buf){ u.parts.set(n, Buffer.from(buf)); return { partNumber:n, etag:'e'+n }; },
    async complete(parts){ const data=Buffer.concat(parts.map(p=>u.parts.get(p.partNumber))); store.set(key,{data,ct:u.opts.httpMetadata.contentType}); },
    async abort(){ uploads.delete(id); } }; },
  async head(key){ const o=store.get(key); if(!o) return null; return { size:o.data.length, httpEtag:'"x"', writeHttpMetadata(h){ h.set('Content-Type', o.ct); } }; },
  async get(key, opts){ const o=store.get(key); if(!o) return null;
    let range; let body=o.data;
    if (opts?.range) { const m=/bytes=(\d*)-(\d*)/.exec(opts.range.get('Range')); const s=m[1]===''?o.data.length-Number(m[2]):Number(m[1]); const e=m[1]===''?o.data.length-1:(m[2]===''?o.data.length-1:Number(m[2])); range={offset:s,length:e-s+1}; body=o.data.subarray(s,e+1); }
    return { size:o.data.length, httpEtag:'"x"', range, body, writeHttpMetadata(h){ h.set('Content-Type', o.ct); } }; },
  async put(key, buf, opts){ store.set(key,{data:Buffer.from(buf), ct:opts.httpMetadata.contentType}); },
  async delete(key){ store.delete(key); },
};
const env = { ...env0, VIDEOS: R2 };
const call = (path, init={}, token) => worker.fetch(new Request('https://api.test'+path, { ...init, headers:{ Origin:'https://site.github.io', ...(token?{Authorization:'Bearer '+token}:{}), ...(init.headers||{}) } }), env);

let pass = 0; const ok = (n)=>{ pass++; console.log('PASS', n); };

// auth tests
assert.equal((await call('/upload/start',{method:'POST',body:'{}'})).status, 401); ok('no token -> 401');
assert.equal((await call('/upload/start',{method:'POST',body:'{}'},'a.b.c')).status, 401); ok('garbage token -> 401');
const studentTok = await mint({ email:'kid@x.com', email_verified:true });
assert.equal((await call('/upload/start',{method:'POST',body:JSON.stringify({fileName:'a.mp4'})},studentTok)).status, 403); ok('student -> 403');
const unverified = await mint({ email:'teacher@x.com', email_verified:false });
assert.equal((await call('/upload/start',{method:'POST',body:'{}'},unverified)).status, 403); ok('unverified teacher email -> 403');
const expired = await mint({ exp: Math.floor(Date.now()/1000)-100, email:'teacher@x.com', email_verified:true });
assert.equal((await call('/upload/start',{method:'POST',body:'{}'},expired)).status, 401); ok('expired -> 401');
const wrongAud = await mint({ aud:'other', email:'teacher@x.com', email_verified:true });
assert.equal((await call('/upload/start',{method:'POST',body:'{}'},wrongAud)).status, 401); ok('wrong aud -> 401');
const badKid = await mint({ email:'teacher@x.com', email_verified:true }, 'nope');
assert.equal((await call('/upload/start',{method:'POST',body:'{}'},badKid)).status, 401); ok('unknown kid -> 401');
// tampered signature
const good = await mint({ email:'teacher@x.com', email_verified:true });
const tampered = good.split('.'); tampered[1] = b64u(JSON.stringify({ aud:'mr-mi-586d2', iss:'https://securetoken.google.com/mr-mi-586d2', sub:'u1', exp: 9999999999, email:'kid@x.com', role:'teacher' }));
assert.equal((await call('/upload/start',{method:'POST',body:'{}'},tampered.join('.'))).status, 401); ok('tampered payload -> 401');

// teacher happy path
const teacherTok = good;
let r = await call('/upload/start',{method:'POST',body:JSON.stringify({fileName:'درس 1.mp4',contentType:'video/mp4',folder:'stages/pri-3/lectures/videos',category:'video',size:12})},teacherTok);
assert.equal(r.status, 200); const start = await r.json(); assert.match(start.key, /^stages\/pri-3\/lectures\/videos\/\d+-[0-9a-f]{8}-/); ok('start ok, key='+start.key);
assert.equal((await call('/upload/start',{method:'POST',body:JSON.stringify({fileName:'x.exe',folder:'a'})},teacherTok)).status, 400); ok('bad extension rejected');
assert.equal((await call('/upload/start',{method:'POST',body:JSON.stringify({fileName:'x.mp4',folder:'../etc'})},teacherTok)).status, 400); ok('path traversal rejected');
assert.equal((await call('/upload/start',{method:'POST',body:JSON.stringify({fileName:'x.mp4',folder:'a',size:6e9})},teacherTok)).status, 413); ok('too large rejected');

const p1 = Buffer.from('0123456789'); const p2 = Buffer.from('AB');
const q = (n)=>`/upload/part?key=${encodeURIComponent(start.key)}&uploadId=${start.uploadId}&partNumber=${n}`;
r = await call(q(1),{method:'PUT',body:p1},teacherTok); assert.equal(r.status,200); const e1=(await r.json());
r = await call(q(2),{method:'PUT',body:p2},teacherTok); const e2=(await r.json());
assert.equal((await call(q(0),{method:'PUT',body:p1},teacherTok)).status, 400); ok('bad part number rejected');
assert.equal((await call(q(3),{method:'PUT',body:new Uint8Array(0)},teacherTok)).status, 400); ok('empty part rejected');
r = await call('/upload/complete',{method:'POST',body:JSON.stringify({key:start.key,uploadId:start.uploadId,parts:[e2,e1]})},teacherTok);
assert.equal(r.status,200); const done=await r.json(); assert.equal(done.size,12); ok('complete ok (parts out of order sorted), size=12');
assert.ok(done.url.startsWith('https://api.test/v/stages/pri-3/lectures/videos/')); ok('public url '+done.url);

// streaming
const path = new URL(done.url).pathname;
let s = await worker.fetch(new Request('https://api.test'+path), env);
assert.equal(s.status,200); assert.equal(await s.text(),'0123456789AB'); assert.equal(s.headers.get('Accept-Ranges'),'bytes'); ok('GET 200 full body + Accept-Ranges');
s = await worker.fetch(new Request('https://api.test'+path,{headers:{Range:'bytes=2-5'}}), env);
assert.equal(s.status,206); assert.equal(await s.text(),'2345'); assert.equal(s.headers.get('Content-Range'),'bytes 2-5/12'); assert.equal(s.headers.get('Content-Length'),'4'); ok('Range 206 correct Content-Range');
s = await worker.fetch(new Request('https://api.test'+path,{headers:{Range:'bytes=8-'}}), env);
assert.equal(s.status,206); assert.equal(await s.text(),'89AB'); assert.equal(s.headers.get('Content-Range'),'bytes 8-11/12'); ok('open-ended Range');
s = await worker.fetch(new Request('https://api.test'+path,{headers:{Range:'bytes=-3'}}), env);
assert.equal(s.status,206); assert.equal(await s.text(),'9AB'); ok('suffix Range');
s = await worker.fetch(new Request('https://api.test'+path,{method:'HEAD'}), env);
assert.equal(s.status,200); assert.equal(s.headers.get('Content-Length'),'12'); assert.equal(s.headers.get('Content-Type'),'video/mp4'); ok('HEAD ok');
s = await worker.fetch(new Request('https://api.test/v/nope.mp4'), env); assert.equal(s.status,404); ok('missing -> 404');
// student can stream (public) but not upload
// abort / fixed / delete
r = await call('/upload/start',{method:'POST',body:JSON.stringify({fileName:'b.mp4',folder:'x'})},teacherTok); const s2=await r.json();
assert.equal((await call('/upload/abort',{method:'POST',body:JSON.stringify({key:s2.key,uploadId:s2.uploadId})},teacherTok)).status,200); assert.equal(uploads.has(s2.uploadId),false); ok('abort works');
assert.equal((await call('/upload/fixed?key=teacher-avatar.jpg',{method:'PUT',body:Buffer.from('img'),headers:{'Content-Type':'image/jpeg'}},teacherTok)).status,200); ok('fixed avatar upload');
assert.equal((await call('/upload/fixed?key=evil.html',{method:'PUT',body:Buffer.from('x')},teacherTok)).status,400); ok('fixed arbitrary key rejected');
assert.equal((await call('/upload/delete',{method:'POST',body:JSON.stringify({key:start.key})},teacherTok)).status,200); assert.equal(store.has(start.key),false); ok('delete works');
// CORS
r = await worker.fetch(new Request('https://api.test/upload/start',{method:'OPTIONS',headers:{Origin:'https://site.github.io'}}), env);
assert.equal(r.status,204); assert.equal(r.headers.get('Access-Control-Allow-Origin'),'https://site.github.io'); ok('CORS preflight allowed origin');
r = await worker.fetch(new Request('https://api.test/upload/start',{method:'OPTIONS',headers:{Origin:'https://evil.com'}}), env);
assert.equal(r.headers.get('Access-Control-Allow-Origin'),null); ok('CORS evil origin not allowed');
assert.equal(safeName('../../a b.mp4'),'a_b.mp4'); ok('safeName');
console.log(`\nALL ${pass} CHECKS PASSED`);
