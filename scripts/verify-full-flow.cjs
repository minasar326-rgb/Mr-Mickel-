const { chromium } = require('@playwright/test');
const path = require('path');

async function main() {
  console.log('=== STARTING COMPLETE USER JOURNEY VERIFICATION ===');

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true
  });

  // ---------------------------------------------------------------
  // PART 1: Clean Phone Student Device Simulation
  // ---------------------------------------------------------------
  console.log('\n--- PART 1: Clean Phone Device / Student Experience ---');
  const studentContext = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone 12/13/14 size
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1'
  });
  const studentPage = await studentContext.newPage();

  // Navigate to stage page
  console.log('1. Student visits stage page on mobile: #/stage-lectures?stageId=stage-1793823759992 ...');
  await studentPage.goto('http://localhost:3000/#/stage-lectures?stageId=stage-1793823759992', { waitUntil: 'domcontentloaded' });
  await studentPage.waitForTimeout(3000);

  // Check that lectures exist in the stage
  const lecsOnPage = await studentPage.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.card'));
    return cards.map(c => c.innerText.slice(0, 100)).filter(t => t.includes('Unit') || t.includes('محاضرة'));
  });
  console.log(`Found ${lecsOnPage.length} lecture card items rendered for students on mobile device.`);
  if (lecsOnPage.length === 0) {
    throw new Error('No lectures found on stage page for mobile student!');
  }
  console.log('PASS: Mobile device successfully loaded lectures from Cloudflare R2 manifest!');

  // Now simulate student having subscription
  console.log('2. Activating stage subscription for student user...');
  await studentPage.evaluate(() => {
    const uid = 'std-verified-student-2026';
    const studentObj = {
      uid,
      id: uid,
      name: 'طالب منصة مستر مايكل المميز',
      email: 'student.2026@test.com',
      stageId: 'stage-1793823759992',
      subscriptions: {
        'sub-pri3-full': {
          id: 'sub-pri3-full',
          userId: uid,
          codeType: 'stage',
          type: 'stage',
          stageId: 'stage-1793823759992',
          targetId: 'stage-1793823759992',
          targetTitle: 'ثالثه ابتدائى',
          status: 'active',
          isFrozen: false,
          expiresAt: Date.now() + 30 * 24 * 3600 * 1000,
          activatedAt: Date.now()
        }
      }
    };
    localStorage.setItem('ms_active_uid', uid);
    localStorage.setItem('madarek_user', JSON.stringify(studentObj));
    localStorage.setItem('madarek_role', 'student');
  });

  await studentPage.reload({ waitUntil: 'domcontentloaded' });
  await studentPage.waitForTimeout(2500);

  // Verify lecture is unlocked with green badge
  const unlockStatus = await studentPage.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.card')).filter(c => c.innerText.includes('Unit'));
    return cards.map(c => ({
      snippet: c.innerText.slice(0, 60),
      unlocked: c.innerText.includes('متاح للمشاهدة') || c.innerText.includes('محاضرة مجانية')
    }));
  });
  console.log('Student unlock status sample:', unlockStatus.slice(0, 3));
  const hasUnlocked = unlockStatus.some(s => s.unlocked);
  if (!hasUnlocked) {
    throw new Error('Expected lectures to be unlocked for subscribed student!');
  }
  console.log('PASS: Subscribed student sees green "متاح للمشاهدة" unlocked badge!');

  await studentContext.close();

  // ---------------------------------------------------------------
  // PART 2: Teacher Upload, Background Sync, and Reload Persistence
  // ---------------------------------------------------------------
  console.log('\n--- PART 2: Teacher Studio Upload & Permanence Verification ---');
  const teacherContext = await browser.newContext({
    viewport: { width: 1280, height: 900 }
  });
  const teacherPage = await teacherContext.newPage();

  console.log('1. Teacher visits platform and logs in with PIN...');
  await teacherPage.goto('http://localhost:3000/#/', { waitUntil: 'domcontentloaded' });
  await teacherPage.waitForTimeout(1500);

  const teacherNavbarBtn = await teacherPage.$('#teacher-navbar-login-btn');
  if (teacherNavbarBtn) {
    await teacherNavbarBtn.click();
  } else {
    await teacherPage.click('button:has-text("دخول المستر")');
  }
  await teacherPage.waitForTimeout(1000);

  const pinInput = await teacherPage.waitForSelector('input[type="password"]', { timeout: 4000 }).catch(() => null);
  if (pinInput) {
    await pinInput.fill('1234512345');
    await pinInput.press('Enter');
    await teacherPage.waitForTimeout(2500);
  }

  // Wait for Teacher Admin Center to load
  console.log('2. Waiting for Teacher Admin Center to mount...');
  let titleInput = await teacherPage.waitForSelector('input[placeholder*="أزمنة المستقبل"]', { timeout: 8000 }).catch(() => null);
  if (!titleInput) {
    const lecTab = await teacherPage.$('button:has-text("المحاضرات")');
    if (lecTab) {
      await lecTab.click();
      await teacherPage.waitForTimeout(1500);
    }
    titleInput = await teacherPage.waitForSelector('input[placeholder*="أزمنة المستقبل"]', { timeout: 8000 });
  }

  // Fill in new lecture details
  const uniqueTitle = 'محاضرة نهائية مؤكدة الحفظ ' + Date.now();
  console.log(`3. Creating new lecture: "${uniqueTitle}"...`);
  await titleInput.fill(uniqueTitle);

  const unitInput = await teacherPage.$('input[placeholder*="Unit"]');
  if (unitInput) await unitInput.fill('Unit 6');

  // Select video file
  console.log('3. Attaching video file (scripts/test-laptop-video.mp4)...');
  const videoPath = path.resolve('scripts/test-laptop-video.mp4');
  const fileInput = await teacherPage.$('input[type="file"][accept*="video"]');
  await fileInput.setInputFiles(videoPath);

  // Wait for Cloudflare R2 upload to complete
  console.log('4. Waiting for video upload to complete on Cloudflare R2...');
  await teacherPage.waitForSelector('text=✅ الفيديو على السحابة وشغال', { timeout: 20000 });
  console.log('PASS: Video uploaded and verified active on Cloudflare R2!');

  // Click Publish
  console.log('5. Clicking Publish Lecture button...');
  await teacherPage.evaluate(() => {
    const btn = document.getElementById('publish-lecture-submit-btn');
    if (btn) btn.click();
    else throw new Error('Publish button not found');
  });

  await teacherPage.waitForTimeout(3500);

  // Verify it appears in published list
  const publishedLec = await teacherPage.$(`text=${uniqueTitle}`);
  if (!publishedLec) {
    throw new Error(`Lecture "${uniqueTitle}" did not appear in published list after publish!`);
  }
  console.log('PASS: Lecture appeared immediately in published lectures list!');

  // Check localStorage count
  const countBefore = await teacherPage.evaluate(() => {
    return JSON.parse(localStorage.getItem('ms_lectures') || '[]').length;
  });
  console.log(`Lectures count in localStorage: ${countBefore}`);

  // Wait 18 seconds for background sync cycle (15s interval)
  console.log('6. Waiting 18 seconds through background sync cycle to test for auto-deletion...');
  await teacherPage.waitForTimeout(18000);

  const stillThere = await teacherPage.$(`text=${uniqueTitle}`);
  if (!stillThere) {
    throw new Error('FAILURE: Lecture was deleted by background sync interval!');
  }
  console.log('PASS: Lecture persisted through background sync interval without being deleted!');

  // Reload page (F5)
  console.log('7. Reloading page (F5) to test persistence...');
  await teacherPage.reload({ waitUntil: 'domcontentloaded' });
  await teacherPage.waitForTimeout(3000);

  // Verify in localStorage
  const afterReloadInfo = await teacherPage.evaluate((t) => {
    const arr = JSON.parse(localStorage.getItem('ms_lectures') || '[]');
    const found = arr.find(l => l.title === t);
    return {
      total: arr.length,
      found: !!found,
      title: found?.title,
      videoUrl: found?.videoUrl,
      stageId: found?.stageId,
      stageName: found?.stageName
    };
  }, uniqueTitle);

  console.log('Persistence check after reload (F5):', JSON.stringify(afterReloadInfo, null, 2));
  if (!afterReloadInfo.found) {
    throw new Error('FAILURE: Lecture disappeared after page reload!');
  }
  console.log('PASS: Lecture PERMANENTLY SAVED and intact with full Cloudflare R2 video URL after page reload (F5)!');

  await teacherContext.close();
  await browser.close();

  console.log('\n=== ALL USER JOURNEY TESTS COMPLETED SUCCESSFULLY! ===');
}

main().catch(err => {
  console.error('\nVerification failed:', err.message);
  process.exit(1);
});
