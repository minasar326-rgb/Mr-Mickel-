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
  server.listen(4175);
  console.log('Diagnostic server running on http://localhost:4175');

  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  });

  try {
    // 1. Device 1: Teacher Laptop creates a code
    console.log('--- Step 1: Teacher Laptop Generates 10-digit Code ---');
    const teacherContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const teacherPage = await teacherContext.newPage();

    await teacherPage.goto('http://localhost:4175/', { waitUntil: 'domcontentloaded' });
    await teacherPage.waitForTimeout(2000);

    // Call generateNewCode inside teacher browser
    const createdCode = await teacherPage.evaluate(async () => {
      // Find teacher context via window or dispatch
      // Let's inspect localStorage and test direct sync
      const mod = await import('./src/services/firestoreSync.js');
      const testCode = {
        code: '1234567890',
        codeType: 'month',
        targetId: 'sec3-month-1',
        targetTitle: 'الشهر الأول: Grammar Units 1 & 2',
        stageId: 'sec-3',
        price: '180 ج.م',
        isPermanent: true,
        durationDays: 36500,
        maxUses: 1,
        usedCount: 0,
        isUsed: false,
        isActive: true,
        createdAt: new Date().toISOString()
      };

      console.log('Calling syncCodeToCloud in teacher browser...');
      const syncResult = await mod.syncCodeToCloud(testCode);
      return { syncResult, testCode };
    });

    console.log('Teacher Code Creation & Cloud Sync:', createdCode);
    await teacherContext.close();

    // 2. Device 2: Student Phone (Brand New Incognito Context, simulating a student in Alexandria or Aswan)
    console.log('\n--- Step 2: Student Phone in Incognito (No localStorage from Teacher) ---');
    const phoneContext = await browser.newContext({
      viewport: { width: 390, height: 844 }, // iPhone 14 / Samsung Galaxy viewport
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    });
    const phonePage = await phoneContext.newPage();

    phonePage.on('console', msg => {
      console.log(`[PHONE CONSOLE ${msg.type()}]:`, msg.text());
    });

    await phonePage.goto('http://localhost:4175/', { waitUntil: 'domcontentloaded' });
    await phonePage.waitForTimeout(2000);

    // Test checking the code from the student phone
    const checkResult = await phonePage.evaluate(async () => {
      const { fetchCodeFromCloud } = await import('./src/services/firestoreSync.js');
      const codeFromCloud = await fetchCodeFromCloud('1234567890');
      
      const { executeRedeemCode } = await import('./src/services/redemptionService.js');
      const redeemResult = await executeRedeemCode({
        cleanCode: '1234567890',
        codeStr: '1234567890',
        currentUser: {
          uid: 'student_mobile_uid_999',
          name: 'طالب على الهاتف',
          email: 'student.mobile@gmail.com'
        },
        stages: [{ id: 'sec-3', name: 'الصف الثالث الثانوي' }],
        sections: [{ id: 'sec3-month-1', stageId: 'sec-3', title: 'الشهر الأول' }],
        lectures: [{ id: 'lec-s3-01', stageId: 'sec-3', sectionId: 'sec3-month-1', title: 'المحاضرة 1' }]
      });

      return {
        codeFromCloud,
        redeemResult
      };
    });

    console.log('\nStudent Phone Lookup Result:', JSON.stringify(checkResult, null, 2));

    await phoneContext.close();

  } catch (err) {
    console.error('Diagnosis error:', err);
  } finally {
    await browser.close();
    server.close();
  }
}

run();
