const { chromium } = require('playwright');
const fs = require('fs');

async function testUserUploadFlow() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.addInitScript(() => {
    try { sessionStorage.setItem('ms_dev_bypass', 'true'); } catch (_) {}
  });
  const page = await context.newPage();

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(800);

  // Directly set teacher session
  await page.evaluate(() => {
    localStorage.setItem('ms_admin_auth', 'true');
    localStorage.setItem('ms_admin_secure_session', JSON.stringify({
      token: 'test_token_' + Date.now(),
      role: 'teacher_editor',
      expiresAt: Date.now() + 86400000
    }));
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // Click on "دخول المستر" or check admin
  const openBtn = page.locator('button:has-text("دخول المستر")').first();
  if (await openBtn.isVisible().catch(() => false)) {
    await openBtn.click();
    await page.waitForTimeout(600);
    const pin = page.locator('input[type="password"]').first();
    if (await pin.isVisible().catch(() => false)) {
      await pin.fill('1234512345');
      await pin.press('Enter');
      await page.waitForTimeout(1000);
    }
  }

  // Ensure lectures tab is selected
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button'));
    const lecTab = tabs.find(b => b.innerText && b.innerText.includes('المحاضرات والفيديوهات'));
    if (lecTab) lecTab.click();
  });
  await page.waitForTimeout(500);

  // Create minimal valid MP4
  const dummyVideoPath = 'temp-test-video.mp4';
  const ftypBox = Buffer.from([
    0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70,
    0x69, 0x73, 0x6f, 0x6d, 0x00, 0x00, 0x02, 0x00,
    0x69, 0x73, 0x6f, 0x6d, 0x69, 0x73, 0x6f, 0x32,
    0x61, 0x76, 0x63, 0x31, 0x6d, 0x70, 0x34, 0x31
  ]);
  const dummyPayload = Buffer.concat([ftypBox, Buffer.alloc(50000, 0)]);
  fs.writeFileSync(dummyVideoPath, dummyPayload);

  // Find the Title input by label or placeholder
  console.log('Filling lecture title...');
  const titleInput = page.locator('input[placeholder*="المحاضرة 4:"]').first();
  await titleInput.fill('محاضرة حقيقية كاملة لا تمسح');

  // Select File
  console.log('Selecting video file...');
  const fileInput = page.locator('input[type="file"][accept*="video"]').first();
  await fileInput.setInputFiles(dummyVideoPath);

  // Wait 4 seconds for upload and verification
  console.log('Waiting 5s for upload...');
  await page.waitForTimeout(5000);

  // Click Publish
  console.log('Clicking Publish Button...');
  const publishBtn = page.locator('#publish-lecture-submit-btn').first();
  await publishBtn.click();
  await page.waitForTimeout(2000);

  // Check localStorage lectures
  const lecsInStorage = await page.evaluate(() => {
    return JSON.parse(localStorage.getItem('ms_lectures') || '[]');
  });
  console.log('Count in localStorage after publish:', lecsInStorage.length);
  if (lecsInStorage.length > 0) {
    console.log('Top lecture:', {
      id: lecsInStorage[0].id,
      title: lecsInStorage[0].title,
      stageId: lecsInStorage[0].stageId,
      videoUrl: lecsInStorage[0].videoUrl,
      videoStatus: lecsInStorage[0].videoStatus
    });
  }

  // Now wait 5 seconds and reload page to see if it vanishes!
  console.log('Waiting 3s before reload...');
  await page.waitForTimeout(3000);
  console.log('Reloading page...');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const afterReloadLecs = await page.evaluate(() => {
    return JSON.parse(localStorage.getItem('ms_lectures') || '[]');
  });
  console.log('Count in localStorage after reload:', afterReloadLecs.length);
  console.log('Did "محاضرة حقيقية كاملة لا تمسح" survive?', afterReloadLecs.some(l => l.title === 'محاضرة حقيقية كاملة لا تمسح'));

  await browser.close();
  try { fs.unlinkSync(dummyVideoPath); } catch (_) {}
}

testUserUploadFlow().catch(console.error);
