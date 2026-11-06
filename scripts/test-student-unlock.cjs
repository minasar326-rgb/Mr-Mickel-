const { chromium } = require('@playwright/test');

async function testStudentUnlock() {
  console.log('=== TESTING STUDENT SUBSCRIPTION UNLOCK ===');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 1. Set a student in localStorage with active subscription to pri-3
  console.log('1. Setting student user with active pri-3 subscription...');
  await page.goto('http://localhost:3000/#/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  await page.evaluate(() => {
    const uid = 'std-test-pri3-123';
    const studentUser = {
      uid,
      id: uid,
      name: 'طالب الصف الثالث الابتدائي المتميز',
      email: 'student.pri3@test.com',
      stageId: 'pri-3',
      subscriptions: {
        'sub-pri3': {
          id: 'sub-pri3',
          userId: uid,
          codeType: 'stage',
          type: 'stage',
          stageId: 'pri-3',
          targetId: 'pri-3',
          targetTitle: 'الصف الثالث الابتدائي',
          status: 'active',
          isFrozen: false,
          expiresAt: Date.now() + 30 * 24 * 3600 * 1000,
          activatedAt: Date.now()
        }
      }
    };
    localStorage.setItem('ms_active_uid', uid);
    localStorage.setItem('madarek_user', JSON.stringify(studentUser));
    localStorage.setItem('madarek_role', 'student');
  });

  // 2. Navigate to stage lectures page for pri-3
  console.log('2. Navigating to stage-lectures?stageId=pri-3 as subscribed student...');
  await page.goto('http://localhost:3000/#/stage-lectures?stageId=pri-3', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  // 3. Inspect cards on the page to see if lecture is unlocked
  const cardData = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.card')).filter(c => c.innerText.includes('فحص الاستقرار'));
    return cards.map(c => ({
      textSnippet: c.innerText.slice(0, 150),
      isUnlockedGreenBadge: c.innerText.includes('متاح للمشاهدة') || c.innerText.includes('محاضرة مجانية'),
      isLockedBadge: c.innerText.includes('باشتراك')
    }));
  });

  console.log('Card data for test lectures:', JSON.stringify(cardData, null, 2));

  const allUnlocked = cardData.length > 0 && cardData.every(c => c.isUnlockedGreenBadge);
  if (allUnlocked) {
    console.log('PASS: ALL matching lectures are UNLOCKED with green badge for subscribed student!');
  } else {
    console.log('FAIL or partial lock:', cardData);
  }

  // 4. Now also test with the custom stage ID in the student subscription: stage-1793823759992
  console.log('4. Testing student with custom stage ID stage-1793823759992 subscription...');
  await page.evaluate(() => {
    const uid = 'std-test-custom-123';
    const studentUser = {
      uid,
      id: uid,
      name: 'طالب بالمرحلة المضافة',
      email: 'student.custom@test.com',
      stageId: 'stage-1793823759992',
      subscriptions: {
        'sub-custom': {
          id: 'sub-custom',
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
    localStorage.setItem('madarek_user', JSON.stringify(studentUser));
    localStorage.setItem('madarek_role', 'student');
  });

  await page.goto('http://localhost:3000/#/stage-lectures?stageId=stage-1793823759992', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  const customCardData = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.card')).filter(c => c.innerText.includes('فحص الاستقرار'));
    return cards.map(c => ({
      textSnippet: c.innerText.slice(0, 150),
      isUnlockedGreenBadge: c.innerText.includes('متاح للمشاهدة') || c.innerText.includes('محاضرة مجانية'),
      isLockedBadge: c.innerText.includes('باشتراك')
    }));
  });

  console.log('Custom stage card data:', JSON.stringify(customCardData, null, 2));
  const customUnlocked = customCardData.length > 0 && customCardData.every(c => c.isUnlockedGreenBadge);
  if (customUnlocked) {
    console.log('PASS: ALL matching lectures on custom stage are UNLOCKED for subscribed student!');
  }

  // 5. Click on the first lecture and verify video player opens and plays R2 video
  console.log('5. Clicking on the lecture card to open player...');
  const lecCard = await page.$('.card:has-text("فحص الاستقرار")');
  if (lecCard) {
    const playBtn = await lecCard.$('button, a, [role="button"], img');
    if (playBtn) await playBtn.click();
    else await lecCard.click();
    await page.waitForTimeout(3000);

    const videoEl = await page.$('video');
    if (videoEl) {
      const vSrc = await videoEl.getAttribute('src');
      console.log('Player opened! Video element src:', vSrc);
      const isR2 = vSrc && vSrc.includes('r2.dev');
      console.log('Video streams from Cloudflare R2:', isR2);
    } else {
      console.log('No video element found on current screen. Hash is:', await page.evaluate(() => window.location.hash));
    }
  }

  await browser.close();
  console.log('=== TEST STUDENT UNLOCK COMPLETE ===');
}

testStudentUnlock().catch(console.error);
