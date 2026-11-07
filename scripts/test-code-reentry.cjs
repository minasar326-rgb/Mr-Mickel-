const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'ar-EG' });
  const uid = 'kWL0N03jBAdq09lJL0LFrYQhrNd2';
  const stageId = 'stage-1793823838440';
  const month1Id = 'sec-1794003102422';
  const code = '1969623616';

  await context.addInitScript(({ uid, stgId, m1Id, code }) => {
    sessionStorage.setItem('ms_dev_bypass', 'true');
    const subRecord = {
      userId: uid, targetId: m1Id, courseId: m1Id, stageId: stgId, targetTitle: 'شرح الوحده الخامسه',
      codeType: 'month', activationCode: code, startDate: '2026-11-06T22:00:00.000Z',
      expirationDate: '2099-12-31T23:59:59.999Z', expiresAt: '2099-12-31T23:59:59.999Z',
      isPermanent: true, durationDays: 36500, status: 'active', subscribed: true
    };
    const studentUser = { uid, id: uid, name: 'Mina Sar', email: 'minasar326@gmail.com', role: 'student', subscriptions: { [m1Id]: subRecord } };
    localStorage.setItem('ms_active_uid', uid);
    localStorage.setItem('madarek_role', 'student');
    localStorage.setItem('madarek_user', JSON.stringify(studentUser));
    localStorage.setItem('ms_permanent_subs_' + uid, JSON.stringify({ [m1Id]: subRecord }));

    const codes = [{
      code: code, targetId: m1Id, stageId: stgId, targetTitle: 'شرح الوحده الخامسه', codeType: 'month',
      isUsed: true, usedCount: 1, usedByUid: uid, usedBy: 'Mina Sar', usedByEmail: 'minasar326@gmail.com',
      usedAt: '2026-11-06T22:00:00.000Z', maxUses: 1, isActive: true
    }];
    localStorage.setItem('ms_codes', JSON.stringify(codes));
  }, { uid, stgId: stageId, m1Id: month1Id, code });

  const page = await context.newPage();
  await page.goto('http://localhost:4173/#/stage-lectures?stageId=' + stageId, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Click on 'شحن كود'
  const rechargeBtns = await page.$$('button');
  for (const btn of rechargeBtns) {
    const btnText = await btn.innerText();
    if (btnText.includes('شحن كود')) {
      await btn.click();
      break;
    }
  }
  await page.waitForTimeout(1000);

  // Fill in the code
  const codeInput = await page.$('input[placeholder*="10"]') || await page.$('input[type="text"]');
  if (codeInput) {
    await codeInput.fill(code);
    await page.waitForTimeout(500);
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) {
      await submitBtn.click();
      await page.waitForTimeout(4500);
    }
  }

  // Find modal card text
  const modalText = await page.evaluate(() => {
    const card = document.querySelector('.card-modal-responsive') || document.querySelector('.card');
    return card ? card.innerText : document.body.innerText;
  });

  console.log('--- MODAL RESULT AFTER ENTERING CODE ---');
  console.log(modalText);

  // Capture screenshot of the modal
  const screenshotPath = path.join(__dirname, '..', 'artifacts', 'verified-code-reentry-notice.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log('📸 Screenshot saved at:', screenshotPath);

  await browser.close();
})();
