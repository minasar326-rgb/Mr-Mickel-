import worker from '../worker/src/index.js';
import { createUploader, UploadError, PART_SIZE } from '../src/services/uploadCore.js';
import assert from 'node:assert/strict';

const b64u = (b) => Buffer.from(b).toString('base64url');
const kp = await crypto.subtle.generateKey({ name:'RSASSA-PKCS1-v1_5', modulusLength:2048, publicExponent:new Uint8Array([1,0,1]), hash:'SHA-256' }, true, ['sign','verify']);
const jwk = { ...(await crypto.subtle.exportKey('jwk', kp.publicKey)), kid:'k1', alg:'RS256', use:'sig' };
const mint = async (claims) => { const h=b64u(JSON.stringify({alg:'RS256',kid:'k1'})); const now=Math.floor(Date.now()/1000);
  const p=b64u(JSON.stringify({aud:'mr-mi-586d2',iss:'https://securetoken.google.com/mr-mi-586d2',sub:'u1',iat:now-5,exp:now+3600,...claims}));
  const s=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',kp.privateKey,new TextEncoder().encode(`${h}.${p}`)); return `${h}.${p}.${b64u(s)}`; };

const store = new Map(); const uploads = new Map(); let failPartsLeft = 0; let totalPartCalls = 0;
const R2 = {
  async createMultipartUpload(key,o){const id='u'+uploads.size;uploads.set(id,{key,parts:new Map(),o});return{uploadId:id};},
  resumeMultipartUpload(key,id){const u=uploads.get(id);return{async uploadPart(n,b){totalPartCalls++;u.parts.set(n,Buffer.from(b));return{partNumber:n,etag:'e'+n};},
    async complete(ps){store.set(key,{data:Buffer.concat(ps.map(p=>u.parts.get(p.partNumber))),ct:u.o.httpMetadata.contentType});},async abort(){uploads.delete(id);}};},
  async head(k){const o=store.get(k);return o?{size:o.data.length,httpEtag:'"x"',writeHttpMetadata(h){h.set('Content-Type',o.ct);}}:null;},
  async get(k,opts){const o=store.get(k);if(!o)return null;let range,body=o.data;if(opts?.range){const m=/bytes=(\d*)-(\d*)/.exec(opts.range.get('Range'));const s=Number(m[1]),e=m[2]===''?o.data.length-1:Number(m[2]);range={offset:s,length:e-s+1};body=o.data.subarray(s,e+1);}return{size:o.data.length,httpEtag:'"x"',range,body,writeHttpMetadata(h){h.set('Content-Type',o.ct);}};},
  async put(){}, async delete(k){store.delete(k);} };
const env = { FIREBASE_PROJECT_ID:'mr-mi-586d2', TEACHER_EMAILS:'teacher@x.com', ALLOWED_ORIGINS:'https://site.github.io', VIDEOS:R2 };
const realFetchForJwks = async () => new Response(JSON.stringify({keys:[jwk]}));
globalThis.fetch = realFetchForJwks; // used by worker for JWKS

// route "network" calls from the client into the worker
const toWorker = (url, init={}) => worker.fetch(new Request(url, { ...init, headers:{Origin:'https://site.github.io',...(init.headers||{})} }), env);
const fetchImpl = async (url, init) => { if (String(url).startsWith('https://api.test')) return toWorker(url, init); return realFetchForJwks(); };

class FakeXHR {
  constructor(){ this.upload={}; this.headers={}; }
  open(m,u){ this.method=m; this.url=u; }
  setRequestHeader(k,v){ this.headers[k]=v; }
  abort(){ this.onabort && this.onabort(); }
  send(blob){ (async()=>{
    if (failPartsLeft>0){ failPartsLeft--; return this.onerror(); }
    const buf = Buffer.from(await blob.arrayBuffer());
    this.upload.onprogress?.({lengthComputable:true, loaded: Math.floor(buf.length/2)});
    const res = await toWorker(this.url,{method:this.method,body:buf,headers:this.headers});
    this.status=res.status; this.responseText=await res.text(); this.upload.onprogress?.({lengthComputable:true, loaded:buf.length}); this.onload();
  })(); }
}
const teacher = await mint({ email:'teacher@x.com', email_verified:true });
const mk = (token) => createUploader({ apiBase:'https://api.test', getToken: async()=>token, XHR:FakeXHR, fetchImpl, sleep: async()=>{} });
let n=0; const ok=(m)=>{n++;console.log('PASS',m);};

// 1) multi-part real upload (25MB => 3 parts)
const big = Buffer.alloc(25*1024*1024); for (let i=0;i<big.length;i+=997) big[i]=i%251;
const file = new Blob([big],{type:'video/mp4'}); file.name='lec.mp4';
const progress=[]; 
const res = await mk(teacher).uploadFile(file,{folder:'stages/pri-3/lectures/videos',category:'video',onProgress:p=>progress.push(p)});
assert.equal(store.get(res.key).data.length, big.length); assert.ok(store.get(res.key).data.equals(big)); ok(`25MB uploaded in 3 parts, bytes identical (${progress.at(-1).totalMB}MB)`);
assert.equal(progress.at(-1).percent,100); assert.ok(progress.some(p=>p.percent>0&&p.percent<100)); assert.ok(progress.every((p,i)=>i===0||p.percent>=progress[i-1].percent-1)); ok('progress goes 0→100 monotonic');
assert.ok(res.url.startsWith('https://api.test/v/stages/pri-3/lectures/videos/')); ok('url is stable https (not blob:/IndexedDB)');
// 2) transient network error on a part -> retried
failPartsLeft=2; const small=new Blob([Buffer.from('hello world')],{type:'video/mp4'}); small.name='s.mp4';
const r2 = await mk(teacher).uploadFile(small,{folder:'x',category:'video'}); assert.equal(store.get(r2.key).data.toString(),'hello world'); ok('2 transient network failures retried then succeeded');
// 3) permanent network failure -> UploadError NETWORK, aborted, nothing left
failPartsLeft=99; const before=store.size; let err;
try { await mk(teacher).uploadFile(small,{folder:'x'}); } catch(e){ err=e; }
assert.ok(err instanceof UploadError); assert.equal(err.code,'NETWORK'); assert.match(err.message,/الإنترنت/); assert.equal(store.size,before); assert.equal(uploads.size, [...uploads.values()].length); ok('permanent failure -> NETWORK error + no ghost file');
failPartsLeft=0;
// 4) student token -> FORBIDDEN, clear message
const student = await mint({ email:'kid@x.com', email_verified:true });
try { await mk(student).uploadFile(small,{folder:'x'}); assert.fail('should throw'); } catch(e){ assert.equal(e.code,'FORBIDDEN'); assert.match(e.message,/غير مصرح/); } ok('student upload -> FORBIDDEN (Arabic message)');
// 5) no apiBase
try { await createUploader({apiBase:'',getToken:async()=>'x'}).uploadFile(small,{}); assert.fail(); } catch(e){ assert.equal(e.code,'NOT_CONFIGURED'); } ok('missing VITE_UPLOAD_API_URL -> NOT_CONFIGURED');
// 6) not signed in
try { await createUploader({apiBase:'https://api.test',getToken:async()=>{throw new UploadError('NOT_SIGNED_IN','x')},XHR:FakeXHR,fetchImpl}).uploadFile(small,{}); assert.fail(); } catch(e){ assert.equal(e.code,'NOT_SIGNED_IN'); } ok('not signed in -> NOT_SIGNED_IN');
// 7) the uploaded video is streamable with Range like a phone would
const u = new URL(res.url); const s = await toWorker('https://api.test'+u.pathname,{headers:{Range:'bytes=1000-1999'}});
assert.equal(s.status,206); assert.equal((await s.arrayBuffer()).byteLength,1000); ok('uploaded video streams with Range (206)');
console.log(`\nALL ${n} E2E CHECKS PASSED`);
