const { chromium } = require('playwright');

async function runTest() {
  console.log('====================================================');
  console.log('🧪 RUNNING VIDEO STREAMING & PAYWALL VERIFICATION');
  console.log('====================================================\n');

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  let passedCount = 0;
  let totalCount = 0;

  function assert(condition, message) {
    totalCount++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passedCount++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
    }
  }

  try {
    // ------------------------------------------------------------------
    // TEST SUITE 1: Guest / Unsubscribed Student Access to Paid Lecture 1
    // Target: 'lec-1794001152669' (شرح قاعده المقارنه الجزء الاول - isFree: false)
    // ------------------------------------------------------------------
    console.log('▶️ SUITE 1: Security & Paywall Protection on Lecture 1 (Unsubscribed Guest)');
    {
      const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, locale: 'ar-EG' });
      const page = await context.newPage();
      await page.goto('http://localhost:3000/#lecture-room?lectureId=lec-1794001152669', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1500);

      // 1.1 Verify Paywall Card is displayed
      const paywallCard = await page.$('.card.text-center');
      assert(paywallCard !== null, 'Paywall card is prominently displayed to unsubscribed visitor');

      // 1.2 Verify NO <video> element exists in DOM (No streaming or media leaks)
      const videoElement = await page.$('video');
      assert(videoElement === null, 'CRITICAL SECURITY: <video> element is completely absent from DOM');

      // 1.3 Verify Lock Badge is present in Header
      const lockBadge = await page.$('span:has-text("محتوى محمي للمشتركين 🔒")');
      assert(lockBadge !== null, 'Header displays "محتوى محمي للمشتركين 🔒" badge');

      // 1.4 Verify Exam button is NOT accessible
      const examButton = await page.$('button:has-text("بدء امتحان المحاضرة")');
      assert(examButton === null, 'Exam button is hidden from unauthorized users');

      // 1.5 Verify Study Tabs (booklet, vocab, homework) are NOT accessible
      const vocabTab = await page.$('button:has-text("معمل النطق والكلمات")');
      assert(vocabTab === null, 'Study tabs (Vocab/Grammar/Booklet/HW) are hidden behind paywall');

      await context.close();
    }


    // ------------------------------------------------------------------
    // TEST SUITE 2: Verification of Newly Uploaded Lecture (اسمع مني) - Must be PAID & Locked
    // Target: 'lec-1794004864599' (اسمع مني - isFree: false)
    // ------------------------------------------------------------------
    console.log('\n▶️ SUITE 2: Verification of Newly Uploaded Lecture (اسمع مني - Strictly PAID & Locked)');
    {
      const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, locale: 'ar-EG' });
      const page = await context.newPage();
      await page.goto('http://localhost:3000/#lecture-room?lectureId=lec-1794004864599', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1500);

      // 2.1 Verify that "اسمع مني" is NOT free for visitors
      const paywallCard = await page.$('.card.text-center');
      assert(paywallCard !== null, 'Newly uploaded lecture ("اسمع مني") is strictly LOCKED behind paywall');

      // 2.2 Verify NO <video> element in DOM for unsubscribed visitors
      const videoElement = await page.$('video');
      assert(videoElement === null, 'Unsubscribed visitors cannot stream or watch "اسمع مني"');

      // 2.3 Verify Lock Badge in Header
      const lockBadge = await page.$('span:has-text("محتوى محمي للمشتركين 🔒")');
      assert(lockBadge !== null, 'Header shows "محتوى محمي للمشتركين 🔒" for "اسمع مني"');

      await context.close();
    }


    // ------------------------------------------------------------------
    // TEST SUITE 3: Subscribed Student Access to Paid Lecture & Smooth Buffering
    // Target: 'lec-1794002706071' (شرح قاعده المقارنه الجزء 2 - First lecture in stage-1793823838440)
    // ------------------------------------------------------------------
    console.log('\n▶️ SUITE 3: Subscribed Student Authorization & Smooth Playback');
    {
      const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, locale: 'ar-EG' });
      await context.addInitScript(() => {
        const mockStudent = {
          uid: 'test-student-sub-1',
          id: 'test-student-sub-1',
          name: 'أحمد محمود (طالب مشترك)',
          email: 'ahmed.sub@gmail.com',
          phone: '01011223344',
          subscriptions: {
            'stage-1793823838440': {
              stageId: 'stage-1793823838440',
              targetId: 'stage-1793823838440',
              targetTitle: 'مرحلة تجريبية للاشتراك',
              startDate: new Date().toISOString(),
              expirationDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
              expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
              status: 'active'
            }
          }
        };
        sessionStorage.setItem('__ms_e2e_mock_user', JSON.stringify(mockStudent));
        localStorage.setItem('madarek_user', JSON.stringify(mockStudent));
        localStorage.setItem('ms_active_uid', 'test-student-sub-1');
        localStorage.setItem('madarek_role', 'student');
      });

      const page = await context.newPage();
      await page.goto('http://localhost:3000/#lecture-room?lectureId=lec-1794002706071', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      // 3.1 Verify Video element is mounted for subscribed student
      const subVideo = await page.$('video');
      assert(subVideo !== null, 'Subscribed student successfully accesses paid lecture video');

      if (subVideo) {
        const preload = await subVideo.getAttribute('preload');
        assert(preload === 'auto', 'Paid video is configured with preload="auto" to prevent stuttering');

        const src = await subVideo.getAttribute('src');
        assert(src && src.includes('r2.dev'), `Video streaming source points to Cloudflare R2 CDN (${src ? src.substring(0, 50) + '...' : 'none'})`);

        const playsInline = await subVideo.getAttribute('playsinline');
        assert(playsInline !== null, 'playsInline attribute is enabled for seamless mobile playback');
      }

      // 3.2 Verify Study Tabs are fully unlocked
      const subVocabTab = await page.$('button:has-text("معمل النطق والكلمات")');
      assert(subVocabTab !== null, 'Study tabs (Vocab, Grammar, Booklet) are unlocked and interactive');

      // 3.3 Verify Exam Button is unlocked in Header
      const subExamButton = await page.$('button:has-text("بدء امتحان المحاضرة")');
      assert(subExamButton !== null, 'Exam button is active and accessible for subscribed student');

      // 3.4 Verify Timeline Seek & Buffer slider is mounted
      const timelineSlider = await page.$('input[type="range"]');
      assert(timelineSlider !== null, 'Timeline seek & buffer progress slider is mounted');

      await context.close();
    }


    // ------------------------------------------------------------------
    // TEST SUITE 4: Teacher / Admin Preview Authorization & Badge
    // ------------------------------------------------------------------
    console.log('\n▶️ SUITE 4: Teacher / Admin Preview Authorization & Badge');
    {
      const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, locale: 'ar-EG' });
      await context.addInitScript(() => {
        const secureSession = {
          token: 'test-admin-token-12345',
          expiresAt: Date.now() + 3600000,
          createdAt: new Date().toISOString(),
          lastActivityAt: Date.now()
        };
        sessionStorage.setItem('ms_admin_secure_session', JSON.stringify(secureSession));
        localStorage.setItem('ms_admin_secure_session', JSON.stringify(secureSession));
        localStorage.setItem('madarek_role', 'instructor');
        localStorage.setItem('ms_user_role', 'instructor');
      });

      const page = await context.newPage();
      await page.goto('http://localhost:3000/#lecture-room?lectureId=lec-1794001152669', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      // 4.1 Verify Teacher Badge is visible
      const teacherBadge = await page.$('span:has-text("معاينة كمعلم 👑")');
      assert(teacherBadge !== null, 'Teacher preview badge "معاينة كمعلم 👑" is visible');

      // 4.2 Verify Video element is available for teacher
      const teacherVideo = await page.$('video');
      assert(teacherVideo !== null, 'Teacher has full access to inspect video player');

      await context.close();
    }

    console.log('\n====================================================');
    console.log(`📊 RESULTS: ${passedCount} / ${totalCount} PASSED (${Math.round((passedCount/totalCount)*100)}%)`);
    console.log('====================================================');

    if (passedCount === totalCount) {
      console.log('🎉 ALL VIDEO STREAMING & PAYWALL TESTS PASSED 100%!');
      process.exit(0);
    } else {
      console.error('💥 SOME TESTS FAILED!');
      process.exit(1);
    }

  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runTest();
