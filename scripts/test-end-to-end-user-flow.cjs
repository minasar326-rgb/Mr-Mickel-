const { chromium } = require('playwright');
const fs = require('fs');

async function testComprehensiveUserFlow() {
  console.log('=== Starting Comprehensive Video Upload & Multi-Device Playback Test ===');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });

  // -------------------------------------------------------------
  // DEVICE 1: Teacher's Laptop
  // -------------------------------------------------------------
  console.log('\n[Device 1: Teacher Laptop] Opening browser...');
  const teacherContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await teacherContext.addInitScript(() => {
    try { sessionStorage.setItem('ms_dev_bypass', 'true'); } catch (_) {}
  });
  const teacherPage = await teacherContext.newPage();

  teacherPage.on('console', msg => {
    const txt = msg.text();
    if (txt.includes('[DEBUG]') || txt.includes('[R2]') || txt.includes('Error')) {
      console.log('  [Teacher Console]', txt);
    }
  });

  await teacherPage.goto('http://localhost:3000');
  await teacherPage.waitForTimeout(1000);

  // Authenticate as teacher
  await teacherPage.evaluate(() => {
    localStorage.setItem('ms_admin_auth', 'true');
    localStorage.setItem('ms_admin_secure_session', JSON.stringify({
      token: 'test_token_' + Date.now(),
      role: 'teacher_editor',
      expiresAt: Date.now() + 86400000
    }));
  });
  await teacherPage.reload({ waitUntil: 'domcontentloaded' });
  await teacherPage.waitForTimeout(1000);

  // Open Teacher Admin
  const openBtn = teacherPage.locator('button:has-text("دخول المستر")').first();
  if (await openBtn.isVisible().catch(() => false)) {
    await openBtn.click();
    await teacherPage.waitForTimeout(600);
    const pin = teacherPage.locator('input[type="password"]').first();
    if (await pin.isVisible().catch(() => false)) {
      await pin.fill('1234512345');
      await pin.press('Enter');
      await teacherPage.waitForTimeout(1000);
    }
  }

  // Switch to Lectures Studio
  await teacherPage.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button'));
    const lecTab = tabs.find(b => b.innerText && b.innerText.includes('المحاضرات والفيديوهات'));
    if (lecTab) lecTab.click();
  });
  await teacherPage.waitForTimeout(600);

  // Create minimal valid MP4 video payload
  const dummyVideoPath = 'sample-lecture-video.mp4';
  const ftypBox = Buffer.from([
    0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70,
    0x69, 0x73, 0x6f, 0x6d, 0x00, 0x00, 0x02, 0x00,
    0x69, 0x73, 0x6f, 0x6d, 0x69, 0x73, 0x6f, 0x32,
    0x61, 0x76, 0x63, 0x31, 0x6d, 0x70, 0x34, 0x31
  ]);
  const dummyPayload = Buffer.concat([ftypBox, Buffer.alloc(100000, 0)]);
  fs.writeFileSync(dummyVideoPath, dummyPayload);

  const testTitle = 'محاضرة الوحدة الخامسة التجريبية المجانية - المستر 2026';
  console.log('[Device 1: Teacher Laptop] Filling form with title:', testTitle);

  // Fill Title
  const titleInput = teacherPage.locator('input[placeholder*="المحاضرة 4:"]').first();
  await titleInput.fill(testTitle);

  // Select File
  console.log('[Device 1: Teacher Laptop] Selecting video file...');
  const fileInput = teacherPage.locator('input[type="file"][accept*="video"]').first();
  await fileInput.setInputFiles(dummyVideoPath);

  // Mark as free lecture
  console.log('[Device 1: Teacher Laptop] Marking as free lecture...');
  await teacherPage.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const freeBtn = buttons.find(b => b.innerText && (b.innerText.includes('مجانية تجريبية') || b.innerText.includes('مفتوحة للجميع')));
    if (freeBtn) freeBtn.click();
  });

  // Wait for upload & verification
  console.log('[Device 1: Teacher Laptop] Waiting 6s for cloud upload...');
  await teacherPage.waitForTimeout(6000);

  // Click Publish
  console.log('[Device 1: Teacher Laptop] Clicking Publish...');
  const publishBtn = teacherPage.locator('#publish-lecture-submit-btn').first();
  await publishBtn.click();
  await teacherPage.waitForTimeout(2500);

  // Verify Success Banner appeared
  const successCardVisible = await teacherPage.evaluate(() => {
    const text = document.body.innerText;
    return text.includes('تم حفظ ونشر المحاضرة بنجاح تام') || text.includes('محفوظة سحابياً ومثبتة للطلاب');
  });
  console.log('[Device 1: Teacher Laptop] Success Card visible above form:', successCardVisible);

  // Verify in published lectures list
  const inList = await teacherPage.evaluate((title) => {
    const container = document.getElementById('published-lectures-container');
    if (!container) return false;
    return container.innerText.includes(title);
  }, testTitle);
  console.log('[Device 1: Teacher Laptop] Lecture visible in published list:', inList);

  // Get new lecture ID from teacher storage
  const uploadedLec = await teacherPage.evaluate((title) => {
    const lecs = JSON.parse(localStorage.getItem('ms_lectures') || '[]');
    return lecs.find(l => l.title === title);
  }, testTitle);
  console.log('[Device 1: Teacher Laptop] Uploaded lecture details:', uploadedLec ? {
    id: uploadedLec.id,
    title: uploadedLec.title,
    stageId: uploadedLec.stageId,
    duration: uploadedLec.duration,
    isFree: uploadedLec.isFree,
    videoUrl: uploadedLec.videoUrl ? uploadedLec.videoUrl.slice(0, 60) + '...' : 'none'
  } : 'NOT FOUND');

  if (!uploadedLec) {
    throw new Error('Teacher failed to persist lecture to localStorage');
  }

  // -------------------------------------------------------------
  // DEVICE 2: Student's Phone (Separate Browser Context)
  // -------------------------------------------------------------
  console.log('\n[Device 2: Student Phone] Opening clean mobile context...');
  const studentContext = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone viewport
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  });
  await studentContext.addInitScript(() => {
    try { sessionStorage.setItem('ms_dev_bypass', 'true'); } catch (_) {}
  });
  const studentPage = await studentContext.newPage();

  studentPage.on('console', msg => {
    const txt = msg.text();
    if (txt.includes('[DEBUG]') || txt.includes('[R2]') || txt.includes('Error')) {
      console.log('  [Student Console]', txt);
    }
  });

  console.log('[Device 2: Student Phone] Navigating to http://localhost:3000...');
  await studentPage.goto('http://localhost:3000');
  await studentPage.waitForTimeout(2000);

  // Click on the stage button on home page: "دخول محاضرات ..."
  console.log('[Device 2: Student Phone] Entering target stage:', uploadedLec.stageId);
  const stageEntered = await studentPage.evaluate((targetStageId) => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const enterBtn = buttons.find(b => b.innerText && (b.innerText.includes('دخول محاضرات') || b.innerText.includes('محاضراتك')));
    if (enterBtn) {
      enterBtn.click();
      return true;
    }
    return false;
  }, uploadedLec.stageId);
  console.log('[Device 2: Student Phone] Clicked stage button:', stageEntered);
  await studentPage.waitForTimeout(2500);

  // Check if student sees the new lecture
  const studentSeesLecture = await studentPage.evaluate((title) => {
    const bodyText = document.body.innerText;
    return bodyText.includes(title);
  }, testTitle);
  console.log('[Device 2: Student Phone] Did student find the newly uploaded lecture?', studentSeesLecture);

  // Open the lecture in room
  console.log('[Device 2: Student Phone] Opening lecture player room...');
  const watchClicked = await studentPage.evaluate((title) => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const watchBtn = buttons.find(b => b.innerText && (b.innerText.includes('مشاهدة المحاضرة') || b.innerText.includes('مشاهدة')));
    if (watchBtn) {
      watchBtn.click();
      return true;
    }
    return false;
  }, testTitle);
  console.log('[Device 2: Student Phone] Clicked watch lecture button:', watchClicked);
  await studentPage.waitForTimeout(3000);

  // Check duration and video player
  const playerStats = await studentPage.evaluate(() => {
    const text = document.body.innerText;
    const video = document.querySelector('video');
    return {
      hasDurationZero: text.includes('00:00 / 00:00') && !text.includes('1:30'),
      hasValidDuration: text.includes('1:30:00') || text.includes('1:30'),
      hasVideoTag: !!video,
      videoSrc: video ? video.src : '',
      videoError: text.includes('تعذر تشغيل الفيديو')
    };
  });
  console.log('[Device 2: Student Phone] Player room inspection:', playerStats);

  // Clean up test video file
  try { fs.unlinkSync(dummyVideoPath); } catch (_) {}

  await browser.close();
  console.log('\n=== TEST COMPLETE ===');
}

testComprehensiveUserFlow().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
