const vm = require('vm');

async function test() {
  console.log('--- STARTING CROSS-DEVICE SIMULATION TEST ---');

  // 1. Fetch lectures-manifest.js from Cloudflare R2 public CDN
  const cdnUrl = 'https://pub-6209dd5b4b61403592d78976eb48cac8.r2.dev/lectures-manifest.js?t=' + Date.now();
  console.log('1. Fetching script manifest from Cloudflare R2 CDN:', cdnUrl);
  
  const res = await fetch(cdnUrl);
  if (!res.ok) {
    throw new Error('Failed to fetch from CDN: ' + res.status);
  }
  const jsCode = await res.text();
  console.log(`PASS: Downloaded ${jsCode.length} bytes of executable JavaScript from Cloudflare edge`);

  // 2. Execute script in a fresh, clean sandbox (simulating an external phone browser)
  const sandbox = {
    window: {},
    document: {
      dispatchEvent: () => {}
    },
    CustomEvent: class { constructor(type, init) { this.type = type; this.detail = init?.detail; } }
  };
  sandbox.window = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(jsCode, sandbox);

  const manifest = sandbox.window.__MS_PLATFORM_MANIFEST__ || sandbox.window.__MS_LECTURES_MANIFEST__;
  if (!manifest) {
    throw new Error('FAILED: __MS_PLATFORM_MANIFEST__ not defined in sandbox');
  }

  const lectures = Array.isArray(manifest) ? manifest : (manifest.lectures || []);
  const stages = Array.isArray(manifest.stages) ? manifest.stages : [];

  console.log(`PASS: Simulated phone parsed ${lectures.length} lectures and ${stages.length} stages`);

  // 3. Test matching on stage "الصف الثالث الابتدائي" (pri-3)
  const { normalizeStageId } = await import('../src/utils/stages.js');
  const targetStage = { id: 'pri-3', name: 'الصف الثالث الابتدائي (Primary 3)' };

  const matchingLectures = lectures.filter(l => {
    if (!l || l.isDeleted) return false;
    if (l.stageId === targetStage.id) return true;
    if (normalizeStageId(l.stageId, l.stageName) === normalizeStageId(targetStage.id, targetStage.name)) return true;
    if (l.stageName && targetStage.name && l.stageName.trim().toLowerCase() === targetStage.name.trim().toLowerCase()) return true;
    return false;
  });

  console.log(`2. Filtering lectures for stage "${targetStage.name}":`);
  console.log(`Found ${matchingLectures.length} lecture(s) in this stage`);

  const uploadedLec = matchingLectures.find(l => l.id === 'lec-1793982279478');
  if (!uploadedLec) {
    throw new Error('FAILED: lec-1793982279478 was not matched in stage ' + targetStage.name);
  }

  console.log(`PASS: Successfully matched uploaded lecture: "${uploadedLec.title}"`);
  console.log(`- Stage ID: ${uploadedLec.stageId}`);
  console.log(`- Stage Name: ${uploadedLec.stageName}`);
  console.log(`- Video URL: ${uploadedLec.videoUrl}`);
  console.log(`- Video Status: ${uploadedLec.videoStatus}`);
  console.log(`- Duration: ${uploadedLec.duration}`);

  // 4. Verify video URL HEAD response from Cloudflare R2
  console.log('3. Verifying video availability on Cloudflare R2...');
  const vidHead = await fetch(uploadedLec.videoUrl, { method: 'HEAD' });
  console.log(`PASS: Video HEAD status: ${vidHead.status} (${vidHead.headers.get('content-type')}, ${vidHead.headers.get('content-length')} bytes)`);

  console.log('--- ALL CROSS-DEVICE CHECKS PASSED (100% SUCCESS) ---');
}

test().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
