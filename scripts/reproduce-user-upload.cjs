const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

async function run() {
  console.log('=== STARTING REAL BROWSER REPRODUCTION TEST ===');

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 }
  });

  const page = await context.newPage();

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[DEBUG]') || msg.type() === 'error' || text.includes('failed') || text.includes('Notice') || text.includes('R2') || text.includes('toast') || text.includes('lecture')) {
      console.log(`[BROWSER ${msg.type().toUpperCase()}]`, text);
    }
  });

  page.on('pageerror', err => {
    console.error('[BROWSER PAGE ERROR]', err.message);
  });

  // 1. Open home page
  console.log('1. Navigating to http://localhost:3000/#/ ...');
  await page.goto('http://localhost:3000/#/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  // 2. Click "دخول المستر 🔐" button in navbar
  console.log('2. Clicking "دخول المستر 🔐" button in navbar...');
  const teacherBtn = await page.$('button:has-text("دخول المستر"), a:has-text("دخول المستر")');
  if (!teacherBtn) {
    throw new Error('Teacher button not found on home page');
  }
  await teacherBtn.click();
  await page.waitForTimeout(1000);

  // 3. Enter PIN
  console.log('3. Entering Teacher PIN: 1234512345 ...');
  const pinInput = await page.$('input[type="password"]');
  if (!pinInput) throw new Error('PIN input not found in login modal');
  await pinInput.fill('1234512345');
  await pinInput.press('Enter');
  await page.waitForTimeout(2500);

  // 4. Verify we are in Teacher Admin Center
  console.log('4. Verifying Teacher Admin Center is loaded...');
  const titleField = await page.$('input[placeholder*="أزمنة المستقبل"]');
  if (!titleField) {
    // If on another tab, click "استوديو المحاضرات"
    const lecTab = await page.$('button:has-text("المحاضرات")');
    if (lecTab) {
      await lecTab.click();
      await page.waitForTimeout(1000);
    }
  }

  const finalTitleField = await page.$('input[placeholder*="أزمنة المستقبل"]');
  if (!finalTitleField) {
    throw new Error('Could not find lecture title input in Admin Center');
  }
  console.log('PASS: Teacher Admin Center is loaded and lecture form is active!');

  // 5. Fill lecture details
  const testTitle = 'محاضرة فحص الاستقرار الحقيقي ' + Date.now();
  console.log(`5. Filling lecture title: "${testTitle}"...`);
  await finalTitleField.fill(testTitle);

  const unitInput = await page.$('input[placeholder*="Unit"]');
  if (unitInput) await unitInput.fill('Unit 5');

  // 6. Select video file
  console.log('6. Attaching test video file...');
  const testVideoPath = path.resolve('scripts/test-laptop-video.mp4');
  const fileInput = await page.$('input[type="file"][accept*="video"]');
  if (!fileInput) throw new Error('File input not found');
  await fileInput.setInputFiles(testVideoPath);

  // 7. Wait for video upload to finish
  console.log('7. Waiting for video upload to complete...');
  let uploadReady = false;
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(600);
    const readyBadge = await page.$('text=✅ الفيديو على السحابة وشغال');
    if (readyBadge && await readyBadge.isVisible()) {
      uploadReady = true;
      break;
    }
  }
  console.log('Upload ready status:', uploadReady);

  // 8. Click Publish Lecture button
  console.log('8. Clicking Publish Lecture button (#publish-lecture-submit-btn)...');
  await page.evaluate(() => {
    const btn = document.getElementById('publish-lecture-submit-btn');
    if (btn) btn.click();
    else throw new Error('#publish-lecture-submit-btn not found in DOM');
  });

  // Wait 3 seconds
  await page.waitForTimeout(3000);

  // 9. Check if lecture exists in the published list below
  console.log('9. Checking published lectures list below studio...');
  const publishedLec = await page.$(`text=${testTitle}`);
  if (publishedLec) {
    console.log(`PASS: Lecture "${testTitle}" appears in the list below the studio!`);
  } else {
    console.log('FAIL: Lecture NOT found in the published lectures list below!');
  }

  // 10. Check localStorage
  const lsLecturesCount = await page.evaluate(() => {
    try {
      const arr = JSON.parse(localStorage.getItem('ms_lectures') || '[]');
      return arr.length;
    } catch (_) { return -1; }
  });
  console.log('localStorage ms_lectures count:', lsLecturesCount);

  // 11. Wait 18 seconds to test background 15s sync interval
  console.log('11. Waiting 18 seconds to test if background sync deletes it...');
  await page.waitForTimeout(18000);

  const stillThere = await page.$(`text=${testTitle}`);
  if (stillThere) {
    console.log('PASS: Lecture is STILL THERE after 18 seconds background interval!');
  } else {
    console.log('DISASTER REPRODUCED: Lecture DISAPPEARED after 18 seconds!');
  }

  // 12. Refresh page (F5) to test persistence across page reload
  console.log('12. Reloading page (F5)...');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // If PIN modal opens on reload, enter PIN
  const pinInput2 = await page.$('input[type="password"]');
  if (pinInput2 && await pinInput2.isVisible()) {
    await pinInput2.fill('1234512345');
    await pinInput2.press('Enter');
    await page.waitForTimeout(2000);
  }

  const afterReload = await page.$(`text=${testTitle}`);
  if (afterReload) {
    console.log('PASS: Lecture persisted across page reload (F5)!');
  } else {
    console.log('DISASTER REPRODUCED: Lecture DISAPPEARED after page reload!');
  }

  await browser.close();
  console.log('=== REAL BROWSER TEST COMPLETE ===');
}

run().catch(err => {
  console.error('Test crashed:', err);
  process.exit(1);
});
