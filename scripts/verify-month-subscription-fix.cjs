const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Simple static file server for dist directory
function createDistServer(port = 4173) {
  const distDir = path.join(__dirname, '..', 'dist');
  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/' || !path.extname(reqPath)) {
      reqPath = '/index.html';
    }
    const filePath = path.join(distDir, reqPath);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath);
      const mimeTypes = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.webmanifest': 'application/manifest+json'
      };
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    } else {
      const fallback = path.join(distDir, 'index.html');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      fs.createReadStream(fallback).pipe(res);
    }
  });

  return new Promise((resolve) => {
    server.listen(port, () => resolve(server));
  });
}

(async () => {
  console.log('🚀 RUNNING COMPREHENSIVE PRACTICAL VERIFICATION OF THE MONTH SUBSCRIPTION FIX...\n');
  const port = 4188;
  const server = await createDistServer(port);
  console.log(`📡 Local preview server listening on http://localhost:${port}`);

  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: 'ar-EG' });

  const studentUid = 'kWL0N03jBAdq09lJL0LFrYQhrNd2';
  const targetMonthId = 'sec-1794003102422';
  const stageId = 'stage-1793823838440';

  // Inject authenticated student with month subscription in local storage
  await context.addInitScript(({ uid, monthId, stage }) => {
    sessionStorage.setItem('ms_dev_bypass', 'true');

    const subRecord = {
      userId: uid,
      targetId: monthId,
      courseId: monthId,
      stageId: stage,
      targetTitle: 'اشتراك: شرح الوحده الخامسه ',
      codeType: 'month',
      activationCode: '1969623616',
      startDate: new Date().toISOString(),
      expirationDate: '2099-12-31T23:59:59.999Z',
      expiresAt: '2099-12-31T23:59:59.999Z',
      isPermanent: true,
      durationDays: 36500,
      status: 'active',
      isPaused: false,
      isCancelled: false,
      isFrozen: false,
      subscribed: true
    };

    const studentUser = {
      uid: uid,
      id: uid,
      name: 'Mina Sar',
      email: 'minasar326@gmail.com',
      role: 'student',
      subscriptions: {
        [monthId]: subRecord
      }
    };

    localStorage.setItem('ms_active_uid', uid);
    localStorage.setItem('madarek_role', 'student');
    localStorage.setItem('madarek_user', JSON.stringify(studentUser));
  }, { uid: studentUid, monthId: targetMonthId, stage: stageId });

  const page = await context.newPage();

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  // Step 1: Navigate to stage lectures
  console.log('1️⃣ Navigating to Stage Lectures page for خامسه ابتدائى...');
  await page.goto(`http://localhost:${port}/#/stage-lectures?stageId=${stageId}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Check that the stage is resolved and not showing "المرحلة غير موجودة"
  const pageTitle = await page.title();
  const pageBody = await page.innerText('body');
  const stageNotFound = pageBody.includes('المرحلة غير موجودة');
  console.log(`   - Stage not found shown: ${stageNotFound ? '❌ FAILED' : '✅ PASSED'}`);

  // Check section subscription status badge
  const hasSubscribedBadge = pageBody.includes('مفتوح ضمن اشتراكك') || pageBody.includes('مشاهدة المحاضرة والواجبات الآن');
  console.log(`   - Month lectures unlocked in stage view: ${hasSubscribedBadge ? '✅ PASSED (Unlocked!)' : '❌ FAILED (Still locked)'}`);

  // Step 2: Open Lecture 1 room
  console.log('\n2️⃣ Navigating directly to Lecture 1 (lec-1794001152669)...');
  await page.goto(`http://localhost:${port}/#/lecture-room?lectureId=lec-1794001152669`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  const lec1Status = await page.evaluate(() => {
    const video = document.querySelector('video');
    const bodyText = document.body.innerText;
    const lock1 = bodyText.includes('المحتوى محمي - تتطلب هذه المحاضرة اشتراكاً مفعّلاً');
    const lock2 = bodyText.includes('يجب تسجيل الدخول بحساب Google أولاً');
    const lock3 = bodyText.includes('المحاضرة مغلقة مؤقتاً (نظام فتح المحاضرات بالتدريج)');
    return {
      hasVideo: Boolean(video),
      videoSrc: video ? video.getAttribute('src') : null,
      isLockShown: lock1 || lock2 || lock3,
      lockReason: lock1 ? 'requires_sub' : lock2 ? 'not_logged_in' : lock3 ? 'progression_locked' : 'none'
    };
  });
  console.log('   - Lecture 1 Video Element Present:', lec1Status.hasVideo ? '✅ YES' : '❌ NO');
  console.log('   - Lecture 1 Video Source:', lec1Status.videoSrc);
  console.log('   - Lecture 1 Lock Screen Shown:', lec1Status.isLockShown ? `❌ YES (${lec1Status.lockReason})` : '✅ NONE (Unlocked!)');

  // Step 3: Open Lecture 2 room
  console.log('\n3️⃣ Navigating directly to Lecture 2 (lec-1794002706071)...');
  await page.goto(`http://localhost:${port}/#/lecture-room?lectureId=lec-1794002706071`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  const lec2Status = await page.evaluate(() => {
    const video = document.querySelector('video');
    const bodyText = document.body.innerText;
    const lock1 = bodyText.includes('المحتوى محمي - تتطلب هذه المحاضرة اشتراكاً مفعّلاً');
    const lock2 = bodyText.includes('يجب تسجيل الدخول بحساب Google أولاً');
    const lock3 = bodyText.includes('المحاضرة مغلقة مؤقتاً (نظام فتح المحاضرات بالتدريج)');
    return {
      hasVideo: Boolean(video),
      videoSrc: video ? video.getAttribute('src') : null,
      isLockShown: lock1 || lock2 || lock3,
      lockReason: lock1 ? 'requires_sub' : lock2 ? 'not_logged_in' : lock3 ? 'progression_locked' : 'none'
    };
  });
  console.log('   - Lecture 2 Video Element Present:', lec2Status.hasVideo ? '✅ YES' : '❌ NO');
  console.log('   - Lecture 2 Video Source:', lec2Status.videoSrc);
  console.log('   - Lecture 2 Lock Screen Shown:', lec2Status.isLockShown ? `❌ YES (${lec2Status.lockReason})` : '✅ NONE (Unlocked!)');

  // Step 4: Page Reload Resilience Test (F5 persistence check)
  console.log('\n4️⃣ Testing Page Reload Persistence (F5)...');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  const afterReloadStatus = await page.evaluate(() => {
    const video = document.querySelector('video');
    const bodyText = document.body.innerText;
    const lock = bodyText.includes('المحتوى محمي') || bodyText.includes('يجب تسجيل الدخول') || bodyText.includes('المحاضرة مغلقة');
    return {
      hasVideo: Boolean(video),
      videoSrc: video ? video.getAttribute('src') : null,
      isLockShown: lock
    };
  });
  console.log('   - Video Remains Open After Page Reload:', afterReloadStatus.hasVideo && !afterReloadStatus.isLockShown ? '✅ 100% PERSISTENT' : '❌ LOST ON RELOAD');

  // Step 5: Test Section ID Navigation fallback in StageLecturesPage
  console.log('\n5️⃣ Testing Section ID Navigation fallback (/#/stage-lectures?stageId=sec-1794003102422)...');
  await page.goto(`http://localhost:${port}/#/stage-lectures?stageId=sec-1794003102422`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  const secNavText = await page.innerText('body');
  const resolvedToStage = secNavText.includes('خامسه ابتدائى') && !secNavText.includes('المرحلة غير موجودة');
  console.log('   - Section ID gracefully resolved to Stage:', resolvedToStage ? '✅ PASSED' : '❌ FAILED');

  await page.screenshot({ path: path.join(__dirname, '..', 'artifacts', 'verified-month-unlocked.png'), fullPage: true });

  await browser.close();
  server.close();

  const allPassed = !stageNotFound && hasSubscribedBadge && lec1Status.hasVideo && !lec1Status.isLockShown && lec2Status.hasVideo && !lec2Status.isLockShown && afterReloadStatus.hasVideo && resolvedToStage;

  console.log('\n======================================================');
  if (allPassed) {
    console.log('🎉 ALL TESTS PASSED (100% SUCCESS)!');
    console.log('The month subscription opens all videos cleanly and persists without any lock issues.');
  } else {
    console.log('⚠️ SOME CHECKS NEED ATTENTION. Review details above.');
  }
  console.log('======================================================\n');
})();
