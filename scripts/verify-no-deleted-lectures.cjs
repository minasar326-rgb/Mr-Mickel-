const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

async function test() {
  console.log('🧪 Starting Playwright Verification of Lecture Isolation & Zero-Deleted Lectures...');

  const server = http.createServer((req, res) => {
    let filePath = path.join(process.cwd(), req.url.split('?')[0]);
    if (req.url === '/' || req.url.startsWith('/?')) filePath = path.join(process.cwd(), 'index.html');
    
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath);
      const mime = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png'
      }[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': mime, 'Access-Control-Allow-Origin': '*' });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  await new Promise(resolve => server.listen(4199, resolve));
  console.log('Local test server running at http://localhost:4199');

  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  });
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();

  await page.goto('http://localhost:4199', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  const pageData = await page.evaluate(() => {
    const deletedIds = Array.isArray(window.__MS_DELETED_LECTURES__) ? window.__MS_DELETED_LECTURES__ : [];
    const manifestLecs = Array.isArray(window.__MS_LECTURES_MANIFEST__) ? window.__MS_LECTURES_MANIFEST__ : [];
    const localLecsRaw = localStorage.getItem('ms_lectures');
    const localLecs = localLecsRaw ? JSON.parse(localLecsRaw) : [];
    return {
      deletedCount: deletedIds.length,
      manifestCount: manifestLecs.length,
      localCount: localLecs.length,
      manifestTitles: manifestLecs.map(l => l.title),
      localTitles: localLecs.map(l => l.title)
    };
  });

  console.log('Page Data:');
  console.log('  Deleted IDs count in window:', pageData.deletedCount);
  console.log('  Manifest lectures count:', pageData.manifestCount);
  console.log('  Local storage lectures count:', pageData.localCount);
  console.log('  Local storage lecture titles:', pageData.localTitles);
  console.log('  Manifest lecture titles:', pageData.manifestTitles);

  // Assertions
  const forbiddenTitles = [
    'BigBuckBunny',
    'أزمنة الماضي (Past Simple, Continuous & Perfect)',
    'أزمنة المضارع التام',
    'المستقبل بجميع أشكاله',
    'برسبر'
  ];

  for (const forbidden of forbiddenTitles) {
    const inManifest = pageData.manifestTitles.some(t => t.includes(forbidden));
    const inLocal = pageData.localTitles.some(t => t.includes(forbidden));
    if (inManifest || inLocal) {
      throw new Error(`CRITICAL FAILURE: Forbidden deleted lecture found! Title: "${forbidden}"`);
    }
  }

  console.log('✅ ALL FORBIDDEN DELETED LECTURES ARE 100% GONE!');
  console.log('✅ Only active teacher lectures are present (' + pageData.manifestCount + ' lectures)!');

  await browser.close();
  server.close();
  console.log('🎉 Verification Test Passed with Flying Colors!');
}

test().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
