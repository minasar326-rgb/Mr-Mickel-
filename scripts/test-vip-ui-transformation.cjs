const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function runTests() {
  console.log('🚀 Starting Comprehensive VIP UI Transformation Verification Tests...');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });

  const artifactDir = 'C:\\Users\\Lap4U\\.gemini\\antigravity\\brain\\1d87edfe-1bc6-4aaf-b45e-f159412635a2';

  let passCount = 0;
  let totalCount = 0;

  function assert(condition, message) {
    totalCount++;
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passCount++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
    }
  }

  try {
    // =========================================================================
    // TEST 1: Subscribed Student Experience (سنة خامسة)
    // =========================================================================
    console.log('\n--- TEST 1: Subscribed Student Experience (سنة خامسة) ---');
    const studentContext = await browser.newContext();
    const studentPage = await studentContext.newPage();

    const studentUser = {
      uid: 'vip-student-12345',
      id: 'vip-student-12345',
      name: 'كيرلس عماد',
      email: 'kirollos@example.com',
      role: 'student',
      xp: 350,
      subscriptions: {
        'sec-1794003102422': {
          code: '8877665544',
          codeType: 'month',
          targetId: 'sec-1794003102422',
          targetTitle: 'شرح الوحده الخامسه',
          stageId: 'stage-1793823838440',
          stageName: 'الصف الخامس الإبتدائي',
          price: 30,
          userId: 'vip-student-12345',
          userEmail: 'kirollos@example.com',
          isPermanent: true,
          durationDays: 99999,
          activatedAt: new Date().toISOString()
        }
      }
    };

    await studentPage.addInitScript((userData) => {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem('madarek_user', JSON.stringify(userData));
      localStorage.setItem('ms_active_uid', userData.uid);
      localStorage.setItem('ms_unlocked_uid', userData.uid);
      localStorage.setItem('ms_unlocked_with_expiry', JSON.stringify(userData.subscriptions));
      sessionStorage.setItem('ms_hero_cinematic_played', 'true');
    }, studentUser);

    // 1. Visit Homepage
    await studentPage.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await studentPage.waitForTimeout(1500);

    const heroText = await studentPage.textContent('body');
    assert(heroText.includes('أهلاً بعودتك يا كيرلس عماد!') && heroText.includes('أنت طالب مشترك رسمي في المنصة 🟢'), 'Hero displays personalized VIP student greeting');
    assert(heroText.includes('استكمال محاضراتك ودراستك الآن 🚀'), 'Hero displays direct student CTA "استكمال محاضراتك ودراستك الآن"');
    assert(heroText.includes('أنت مشترك في هذا المسار') && heroText.includes('دائم مدى الحياة ♾️'), 'StageSection shows active lifetime subscription card for سنة خامسة');

    // 2. Navigate directly to سنة خامسة
    await studentPage.goto('http://localhost:4173/#/stage-lectures?stageId=stage-1793823838440', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await studentPage.waitForTimeout(2000);

    const stageBodyText = await studentPage.textContent('body');

    // 3. Verify VIP Dashboard
    assert(stageBodyText.includes('أهلاً بك يا كيرلس عماد في خامسه ابتدائى! 🎓✨'), 'VIP Welcome Dashboard warmly greets the student by name and stage');
    assert(stageBodyText.includes('منصة The Master ومستر مايكل شحاتة ترحب بك وتتمنى لك رحلة تعليمية ملهمة'), 'Platform and teacher welcome message is prominently displayed');
    assert(stageBodyText.includes('أنت حالياً مشترك رسمي في المنصة 🟢'), 'Official platform subscription confirmation is shown');
    assert(stageBodyText.includes('♾️ اشتراك دائم مدى الحياة (Permanent)'), 'Explicit permanent subscription validity is clearly stated');
    assert(stageBodyText.includes('شرح الوحده الخامسه'), 'Subscribed month title is listed in subscription scope');
    assert(stageBodyText.includes('مفتوح ومفعل على جميع أجهزتك'), 'Device compatibility confirmation is highlighted');
    assert(stageBodyText.includes('350 XP') && stageBodyText.includes('المستوى 4 ⚡'), 'Student XP and Level are displayed in KPI grid');
    assert(stageBodyText.includes('نصيحة مستر مايكل:'), 'Motivational teacher advice strip is displayed');

    // 4. Verify locked banner is COMPLETELY ABSENT
    const hasLockedBanner = stageBodyText.includes('المرحلة مقفلة - يمكنك الاشتراك');
    assert(!hasLockedBanner, 'Red "المرحلة مقفلة" locked sales banner is NEVER displayed for subscribed student');

    // 5. Verify Section (Month) Header
    assert(stageBodyText.includes('مفعّل ومفتوح بحسابك 🟢 • دائم مدى الحياة ♾️'), 'Section header displays active lifetime unlock badge');
    assert(stageBodyText.includes('جاهز للمشاهدة فوراً 🟢'), 'Section action bar confirms lectures are ready for instant watching');

    const hasSecWhatsappPrice = await studentPage.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('اشتراك عبر واتساب (30 ج.م)') || text.includes('🔒 يتطلب اشتراك (30 ج.م)');
    });
    assert(!hasSecWhatsappPrice, 'Sales price tags & WhatsApp purchase buttons are hidden for subscribed section');

    // 6. Verify Lecture Card Badges
    assert(stageBodyText.includes('✓ مفعّل بحسابك 🟢 (دائم مدى الحياة ♾️)'), 'Lecture cards show verified lifetime account unlock badge');
    assert(stageBodyText.includes('مشاهدة المحاضرة والواجبات الآن ▶️'), 'Lecture cards show green instant watch action button');

    const hasLecturePriceTag = await studentPage.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.card'));
      const unlockedCard = cards.find(c => c.innerText.includes('الوحده الخامسه الدرس الاول والثاني'));
      if (!unlockedCard) return false;
      return unlockedCard.innerText.includes('💰 باشتراك') || unlockedCard.innerText.includes('متبقي 99999 يوم');
    });
    assert(!hasLecturePriceTag, 'Price badge "💰 باشتراك" and "متبقي 99999 يوم" are strictly HIDDEN on unlocked lectures');

    // Capture screenshot for visual evidence
    const ssPath1 = path.join(artifactDir, 'vip-student-stage-view.png');
    await studentPage.screenshot({ path: ssPath1, fullPage: true });
    console.log(`  📸 Saved screenshot: ${ssPath1}`);

    // =========================================================================
    // TEST 2: Unsubscribed Visitor / Unpaying User Experience
    // =========================================================================
    console.log('\n--- TEST 2: Unsubscribed Visitor Experience ---');
    const visitorContext = await browser.newContext();
    const visitorPage = await visitorContext.newPage();

    const visitorUser = {
      uid: 'visitor-student-999',
      id: 'visitor-student-999',
      name: 'زائر تجريبي',
      email: 'visitor@example.com',
      role: 'student',
      subscriptions: {}
    };

    await visitorPage.addInitScript((userData) => {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem('madarek_user', JSON.stringify(userData));
      localStorage.setItem('ms_active_uid', userData.uid);
      localStorage.setItem('ms_unlocked_uid', userData.uid);
      localStorage.setItem('ms_unlocked_with_expiry', '{}');
      sessionStorage.setItem('ms_hero_cinematic_played', 'true');
    }, visitorUser);

    await visitorPage.goto('http://localhost:4173/#/stage-lectures?stageId=stage-1793823838440', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await visitorPage.waitForTimeout(2000);

    const visitorBodyText = await visitorPage.textContent('body');
    assert(visitorBodyText.includes('المرحلة مقفلة - يمكنك الاشتراك في شهر محدد أو كورس أو شحن كود تفعيل 🔒'), 'Visitor sees locked stage banner with instructions to subscribe');
    assert(visitorBodyText.includes('🔒 يتطلب اشتراك (30 ج.م)'), 'Visitor sees month subscription price badge (30 ج.م)');
    assert(visitorBodyText.includes('المحاضرة مقفلة'), 'Visitor sees locked lecture overlay');
    assert(visitorBodyText.includes('شحن كود 🔑') || visitorBodyText.includes('شحن كود التفعيل 🔑'), 'Visitor sees code redemption action buttons');

    const ssPath2 = path.join(artifactDir, 'visitor-locked-stage-view.png');
    await visitorPage.screenshot({ path: ssPath2, fullPage: true });
    console.log(`  📸 Saved screenshot: ${ssPath2}`);

    console.log(`\n======================================================`);
    console.log(`📊 FINAL RESULT: ${passCount} / ${totalCount} ASSERTIONS PASSED`);
    console.log(`======================================================`);

    if (passCount === totalCount) {
      console.log('🎉 ALL VIP UI TRANSFORMATION TESTS PASSED 100%!');
    } else {
      console.error(`⚠️ SOME TESTS FAILED (${totalCount - passCount} failures). Review logs above.`);
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runTests();
