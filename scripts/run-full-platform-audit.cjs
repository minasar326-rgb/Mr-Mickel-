const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('🚀 INITIATING FULL END-TO-END PLATFORM READINESS AUDIT FOR MR. MICHAEL LMS...\n');
  const port = 4173;
  const baseUrl = `http://localhost:${port}`;
  const artifactsDir = path.join(__dirname, '..', 'artifacts');
  if (!fs.existsSync(artifactsDir)) fs.mkdirSync(artifactsDir, { recursive: true });

  const browser = await chromium.launch({ channel: 'msedge', headless: true });

  const auditReport = {
    landingPage: false,
    visitorLockedView: false,
    studentSubscribedView: false,
    monthIsolation: false,
    videoStreaming: false,
    codeRedemptionModal: false,
    screenshots: {}
  };

  // -------------------------------------------------------------------------
  // 1. Audit Landing Page (Clean Context)
  // -------------------------------------------------------------------------
  console.log('1️⃣ Auditing Landing Page...');
  const visitorContext = await browser.newContext({ viewport: { width: 1366, height: 850 }, locale: 'ar-EG' });
  const visitorPage = await visitorContext.newPage();

  await visitorPage.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
  await visitorPage.waitForTimeout(2000);

  const landingText = await visitorPage.innerText('body');
  const hasTeacherBrand = landingText.includes('Michael Shehata') || landingText.includes('The Master');
  const hasStages = landingText.includes('خامسه ابتدائى') || landingText.includes('الصفوف الدراسية');
  auditReport.landingPage = hasTeacherBrand && hasStages;
  console.log(`   - Landing Page Brand & Stages Loaded: ${auditReport.landingPage ? '✅ PASS' : '❌ FAIL'}`);

  const landingShot = path.join(artifactsDir, 'platform-audit-landing.png');
  await visitorPage.screenshot({ path: landingShot, fullPage: false });
  auditReport.screenshots.landing = landingShot;

  // -------------------------------------------------------------------------
  // 2. Audit Visitor Locked View (سنة خامسة)
  // -------------------------------------------------------------------------
  console.log('\n2️⃣ Auditing Visitor Locked View (سنة خامسة)...');
  await visitorPage.goto(`${baseUrl}/#/stage-lectures?stageId=stage-1793823838440`, { waitUntil: 'domcontentloaded' });
  await visitorPage.waitForTimeout(2000);

  const visitorText = await visitorPage.innerText('body');
  const isGuestLocked = visitorText.includes('المرحلة مقفلة') || visitorText.includes('اشتراك عبر واتساب') || visitorText.includes('شحن كود');
  const noVipBanner = !visitorText.includes('أنت حالياً مشترك رسمي في المنصة');
  auditReport.visitorLockedView = isGuestLocked && noVipBanner;
  console.log(`   - Visitor View Strictly Locked: ${auditReport.visitorLockedView ? '✅ PASS' : '❌ FAIL'}`);

  const visitorShot = path.join(artifactsDir, 'platform-audit-visitor-locked.png');
  await visitorPage.screenshot({ path: visitorShot, fullPage: false });
  auditReport.screenshots.visitor = visitorShot;
  await visitorContext.close();

  // -------------------------------------------------------------------------
  // 3. Audit Student VIP Subscribed View & Month Isolation (Subscribed Context)
  // -------------------------------------------------------------------------
  console.log('\n3️⃣ Auditing Student VIP View & Strict Month Isolation...');
  const studentUid = 'audit_student_vip_001';
  const stageId = 'stage-1793823838440';
  const month1Id = 'sec-1794003102422';
  const month2Id = 'sec-1794003485324';
  const code = '1969623616';

  const studentContext = await browser.newContext({ viewport: { width: 1366, height: 850 }, locale: 'ar-EG' });
  await studentContext.addInitScript(({ uid, stgId, m1Id, m2Id, codeStr }) => {
    sessionStorage.setItem('ms_dev_bypass', 'true');

    // 2 months in stage
    const customSections = [
      { id: m1Id, stageId: stgId, stageName: 'خامسه ابتدائى', type: 'month', monthNumber: 1, title: 'شرح الوحده الخامسه (شهر 1)', price: 30, isVisible: true, order: 1 },
      { id: m2Id, stageId: stgId, stageName: 'خامسه ابتدائى', type: 'month', monthNumber: 2, title: 'شرح الوحده السادسه (شهر 2)', price: 35, isVisible: true, order: 2 }
    ];
    const customLectures = [
      {
        id: 'lec-1794001152669',
        title: 'شرح قاعده المقارنه الجزء الاول ',
        sectionId: m1Id,
        stageId: stgId,
        isFree: false,
        duration: '12 دقيقة',
        videoUrl: 'https://pub-6209dd5b4b61403592d78976eb48cac8.r2.dev/stages/stage-1793823838440/lectures/videos/1793998629056_1106_1__faststart.mp4'
      },
      {
        id: 'lec-audit-m2-01',
        title: 'محاضرة 1 - شهر 2',
        sectionId: m2Id,
        stageId: stgId,
        isFree: false,
        duration: '20 دقيقة'
      }
    ];
    localStorage.setItem('ms_sections', JSON.stringify(customSections));
    localStorage.setItem('ms_lectures', JSON.stringify(customLectures));

    // Student subscribed ONLY to Month 1
    const subRecord = {
      userId: uid, targetId: m1Id, courseId: m1Id, stageId: stgId,
      targetTitle: 'شرح الوحده الخامسه (شهر 1)', codeType: 'month',
      activationCode: codeStr, startDate: '2026-11-06T12:00:00.000Z',
      expirationDate: '2099-12-31T23:59:59.999Z', expiresAt: '2099-12-31T23:59:59.999Z',
      isPermanent: true, durationDays: 36500, status: 'active', subscribed: true
    };
    const studentUser = { uid, id: uid, name: 'محمد كريم', email: 'mohamed.karim@test.com', role: 'student', subscriptions: { [m1Id]: subRecord } };
    localStorage.setItem('ms_active_uid', uid);
    localStorage.setItem('madarek_role', 'student');
    localStorage.setItem('madarek_user', JSON.stringify(studentUser));
    localStorage.setItem(`ms_permanent_subs_${uid}`, JSON.stringify({ [m1Id]: subRecord }));

    const codes = [{
      code: codeStr, targetId: m1Id, stageId: stgId, targetTitle: 'شرح الوحده الخامسه (شهر 1)', codeType: 'month',
      isUsed: true, usedCount: 1, usedByUid: uid, usedBy: 'محمد كريم', usedByEmail: 'mohamed.karim@test.com',
      usedAt: '2026-11-06T12:00:00.000Z', maxUses: 1, isActive: true
    }];
    localStorage.setItem('ms_codes', JSON.stringify(codes));
  }, { uid: studentUid, stgId: stageId, m1Id: month1Id, m2Id: month2Id, codeStr: code });

  const studentPage = await studentContext.newPage();
  await studentPage.goto(`${baseUrl}/#/stage-lectures?stageId=${stageId}`, { waitUntil: 'domcontentloaded' });
  await studentPage.waitForTimeout(2500);

  const vipText = await studentPage.innerText('body');
  const hasVipBanner = vipText.includes('أنت حالياً مشترك رسمي في المنصة') || vipText.includes('أهلاً بك يا محمد كريم');
  const m1Open = vipText.includes('مفتوح ضمن اشتراكك') || vipText.includes('مشاهدة المحاضرة والواجبات الآن');
  const m2Locked = vipText.includes('المحاضرة مقفلة') || vipText.includes('الاشتراك عبر واتساب المستر') || vipText.includes('تتطلب الاشتراك في الشهر');

  auditReport.studentSubscribedView = hasVipBanner && m1Open;
  auditReport.monthIsolation = m1Open && m2Locked;
  console.log(`   - Student VIP Welcome & Month 1 Open: ${auditReport.studentSubscribedView ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   - Strict Month Isolation (Month 1 Open vs Month 2 Locked): ${auditReport.monthIsolation ? '✅ PASS' : '❌ FAIL'}`);

  const vipShot = path.join(artifactsDir, 'platform-audit-vip-student.png');
  await studentPage.screenshot({ path: vipShot, fullPage: false });
  auditReport.screenshots.vip = vipShot;

  // -------------------------------------------------------------------------
  // 4. Audit Real Video Streaming
  // -------------------------------------------------------------------------
  console.log('\n4️⃣ Auditing Real Video Streaming (lec-1794001152669)...');
  await studentPage.goto(`${baseUrl}/#/lecture-room?lectureId=lec-1794001152669`, { waitUntil: 'domcontentloaded' });
  await studentPage.waitForTimeout(3000);

  const videoEvaluation = await studentPage.evaluate(() => {
    const video = document.querySelector('video');
    const text = document.body.innerText;
    const isLocked = text.includes('المحتوى محمي') || text.includes('تتطلب هذه المحاضرة اشتراكاً');
    return {
      hasVideo: Boolean(video),
      videoSrc: video ? video.getAttribute('src') : null,
      isLocked
    };
  });

  auditReport.videoStreaming = videoEvaluation.hasVideo && !videoEvaluation.isLocked && Boolean(videoEvaluation.videoSrc);
  console.log(`   - Video Stream Loaded: ${auditReport.videoStreaming ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   - Video Source: ${videoEvaluation.videoSrc}`);

  const videoShot = path.join(artifactsDir, 'platform-audit-video-player.png');
  await studentPage.screenshot({ path: videoShot, fullPage: false });
  auditReport.screenshots.video = videoShot;

  // -------------------------------------------------------------------------
  // 5. Audit Code Redemption Modal & Single-Use Warning
  // -------------------------------------------------------------------------
  console.log('\n5️⃣ Auditing Code Recharge Modal & Re-Entry Protection...');
  await studentPage.goto(`${baseUrl}/#/stage-lectures?stageId=${stageId}`, { waitUntil: 'domcontentloaded' });
  await studentPage.waitForTimeout(1500);

  const rechargeBtns = await studentPage.$$('button');
  for (const btn of rechargeBtns) {
    const text = await btn.innerText();
    if (text.includes('شحن كود')) {
      await btn.click();
      break;
    }
  }
  await studentPage.waitForTimeout(800);

  const codeInput = await studentPage.$('input[placeholder*="10"]') || await studentPage.$('input[type="text"]');
  if (codeInput) {
    await codeInput.fill(code);
    await studentPage.waitForTimeout(300);
    const submitBtn = await studentPage.$('button[type="submit"]');
    if (submitBtn) {
      await submitBtn.click();
      await studentPage.waitForTimeout(4500);
    }
  }

  const modalText = await studentPage.evaluate(() => {
    const modalEl = document.querySelector('.card-modal-responsive');
    return modalEl ? modalEl.innerText : '';
  });

  const hasReentryWarning = modalText.includes('تنبيه بشأن كود الشهر') || modalText.includes('لا يمكن استخدام هذا الكود لفتح أي شهر آخر') || modalText.includes('الاشتراك مفعّل بحسابك بالفعل');
  auditReport.codeRedemptionModal = hasReentryWarning;
  console.log(`   - Code Re-entry Warning & One-Month Enforcement: ${auditReport.codeRedemptionModal ? '✅ PASS' : '❌ FAIL'}`);

  const modalShot = path.join(artifactsDir, 'platform-audit-code-modal.png');
  await studentPage.screenshot({ path: modalShot, fullPage: false });
  auditReport.screenshots.modal = modalShot;

  await studentContext.close();
  await browser.close();

  console.log('\n=============================================================');
  console.log('🏁 FINAL AUDIT SUMMARY:');
  console.log('   1. Landing Page:            ', auditReport.landingPage ? '✅ PASS' : '❌ FAIL');
  console.log('   2. Visitor Locked View:      ', auditReport.visitorLockedView ? '✅ PASS' : '❌ FAIL');
  console.log('   3. Student VIP View:         ', auditReport.studentSubscribedView ? '✅ PASS' : '❌ FAIL');
  console.log('   4. Strict Month Isolation:   ', auditReport.monthIsolation ? '✅ PASS' : '❌ FAIL');
  console.log('   5. Real Video Streaming:     ', auditReport.videoStreaming ? '✅ PASS' : '❌ FAIL');
  console.log('   6. Code Re-Entry Protection: ', auditReport.codeRedemptionModal ? '✅ PASS' : '❌ FAIL');
  console.log('=============================================================\n');

  fs.writeFileSync(path.join(artifactsDir, 'platform-audit-results.json'), JSON.stringify(auditReport, null, 2), 'utf8');
})();
