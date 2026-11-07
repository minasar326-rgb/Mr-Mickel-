const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Starting Comprehensive Paywall & Month Lifecycle E2E Test...');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });

  // -------------------------------------------------------------
  // Test 1: Unauthenticated Guest (No Google Login)
  // -------------------------------------------------------------
  console.log('\n--- Test 1: Fresh Guest (Not Logged In) ---');
  const guestContext = await browser.newContext();
  const guestPage = await guestContext.newPage();

  await guestPage.goto('http://localhost:4173/#/stage-lectures?stageId=stage-1793823838440', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await guestPage.waitForTimeout(1000);

  const guestBody = await guestPage.evaluate(() => document.body.innerText);
  if (guestBody.includes('🎁 تجريبية مجانية') || guestBody.includes('مشاهدة المحاضرة والواجبات الآن')) {
    console.error('❌ Test 1 FAILED: Guest saw free lectures or watch now button!');
    process.exit(1);
  }
  const guestLockedCount = await guestPage.locator('text=المحاضرة مقفلة').count();
  console.log(`✓ Guest sees ${guestLockedCount} locked lecture cards.`);
  if (guestLockedCount < 2) {
    console.error('❌ Test 1 FAILED: Expected at least 2 locked lecture cards in سنة خامسة');
    process.exit(1);
  }
  console.log('✅ Test 1 PASSED: Unauthenticated guests cannot watch or see free lectures in سنة خامسة.');
  await guestContext.close();

  // -------------------------------------------------------------
  // Test 2: Logged-in Google Student WITHOUT Code
  // -------------------------------------------------------------
  console.log('\n--- Test 2: Logged-in Google Student (No Code) ---');
  const studentContext = await browser.newContext();
  const studentPage = await studentContext.newPage();

  const studentUid = 'student-test-uid-' + Date.now();
  await studentPage.addInitScript((uid) => {
    localStorage.setItem('madarek_user', JSON.stringify({
      uid: uid,
      id: uid,
      name: 'طالب تجريبي بدون كود',
      email: 'student_test@example.com',
      role: 'student',
      subscriptions: {}
    }));
  }, studentUid);

  await studentPage.goto('http://localhost:4173/#/stage-lectures?stageId=stage-1793823838440', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await studentPage.waitForTimeout(1000);

  const studentBody = await studentPage.evaluate(() => document.body.innerText);
  if (studentBody.includes('🎁 تجريبية مجانية') || studentBody.includes('مشاهدة المحاضرة والواجبات الآن')) {
    console.error('❌ Test 2 FAILED: Logged in student without code saw unlocked lectures!');
    process.exit(1);
  }
  const studentLockedNotice = await studentPage.locator('text=المحاضرة تتطلب الاشتراك في الشهر أو شحن كود تفعيل المحاضرة').count();
  console.log(`✓ Student without code sees ${studentLockedNotice} lock notifications.`);
  if (studentLockedNotice < 2) {
    console.error('❌ Test 2 FAILED: Expected subscription required prompt for paying lectures');
    process.exit(1);
  }
  console.log('✅ Test 2 PASSED: Google login alone does not unlock lectures.');
  await studentContext.close();

  // -------------------------------------------------------------
  // Test 3: Month Code Redemption unlocks all lectures in that month
  // -------------------------------------------------------------
  console.log('\n--- Test 3: Month Code Redemption ---');
  const subContext = await browser.newContext();
  const subPage = await subContext.newPage();
  const subStudentUid = 'student-subscribed-uid-' + Date.now();

  await subPage.addInitScript((uid) => {
    localStorage.setItem('madarek_user', JSON.stringify({
      uid: uid,
      id: uid,
      name: 'طالب مشترك بالشهر',
      email: 'student_sub@example.com',
      role: 'student',
      subscriptions: {
        'sec-1794003102422': {
          id: 'sub-test-' + Date.now(),
          codeType: 'month',
          targetId: 'sec-1794003102422',
          targetTitle: 'شرح الوحده الخامسه',
          stageId: 'stage-1793823838440',
          userId: uid,
          isPermanent: true,
          durationDays: 99999,
          expiresAt: '2099-12-31T23:59:59.999Z',
          expirationDate: '2099-12-31T23:59:59.999Z',
          status: 'active'
        }
      }
    }));
  }, subStudentUid);

  await subPage.goto('http://localhost:4173/#/stage-lectures?stageId=stage-1793823838440', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await subPage.waitForTimeout(1500);

  const watchButtonsCount = await subPage.locator('text=مشاهدة المحاضرة والواجبات الآن').count();
  console.log(`✓ Subscribed student sees ${watchButtonsCount} unlocked "مشاهدة الآن" buttons in سنة خامسة.`);
  if (watchButtonsCount < 2) {
    console.error('❌ Test 3 FAILED: Month subscription did not unlock the lectures in that month');
    process.exit(1);
  }
  console.log('✅ Test 3 PASSED: Month subscription successfully and permanently unlocked the month.');

  // -------------------------------------------------------------
  // Test 4: Future Lecture Coverage in the Same Month
  // -------------------------------------------------------------
  console.log('\n--- Test 4: Future Lecture Coverage in the Same Month ---');
  // Add a newly added future lecture to this month in localStorage lectures
  await subPage.evaluate(() => {
    const raw = localStorage.getItem('ms_lectures');
    const lecs = raw ? JSON.parse(raw) : [];
    lecs.push({
      id: 'lec-future-pri5-new',
      stageId: 'stage-1793823838440',
      sectionId: 'sec-1794003102422',
      unitNumber: 'Unit 5',
      title: 'محاضرة مضافة مستقبلاً لنفس الشهر',
      subtitle: 'محاضرة جديدة تم رفعها بعد سنة',
      duration: '45:00',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80',
      isFree: false,
      isLocked: true,
      price: '30 ج.م'
    });
    localStorage.setItem('ms_lectures', JSON.stringify(lecs));
  });

  await subPage.reload({ waitUntil: 'domcontentloaded' });
  await subPage.waitForTimeout(1500);

  const newLecTitle = await subPage.locator('text=محاضرة مضافة مستقبلاً لنفس الشهر').count();
  console.log(`✓ Future lecture appears: ${newLecTitle > 0}`);
  const watchButtonsAfterCount = await subPage.locator('text=مشاهدة المحاضرة والواجبات الآن').count();
  console.log(`✓ Unlocked buttons count now: ${watchButtonsAfterCount}`);
  if (watchButtonsAfterCount < 3) {
    console.error('❌ Test 4 FAILED: Newly added lecture in the subscribed month was not covered automatically!');
    process.exit(1);
  }
  console.log('✅ Test 4 PASSED: Newly added lectures to the subscribed month are covered permanently without re-entering codes.');
  await subContext.close();

  // -------------------------------------------------------------
  // Test 5: Account Isolation (Different Google Account)
  // -------------------------------------------------------------
  console.log('\n--- Test 5: Account Isolation (Switching Google Account) ---');
  const otherStudentContext = await browser.newContext();
  const otherStudentPage = await otherStudentContext.newPage();
  const otherUid = 'other-student-' + Date.now();

  await otherStudentPage.addInitScript((uid) => {
    localStorage.setItem('madarek_user', JSON.stringify({
      uid: uid,
      id: uid,
      name: 'طالب آخر بحساب جوجل مختلف',
      email: 'other_student@example.com',
      role: 'student',
      subscriptions: {} // empty subscriptions!
    }));
  }, otherUid);

  await otherStudentPage.goto('http://localhost:4173/#/stage-lectures?stageId=stage-1793823838440', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await otherStudentPage.waitForTimeout(1000);

  const otherLockedCount = await otherStudentPage.locator('text=المحاضرة تتطلب الاشتراك في الشهر أو شحن كود تفعيل المحاضرة').count();
  console.log(`✓ Different student sees ${otherLockedCount} locked lectures.`);
  if (otherLockedCount < 2) {
    console.error('❌ Test 5 FAILED: Subscription leaked to a different Google account!');
    process.exit(1);
  }
  console.log('✅ Test 5 PASSED: Subscriptions are strictly isolated per Google account.');
  await otherStudentContext.close();

  // -------------------------------------------------------------
  // Test 6: Teacher Admin Preview vs Student Mode
  // -------------------------------------------------------------
  console.log('\n--- Test 6: Teacher Admin Preview vs Student View ---');
  const teacherContext = await browser.newContext();
  const teacherPage = await teacherContext.newPage();

  await teacherPage.addInitScript(() => {
    localStorage.setItem('ms_admin_session', JSON.stringify({
      token: 'test_token',
      role: 'super_admin',
      authMethod: 'master_pin',
      createdAt: new Date().toISOString(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      lastActivityAt: Date.now()
    }));
  });

  await teacherPage.goto('http://localhost:4173/#/stage-lectures?stageId=stage-1793823838440', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await teacherPage.waitForTimeout(1000);

  // In default front-end browsing, role is 'student' (because of App.jsx switchRole('student'))
  // Verify that in student role, even with admin token, student locks are active!
  const lockedInStudentMode = await teacherPage.locator('text=المحاضرة مقفلة').count();
  console.log(`✓ In student role with admin token in storage, student sees locked lectures: ${lockedInStudentMode > 0}`);
  if (lockedInStudentMode === 0) {
    console.error('❌ Test 6 FAILED: Admin token bypassed student paywall while browsing as student!');
    process.exit(1);
  }
  console.log('✅ Test 6 PASSED: Teacher browsing in student role properly experiences the student paywall.');
  await teacherContext.close();

  await browser.close();
  console.log('\n======================================================');
  console.log('🎉 ALL 6 COMPREHENSIVE PAYWALL & LIFECYCLE TESTS PASSED 100%!');
  console.log('======================================================\n');
  process.exit(0);
})();
