const { chromium } = require('playwright');

(async () => {
  console.log('🧪 REPRODUCING EXACT USER ISSUE: Month Code Redeemed -> Lectures Access\n');

  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: 'ar-EG' });

  const studentUid = 'kWL0N03jBAdq09lJL0LFrYQhrNd2';
  const targetMonthId = 'sec-1794003102422';
  const stageId = 'stage-1793823838440';

  await context.addInitScript(({ uid, monthId, stage }) => {
    sessionStorage.setItem('ms_dev_bypass', 'true');

    // Simulate logged in student who redeemed month code
    const subRecord = {
      userId: uid,
      targetId: monthId,
      courseId: monthId,
      stageId: stage,
      targetTitle: 'اشتراك: شرح الوحده الخامسه',
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
    
    const expiryDict = {};
    expiryDict[monthId] = subRecord;
    localStorage.setItem('ms_unlocked_with_expiry', JSON.stringify(expiryDict));
  }, { uid: studentUid, monthId: targetMonthId, stage: stageId });

  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error' || msg.text().includes('permission') || msg.text().includes('access')) {
      console.log('Console:', msg.type(), msg.text());
    }
  });

  // Step 1: Open stage lectures page
  console.log('1️⃣ Navigating to Stage Lectures Page...');
  await page.goto(`https://minasar326-rgb.github.io/Mr-Mickel-/#/stage-lectures?stageId=${stageId}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const stageCards = await page.$$('.card');
  console.log(`Discovered ${stageCards.length} cards on stage lectures page.`);

  const cardDetails = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.card'));
    return cards.map(c => ({
      text: c.innerText.replace(/\n+/g, ' | ').slice(0, 150),
      isGreen: c.style.border.includes('16, 185, 129') || c.style.border.includes('#10B981'),
      isAmber: c.style.border.includes('245, 158, 11') || c.style.border.includes('#F59E0B'),
      isRed: c.style.border.includes('239, 68, 68')
    }));
  });

  console.log('Stage Cards Inspection:', JSON.stringify(cardDetails, null, 2));

  // Step 2: Open Lecture 1 Room
  console.log('\n2️⃣ Navigating to Lecture 1 Player Room (lec-1794001152669)...');
  await page.goto(`https://minasar326-rgb.github.io/Mr-Mickel-/#/lecture-room?lectureId=lec-1794001152669`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const playerRoom1 = await page.evaluate(() => {
    const video = document.querySelector('video');
    const bodyText = document.body.innerText;
    return {
      hasVideo: Boolean(video),
      videoSrc: video ? video.getAttribute('src') : null,
      isLockedShown: bodyText.includes('مقفل') || bodyText.includes('تتطلب الاشتراك') || bodyText.includes('يلزم مشاهدة'),
      snippet: bodyText.slice(0, 300).replace(/\n+/g, ' ')
    };
  });
  console.log('Lecture 1 Player Room Status:', JSON.stringify(playerRoom1, null, 2));

  // Step 3: Open Lecture 2 Room
  console.log('\n3️⃣ Navigating to Lecture 2 Player Room (lec-1794002706071)...');
  await page.goto(`https://minasar326-rgb.github.io/Mr-Mickel-/#/lecture-room?lectureId=lec-1794002706071`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const playerRoom2 = await page.evaluate(() => {
    const video = document.querySelector('video');
    const bodyText = document.body.innerText;
    return {
      hasVideo: Boolean(video),
      videoSrc: video ? video.getAttribute('src') : null,
      isLockedShown: bodyText.includes('مقفل') || bodyText.includes('تتطلب الاشتراك') || bodyText.includes('يلزم مشاهدة'),
      snippet: bodyText.slice(0, 300).replace(/\n+/g, ' ')
    };
  });
  console.log('Lecture 2 Player Room Status:', JSON.stringify(playerRoom2, null, 2));

  await browser.close();
})();
