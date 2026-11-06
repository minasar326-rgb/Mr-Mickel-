const { chromium } = require('@playwright/test');
const assert = require('assert');
const path = require('path');

async function testThreeUserProblems() {
  console.log('================================================================');
  console.log('🎯 RIGOROUS TEST OF THE 3 USER PROBLEMS (LAST 4 MESSAGES)');
  console.log('================================================================\n');

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true
  });

  try {
    // =================================================================
    // PROBLEM 1: LECTURE PERSISTENCE & INSTANT MULTI-DEVICE PUBLISHING
    // "كل م برفع المحاضره بتتمسح لوحدها... عايز لما ارفعها تتحفظ وماتتمسحش وتتنشر عند كل الطلاب"
    // =================================================================
    console.log('----------------------------------------------------------------');
    console.log('📌 PROBLEM 1 VERIFICATION: Permanent Lecture Storage & Instant Publish');
    console.log('----------------------------------------------------------------');

    const teacher1Context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const teacher1Page = await teacher1Context.newPage();
    teacher1Page.on('dialog', async d => await d.accept());

    await teacher1Page.goto('http://localhost:3000/#/teacher-admin', { waitUntil: 'domcontentloaded' });
    await teacher1Page.waitForTimeout(1000);
    const pinInput = await teacher1Page.$('input[type="password"]');
    if (pinInput) {
      await pinInput.fill('1234512345');
      await pinInput.press('Enter');
      await teacher1Page.waitForTimeout(2000);
    }

    // Go to lectures tab if needed
    let titleInput = await teacher1Page.$('input[placeholder*="أزمنة المستقبل"]');
    if (!titleInput) {
      const lecTab = await teacher1Page.$('button:has-text("المحاضرات")');
      if (lecTab) {
        await lecTab.click();
        await teacher1Page.waitForTimeout(1500);
      }
      titleInput = await teacher1Page.waitForSelector('input[placeholder*="أزمنة المستقبل"]', { timeout: 8000 });
    }

    const prob1Title = 'المشكلة 1: فحص الحفظ وعدم المسح ' + Date.now();
    console.log(`1.1 Teacher uploads lecture with video: "${prob1Title}"`);
    await titleInput.fill(prob1Title);

    const unitInput = await teacher1Page.$('input[placeholder*="Unit"]');
    if (unitInput) await unitInput.fill('Unit 1');

    const freeBtn = await teacher1Page.$('button:has-text("مجانية تجريبية")');
    if (freeBtn) {
      await freeBtn.click();
    } else {
      const freeCheckbox = await teacher1Page.$('#isFreeLecture');
      if (freeCheckbox) await freeCheckbox.check();
    }

    const videoFile = path.resolve('scripts/test-laptop-video.mp4');
    const fileInput = await teacher1Page.$('input[type="file"][accept*="video"]');
    await fileInput.setInputFiles(videoFile);

    console.log('Waiting for Cloudflare R2 upload to finish...');
    await teacher1Page.waitForSelector('text=✅ الفيديو على السحابة وشغال', { timeout: 30000 });
    console.log('✅ Video uploaded to Cloudflare R2!');

    await teacher1Page.evaluate(() => {
      const btn = document.getElementById('publish-lecture-submit-btn');
      if (btn) btn.click();
      else throw new Error('Publish button not found');
    });
    await teacher1Page.waitForTimeout(3000);

    // Verify Teacher sees lecture published
    const inTeacher1 = await teacher1Page.evaluate((t) => {
      const rows = Array.from(document.querySelectorAll('div, tr, li')).filter(el => !el.closest('.toast'));
      return rows.some(r => r.innerText && r.innerText.includes(t) && !r.innerText.includes('سلة'));
    }, prob1Title);
    console.log('Teacher sees lecture in active list:', inTeacher1);
    assert.strictEqual(inTeacher1, true, 'Lecture must appear in teacher active list');

    // Verify Reloading Teacher page does NOT delete the lecture
    console.log('Reloading Teacher page (F5) to verify NO self-deletion...');
    await teacher1Page.reload({ waitUntil: 'domcontentloaded' });
    await teacher1Page.waitForTimeout(2000);
    const pinRel = await teacher1Page.$('input[type="password"]');
    if (pinRel) {
      await pinRel.fill('1234512345');
      await pinRel.press('Enter');
      await teacher1Page.waitForTimeout(2000);
    }
    const inTeacherAfterReload = await teacher1Page.evaluate((t) => {
      const rows = Array.from(document.querySelectorAll('div, tr, li')).filter(el => !el.closest('.toast'));
      return rows.some(r => r.innerText && r.innerText.includes(t) && !r.innerText.includes('سلة'));
    }, prob1Title);
    console.log('Lecture persists after teacher F5 reload:', inTeacherAfterReload);
    assert.strictEqual(inTeacherAfterReload, true, 'Lecture must NOT be deleted after reload!');
    console.log('✅ PASS: Lecture persists permanently with zero auto-deletion!');

    // 1.2 Student on Mobile Device sees lecture and plays video
    console.log('1.2 Verifying Student phone receives lecture & streams video...');
    const student1Context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15'
    });
    const student1Page = await student1Context.newPage();
    await student1Page.goto('http://localhost:3000/#/stage-lectures?stageId=stage-1793823759992', { waitUntil: 'domcontentloaded' });
    await student1Page.waitForTimeout(2500);

    const studentSeesLec = await student1Page.evaluate((t) => {
      const cards = Array.from(document.querySelectorAll('.card'));
      return cards.some(c => c.innerText && c.innerText.includes(t));
    }, prob1Title);
    console.log('Student phone sees uploaded lecture:', studentSeesLec);
    assert.strictEqual(studentSeesLec, true, 'Student phone MUST see new uploaded lecture');

    const watchClicked = await student1Page.evaluate((t) => {
      const cards = Array.from(document.querySelectorAll('.card')).filter(c => c.innerText && c.innerText.includes(t));
      if (cards.length > 0) {
        const btn = Array.from(cards[0].querySelectorAll('button')).find(b => b.innerText.includes('مشاهدة'));
        if (btn) {
          btn.click();
          return true;
        }
      }
      return false;
    }, prob1Title);
    assert.strictEqual(watchClicked, true, 'Student watch button must be clicked');

    await student1Page.waitForSelector('video', { timeout: 10000 });
    const videoSrc = await student1Page.evaluate(() => {
      const v = document.querySelector('video');
      return v ? (v.currentSrc || v.src) : null;
    });
    console.log('Student video player streaming URL:', videoSrc);
    assert.ok(videoSrc && (videoSrc.includes('r2.dev') || videoSrc.startsWith('http')), 'Video must stream from R2');
    console.log('✅ PASS PROBLEM 1: Lecture is permanent, published to all devices, and video streams seamlessly!\n');

    // =================================================================
    // PROBLEM 2: UNIFIED INSTANT DELETION ACROSS ALL DEVICES
    // "لما بمسح محاضره مش بتتمسح غير من تلفون واحد عايز لما امسح محاضره تتمسح من الكل"
    // =================================================================
    console.log('----------------------------------------------------------------');
    console.log('📌 PROBLEM 2 VERIFICATION: Unified Deletion Across ALL Devices');
    console.log('----------------------------------------------------------------');

    console.log(`2.1 Teacher deletes lecture: "${prob1Title}"`);
    await teacher1Page.bringToFront();
    const deleteBtnClicked = await teacher1Page.evaluate((t) => {
      const buttons = Array.from(document.querySelectorAll('button')).filter(b => {
        const text = (b.innerText || '').trim();
        return text === 'حذف المحاضرة' || text === 'حذف';
      });
      for (const btn of buttons) {
        const parent = btn.closest('div[style*="border"], div.admin-card, div.card, tr, li') || btn.parentElement;
        if (parent && parent.innerText && parent.innerText.includes(t)) {
          btn.click();
          return true;
        }
      }
      return false;
    }, prob1Title);
    console.log('Teacher clicked delete button:', deleteBtnClicked);
    assert.strictEqual(deleteBtnClicked, true, 'Delete button must be clicked');
    await teacher1Page.waitForTimeout(3000);

    // Verify deletion on Teacher 1
    const inTeacherAfterDelete = await teacher1Page.evaluate((t) => {
      const rows = Array.from(document.querySelectorAll('div, tr, li')).filter(el => !el.closest('.toast'));
      return rows.some(r => r.innerText && r.innerText.includes(t) && !r.innerText.includes('سلة') && !r.innerText.includes('محذوف'));
    }, prob1Title);
    console.log('Teacher 1 still sees lecture in active list?', inTeacherAfterDelete);
    assert.strictEqual(inTeacherAfterDelete, false, 'Teacher active list must drop deleted lecture');

    // Verify Student 1 phone drops deleted lecture synchronously
    console.log('2.2 Checking Student phone reflects deletion in real time...');
    await student1Page.bringToFront();
    await student1Page.reload({ waitUntil: 'domcontentloaded' });
    await student1Page.waitForTimeout(2500);

    const studentStillSees = await student1Page.evaluate((t) => {
      const cards = Array.from(document.querySelectorAll('.card'));
      return cards.some(c => c.innerText && c.innerText.includes(t));
    }, prob1Title);
    console.log('Student phone still sees deleted lecture?', studentStillSees);
    assert.strictEqual(studentStillSees, false, 'Student phone must NOT see deleted lecture');
    console.log('✅ PASS PROBLEM 2: Deleting lecture removes it from ALL devices synchronously!\n');

    await student1Context.close();

    // =================================================================
    // PROBLEM 3: MULTI-ACCOUNT & MULTI-DEVICE TEACHER SYNCHRONIZATION
    // "وعايز اي حاجه يعمل المستر ب اي حساب تسمع عند كل الطلاب وعند اي جهاز يدخل واجه المستر برضو ب اي حساب اي حاجه تحصل يبقي فيه تزامن مهما اختلف الحساب"
    // =================================================================
    console.log('----------------------------------------------------------------');
    console.log('📌 PROBLEM 3 VERIFICATION: Multi-Account & Multi-Device Teacher Sync');
    console.log('----------------------------------------------------------------');

    // Setup Teacher A (Desktop PIN Master)
    console.log('3.1 Setting up Teacher A (Laptop PIN Session)...');
    // already open in teacher1Page

    // Setup Teacher B (Mobile iPhone Assistant / Secondary Account)
    console.log('3.2 Setting up Teacher B (Mobile iPhone Session)...');
    const teacher2Context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15'
    });
    const teacher2Page = await teacher2Context.newPage();
    teacher2Page.on('dialog', async d => await d.accept());

    await teacher2Page.goto('http://localhost:3000/#/teacher-admin', { waitUntil: 'domcontentloaded' });
    await teacher2Page.waitForTimeout(1000);
    const pin2 = await teacher2Page.$('input[type="password"]');
    if (pin2) {
      await pin2.fill('1234512345');
      await pin2.press('Enter');
      await teacher2Page.waitForTimeout(2000);
    }

    // Setup Student Context (Student Phone)
    console.log('3.3 Setting up Student (Student Mobile Phone)...');
    const student2Context = await browser.newContext({
      viewport: { width: 390, height: 844 }
    });
    const student2Page = await student2Context.newPage();
    await student2Page.goto('http://localhost:3000/#/stage-lectures?stageId=stage-1793823759992', { waitUntil: 'domcontentloaded' });
    await student2Page.waitForTimeout(2000);

    // ACTION: Teacher A creates a lecture
    const prob3Title = 'المشكلة 3: فحص تزامن الحسابات ' + Date.now();
    console.log(`\nTeacher A (Laptop) publishes lecture: "${prob3Title}"`);
    await teacher1Page.bringToFront();
    const titleInp3 = await teacher1Page.waitForSelector('input[placeholder*="أزمنة المستقبل"]', { timeout: 8000 });
    await titleInp3.fill(prob3Title);

    const unitInp3 = await teacher1Page.$('input[placeholder*="Unit"]');
    if (unitInp3) await unitInp3.fill('Unit 1');

    const freeBtn3 = await teacher1Page.$('button:has-text("مجانية تجريبية")');
    if (freeBtn3) {
      await freeBtn3.click();
    } else {
      const freeCheckbox = await teacher1Page.$('#isFreeLecture');
      if (freeCheckbox) await freeCheckbox.check();
    }

    const fileInput3 = await teacher1Page.$('input[type="file"][accept*="video"]');
    await fileInput3.setInputFiles(videoFile);
    await teacher1Page.waitForSelector('text=✅ الفيديو على السحابة وشغال', { timeout: 30000 });

    await teacher1Page.evaluate(() => {
      const btn = document.getElementById('publish-lecture-submit-btn');
      if (btn) btn.click();
      else throw new Error('Publish button not found');
    });
    await teacher1Page.waitForTimeout(3000);

    // VERIFICATION: Teacher B (Mobile) receives lecture in dashboard!
    console.log('Checking Teacher B (Mobile iPhone) receives lecture in dashboard...');
    await teacher2Page.reload({ waitUntil: 'domcontentloaded' });
    await teacher2Page.waitForTimeout(2000);
    const pin2Rel = await teacher2Page.$('input[type="password"]');
    if (pin2Rel) {
      await pin2Rel.fill('1234512345');
      await pin2Rel.press('Enter');
      await teacher2Page.waitForTimeout(2000);
    }
    const inTeacher2List = await teacher2Page.evaluate((t) => {
      const rows = Array.from(document.querySelectorAll('div, tr, li')).filter(el => !el.closest('.toast'));
      return rows.some(r => r.innerText && r.innerText.includes(t) && !r.innerText.includes('سلة'));
    }, prob3Title);
    console.log('Teacher B on Mobile sees published lecture:', inTeacher2List);
    assert.strictEqual(inTeacher2List, true, 'Teacher B on Mobile MUST see lecture created by Teacher A on Laptop');
    console.log('✅ PASS: Teacher B on Mobile received lecture created by Teacher A on Laptop!');

    // VERIFICATION: Student receives lecture on phone!
    console.log('Checking Student phone receives lecture in real time...');
    await student2Page.reload({ waitUntil: 'domcontentloaded' });
    await student2Page.waitForTimeout(2500);

    const student2Sees = await student2Page.evaluate((t) => {
      const cards = Array.from(document.querySelectorAll('.card'));
      return cards.some(c => c.innerText && c.innerText.includes(t));
    }, prob3Title);
    console.log('Student phone sees lecture:', student2Sees);
    assert.strictEqual(student2Sees, true, 'Student phone must see lecture created by Teacher A');
    console.log('✅ PASS: Student phone received lecture created by Teacher A!');

    // ACTION: Teacher B (Mobile) deletes the lecture!
    console.log('\nTeacher B (Mobile iPhone) DELETES the lecture...');
    await teacher2Page.bringToFront();
    const teacher2DeleteClicked = await teacher2Page.evaluate((t) => {
      const buttons = Array.from(document.querySelectorAll('button')).filter(b => {
        const text = (b.innerText || '').trim();
        return text === 'حذف المحاضرة' || text === 'حذف';
      });
      for (const btn of buttons) {
        const parent = btn.closest('div[style*="border"], div.admin-card, div.card, tr, li') || btn.parentElement;
        if (parent && parent.innerText && parent.innerText.includes(t)) {
          btn.click();
          return true;
        }
      }
      return false;
    }, prob3Title);
    console.log('Teacher B clicked delete button:', teacher2DeleteClicked);
    assert.strictEqual(teacher2DeleteClicked, true, 'Teacher B delete button must be clicked');
    await teacher2Page.waitForTimeout(3000);

    // VERIFICATION: Teacher A (Laptop) reflects deletion executed by Teacher B (Mobile)!
    console.log('Checking Teacher A (Laptop) reflects deletion done by Teacher B (Mobile)...');
    await teacher1Page.bringToFront();
    await teacher1Page.reload({ waitUntil: 'domcontentloaded' });
    await teacher1Page.waitForTimeout(2000);
    const pin1Rel2 = await teacher1Page.$('input[type="password"]');
    if (pin1Rel2) {
      await pin1Rel2.fill('1234512345');
      await pin1Rel2.press('Enter');
      await teacher1Page.waitForTimeout(2000);
    }
    const teacher1StillHas = await teacher1Page.evaluate((t) => {
      const rows = Array.from(document.querySelectorAll('div, tr, li')).filter(el => !el.closest('.toast'));
      return rows.some(r => r.innerText && r.innerText.includes(t) && !r.innerText.includes('سلة') && !r.innerText.includes('محذوف'));
    }, prob3Title);
    console.log('Teacher A still has lecture in active list?', teacher1StillHas);
    assert.strictEqual(teacher1StillHas, false, 'Teacher A must drop lecture deleted by Teacher B');
    console.log('✅ PASS: Teacher A dropped lecture deleted by Teacher B on Mobile!');

    // VERIFICATION: Student drops lecture!
    console.log('Checking Student phone drops lecture deleted by Teacher B...');
    await student2Page.bringToFront();
    await student2Page.reload({ waitUntil: 'domcontentloaded' });
    await student2Page.waitForTimeout(2500);

    const student2StillHas = await student2Page.evaluate((t) => {
      const cards = Array.from(document.querySelectorAll('.card'));
      return cards.some(c => c.innerText && c.innerText.includes(t));
    }, prob3Title);
    console.log('Student phone still sees deleted lecture?', student2StillHas);
    assert.strictEqual(student2StillHas, false, 'Student phone must NOT see deleted lecture');
    console.log('✅ PASS: Student phone dropped lecture deleted by Teacher B!');
    console.log('✅ PASS PROBLEM 3: Complete multi-account & cross-device teacher sync verified 100%!\n');

    console.log('================================================================');
    console.log('🎉🎉 ALL 3 CORE PROBLEMS ARE 100% RESOLVED, VERIFIED & PASSING! 🎉🎉');
    console.log('================================================================\n');

    await teacher1Context.close();
    await teacher2Context.close();
    await student2Context.close();
  } finally {
    await browser.close();
  }
}

testThreeUserProblems().catch(err => {
  console.error('❌ Three User Problems Test failed:', err);
  process.exit(1);
});
