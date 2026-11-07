const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

function createDistServer(port = 4195) {
  const distDir = path.join(__dirname, '..', 'dist');
  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/' || !path.extname(reqPath)) reqPath = '/index.html';
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
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      fs.createReadStream(path.join(distDir, 'index.html')).pipe(res);
    }
  });
  return new Promise((r) => server.listen(port, () => r(server)));
}

(async () => {
  console.log('🚀 TESTING MULTI-MONTH ISOLATION WITH 2 MONTHS IN SAME STAGE...\n');
  const port = 4195;
  const server = await createDistServer(port);

  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'ar-EG' });

  const studentUid = 'student_isolated_test';
  const stageId = 'stage-1793823838440';
  const month1Id = 'sec-1794003102422'; // Month 1
  const month2Id = 'sec-1794003485324'; // Month 2

  await context.addInitScript(({ uid, stgId, m1Id, m2Id }) => {
    sessionStorage.setItem('ms_dev_bypass', 'true');

    // Both Month 1 and Month 2 belong to stage-1793823838440 (خامسه ابتدائى)
    const customSections = [
      {
        id: m1Id,
        stageId: stgId,
        stageName: 'خامسه ابتدائى',
        type: 'month',
        monthNumber: 1,
        title: 'شرح الوحده الخامسه (شهر 1)',
        price: 30,
        isVisible: true,
        order: 1
      },
      {
        id: m2Id,
        stageId: stgId,
        stageName: 'خامسه ابتدائى',
        type: 'month',
        monthNumber: 2,
        title: 'شرح الوحده السادسه (شهر 2)',
        price: 35,
        isVisible: true,
        order: 2
      }
    ];

    const customLectures = [
      {
        id: 'lec-m1-01',
        title: 'محاضرة 1 - شهر 1',
        sectionId: m1Id,
        stageId: stgId,
        isFree: false,
        duration: '25 دقيقة'
      },
      {
        id: 'lec-m2-01',
        title: 'محاضرة 1 - شهر 2',
        sectionId: m2Id,
        stageId: stgId,
        isFree: false,
        duration: '30 دقيقة'
      }
    ];

    localStorage.setItem('ms_sections', JSON.stringify(customSections));
    localStorage.setItem('ms_lectures', JSON.stringify(customLectures));

    // Student has subscription ONLY for Month 1
    const subRecord = {
      userId: uid,
      targetId: m1Id,
      courseId: m1Id,
      stageId: stgId,
      targetTitle: 'شرح الوحده الخامسه (شهر 1)',
      codeType: 'month',
      activationCode: '1969623616',
      startDate: '2026-11-01T10:00:00.000Z',
      expirationDate: '2099-12-31T23:59:59.999Z',
      expiresAt: '2099-12-31T23:59:59.999Z',
      isPermanent: true,
      durationDays: 36500,
      status: 'active',
      subscribed: true
    };

    const studentUser = {
      uid: uid,
      id: uid,
      name: 'كريم أحمد',
      email: 'karim@test.com',
      role: 'student',
      subscriptions: {
        [m1Id]: subRecord
      }
    };

    localStorage.setItem('ms_active_uid', uid);
    localStorage.setItem('madarek_role', 'student');
    localStorage.setItem('madarek_user', JSON.stringify(studentUser));
    localStorage.setItem(`ms_permanent_subs_${uid}`, JSON.stringify({ [m1Id]: subRecord }));
  }, { uid: studentUid, stgId: stageId, m1Id: month1Id, m2Id: month2Id });

  const page = await context.newPage();
  await page.goto(`http://localhost:${port}/#/stage-lectures?stageId=${stageId}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  const testResults = await page.evaluate(({ m1Id, m2Id }) => {
    const bodyText = document.body.innerText;

    const hasMonth1 = bodyText.includes('شهر 1');
    const hasMonth2 = bodyText.includes('شهر 2');

    // Month 1 should show green active badge
    const month1SubscribedBadge = bodyText.includes('مفتوح ضمن اشتراكك') || bodyText.includes('مشاهدة المحاضرة');

    // Month 2 should show locked price / whatsapp / recharge button
    const month2LockedNotice = bodyText.includes('اشتراك عبر واتساب (35 ج.م)') || bodyText.includes('شحن كود 🔑') || bodyText.includes('يتطلب اشتراك');

    // The entire stage must NOT be unlocked
    const stageUnconditionalUnlocked = bodyText.includes('أنت مشترك بالفعل في المرحلة بالكامل');

    return {
      hasMonth1,
      hasMonth2,
      month1SubscribedBadge,
      month2LockedNotice,
      stageUnconditionalUnlocked,
      bodyTextSnippet: bodyText.slice(0, 1500)
    };
  }, { m1Id: month1Id, m2Id: month2Id });

  console.log('📊 TEST RESULTS:');
  console.log('   - Month 1 detected on page:', testResults.hasMonth1 ? '✅ YES' : '❌ NO');
  console.log('   - Month 2 detected on page:', testResults.hasMonth2 ? '✅ YES' : '❌ NO');
  console.log('   - Month 1 shows as UNLOCKED / subscribed:', testResults.month1SubscribedBadge ? '✅ PASSED' : '❌ FAILED');
  console.log('   - Month 2 shows as LOCKED (requires code/recharge):', testResults.month2LockedNotice ? '✅ PASSED' : '❌ FAILED');
  console.log('   - Entire stage is NOT mistakenly marked as subscribed:', !testResults.stageUnconditionalUnlocked ? '✅ PASSED' : '❌ FAILED');

  const allPassed = testResults.hasMonth1 && testResults.hasMonth2 && testResults.month1SubscribedBadge && testResults.month2LockedNotice && !testResults.stageUnconditionalUnlocked;
  console.log('\n======================================================');
  if (allPassed) {
    console.log('🎉 PERFECT SUCCESS: Multi-Month isolation works 100%!');
    console.log('Subscribing to Month 1 ONLY unlocks Month 1.');
    console.log('Month 2 remains strictly locked until purchased with a separate code.');
  } else {
    console.log('⚠️ Check results above.');
  }
  console.log('======================================================\n');

  await browser.close();
  server.close();
})();
