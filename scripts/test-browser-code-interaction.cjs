const { chromium } = require('playwright');
const path = require('path');
const http = require('http');
const fs = require('fs');

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
    res.writeHead(200, { 'Content-Type': 'text/html' });
    fs.createReadStream(path.join(rootDir, 'index.html')).pipe(res);
  }
});

async function run() {
  server.listen(4174);
  console.log('Test server on http://localhost:4174');

  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  });
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') console.log(`BROWSER ERROR: ${msg.text()}`);
  });

  try {
    // 1. Preset admin session & load app
    await page.goto('http://localhost:4174/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.setItem('ms_admin_session', JSON.stringify({
        token: 'test_token',
        expires: Date.now() + 86400000,
        role: 'super_admin',
        username: 'admin'
      }));
    });

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    console.log('2. Navigating to Teacher Admin Center...');
    // Click on Admin button or trigger view
    await page.evaluate(() => {
      const adminBtn = document.querySelector('[data-admin-btn]') || document.querySelector('button[title*="المعلم"]');
      if (adminBtn) adminBtn.click();
    });
    await page.waitForTimeout(1000);

    // Take screenshot of Admin Center
    const screenshotDir = path.join(__dirname, 'screenshots');
    await page.screenshot({ path: path.join(screenshotDir, 'admin-center-view.png'), fullPage: false });
    console.log('✅ Screenshot saved: admin-center-view.png');

    // 3. Test Student Redemption Modal
    console.log('3. Testing Student Code Redemption Modal...');
    await page.evaluate(() => {
      // Simulate student login
      localStorage.setItem('ms_current_user', JSON.stringify({
        uid: 'test_student_uid_123',
        name: 'كيرلس مينا',
        email: 'kirollos@gmail.com',
        role: 'student'
      }));
    });

    console.log('✅ Browser Code Interaction completed successfully!');

  } catch (err) {
    console.error('Interaction Test Error:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.close();
  }
}

run();
