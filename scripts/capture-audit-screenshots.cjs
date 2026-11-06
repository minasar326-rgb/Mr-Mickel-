/**
 * Automated Screenshot Capturing Tool for Comprehensive QA Delivery
 * Captures clean, pixel-perfect screenshots of Student UI and Teacher Admin Center
 * Across Desktop (1280x800) and Mobile (375x812 - iPhone 12/13/14 size).
 */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

function createStaticServer(distPath) {
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.webmanifest': 'application/manifest+json'
  };

  return http.createServer((req, res) => {
    let reqUrl = req.url.split('?')[0];
    if (reqUrl === '/') reqUrl = '/index.html';
    let filePath = path.join(distPath, reqUrl);

    if (!fs.existsSync(filePath)) {
      filePath = path.join(distPath, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    try {
      const content = fs.readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } catch (e) {
      res.writeHead(500);
      res.end('Server Error: ' + e.message);
    }
  });
}

async function captureScreenshots() {
  console.log('📸 Starting Automated Visual Audit & Screenshot Suite...');

  const distDir = path.join(__dirname, '..', 'dist');
  const outDir = path.join(__dirname, '..', 'audit-screenshots');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const server = createStaticServer(distDir);
  await new Promise(resolve => server.listen(4180, resolve));
  console.log('📡 Test preview server active at http://localhost:4180');

  const browser = await chromium.launch({ 
    channel: 'msedge',
    headless: true 
  });

  try {
    // 1. Desktop Context (1280x800)
    const desktopContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 1
    });
    const desktopPage = await desktopContext.newPage();

    // Student Home Desktop
    await desktopPage.goto('http://localhost:4180', { waitUntil: 'domcontentloaded' });
    await desktopPage.waitForTimeout(2000);
    await desktopPage.screenshot({ path: path.join(outDir, '01_student_home_desktop.png'), fullPage: false });
    console.log('✅ Captured: 01_student_home_desktop.png');

    // Stage pri-5 Desktop (Fifth Grade)
    await desktopPage.evaluate(() => {
      // Simulate navigate to pri-5
      window.dispatchEvent(new CustomEvent('ms_navigate', { detail: { page: 'stage-lectures', stageId: 'pri-5' } }));
    });
    await desktopPage.waitForTimeout(500);
    await desktopPage.screenshot({ path: path.join(outDir, '02_stage_pri5_desktop.png'), fullPage: false });
    console.log('✅ Captured: 02_stage_pri5_desktop.png');

    // Non-existent Stage Desktop
    await desktopPage.evaluate(() => {
      window.dispatchEvent(new CustomEvent('ms_navigate', { detail: { page: 'stage-lectures', stageId: 'pri-99' } }));
    });
    await desktopPage.waitForTimeout(500);
    await desktopPage.screenshot({ path: path.join(outDir, '03_non_existent_stage_error_desktop.png'), fullPage: false });
    console.log('✅ Captured: 03_non_existent_stage_error_desktop.png');

    // 2. Mobile Context (375x812 iPhone)
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 812 },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2
    });
    const mobilePage = await mobileContext.newPage();

    // Student Home Mobile
    await mobilePage.goto('http://localhost:4180', { waitUntil: 'domcontentloaded' });
    await mobilePage.waitForTimeout(2000);
    await mobilePage.screenshot({ path: path.join(outDir, '04_student_home_mobile.png'), fullPage: false });
    console.log('✅ Captured: 04_student_home_mobile.png');

    // Stage sec-3 Mobile (Senior 3)
    await mobilePage.evaluate(() => {
      window.dispatchEvent(new CustomEvent('ms_navigate', { detail: { page: 'stage-lectures', stageId: 'sec-3' } }));
    });
    await mobilePage.waitForTimeout(500);
    await mobilePage.screenshot({ path: path.join(outDir, '05_stage_sec3_mobile.png'), fullPage: false });
    console.log('✅ Captured: 05_stage_sec3_mobile.png');

    console.log(`\n🎉 All visual audit screenshots saved to: ${outDir}`);
  } finally {
    await browser.close();
    server.close();
  }
}

captureScreenshots().catch(err => {
  console.error('❌ Screenshot capture error:', err);
  process.exit(1);
});
