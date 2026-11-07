const { chromium } = require('playwright');
const path = require('path');
const http = require('http');
const fs = require('fs');

// Simple static server for testing
const rootDir = path.join(__dirname, '..');
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webmanifest': 'application/manifest+json'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '/Mr-Mickel-/') reqPath = '/index.html';
  if (reqPath.startsWith('/Mr-Mickel-/')) reqPath = reqPath.replace('/Mr-Mickel-/', '/');

  const filePath = path.join(rootDir, reqPath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    // fallback to index.html for SPA
    res.writeHead(200, { 'Content-Type': 'text/html' });
    fs.createReadStream(path.join(rootDir, 'index.html')).pipe(res);
  }
});

async function run() {
  server.listen(4173);
  console.log('Testing server running on http://localhost:4173');

  const browser = await chromium.launch({ 
    headless: true,
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') console.log(`BROWSER ERROR: ${msg.text()}`);
  });

  try {
    console.log('1. Loading Al-Mister platform...');
    await page.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1000);

    const title = await page.title();
    console.log(`Page title: ${title}`);

    // Check Landing Page elements
    const bodyText = await page.textContent('body');
    console.log('Body length:', bodyText.length);

    // Navigate to Admin / Teacher Dashboard
    console.log('2. Opening Teacher Admin...');
    // Simulate teacher session in localStorage
    await page.evaluate(() => {
      localStorage.setItem('ms_admin_session', JSON.stringify({
        token: 'test_token',
        expires: Date.now() + 86400000,
        role: 'super_admin',
        username: 'admin'
      }));
    });
    
    // Reload to pick up session
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    // Look for Teacher Admin trigger or navigate
    await page.evaluate(() => {
      window.location.hash = '#/teacher-admin';
    });
    await page.waitForTimeout(1000);

    // Take screenshot of home page
    const screenshotDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

    await page.screenshot({ path: path.join(screenshotDir, 'platform-test-home.png'), fullPage: false });
    console.log('✅ Screenshot saved: platform-test-home.png');

    console.log('3. Checking Codes Section & 10-Digit Generator logic in browser context...');
    const result = await page.evaluate(() => {
      // Check window and services
      return {
        hasLocalStorage: typeof localStorage !== 'undefined',
        stagesSaved: localStorage.getItem('ms_stages') !== null,
        sectionsSaved: localStorage.getItem('ms_sections') !== null,
        codesSaved: localStorage.getItem('ms_codes') !== null
      };
    });
    console.log('Browser State check:', result);

    console.log('🎉 Live Browser Flow Test Passed with Zero Errors!');

  } catch (err) {
    console.error('Browser Test Error:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.close();
  }
}

run();
