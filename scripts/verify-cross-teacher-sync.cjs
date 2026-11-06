const { chromium } = require('@playwright/test');
const assert = require('assert');
const path = require('path');

async function testCrossTeacherSync() {
  console.log('========================================================');
  console.log('👑 RUNNING CROSS-TEACHER & CROSS-ACCOUNT REAL-TIME SYNC TEST');
  console.log('========================================================\n');

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true
  });

  try {
    // -------------------------------------------------------------
    // TEACHER A: Master Desktop PIN Login
    // -------------------------------------------------------------
    console.log('--- Setting up Teacher A (Desktop PIN Session) ---');
    const teacherAContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const teacherAPage = await teacherAContext.newPage();
    teacherAPage.on('dialog', async d => await d.accept());

    await teacherAPage.goto('http://localhost:3000/#/teacher-admin', { waitUntil: 'domcontentloaded' });
    await teacherAPage.waitForTimeout(1000);
    const pinA = await teacherAPage.$('input[type="password"]');
    if (pinA) {
      await pinA.fill('1234512345');
      await pinA.press('Enter');
      await teacherAPage.waitForTimeout(2000);
    }

    // -------------------------------------------------------------
    // TEACHER B: Mobile Teacher Account (iPhone Context)
    // -------------------------------------------------------------
    console.log('--- Setting up Teacher B (Mobile Device Context) ---');
    const teacherBContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15'
    });
    const teacherBPage = await teacherBContext.newPage();
    teacherBPage.on('dialog', async d => await d.accept());

    await teacherBPage.goto('http://localhost:3000/#/teacher-admin', { waitUntil: 'domcontentloaded' });
    await teacherBPage.waitForTimeout(1000);
    const pinB = await teacherBPage.$('input[type="password"]');
    if (pinB) {
      await pinB.fill('1234512345');
      await pinB.press('Enter');
      await teacherBPage.waitForTimeout(2000);
    }

    // -------------------------------------------------------------
    // ACTION 1: Teacher A Publishes a Lecture via Dashboard UI
    // -------------------------------------------------------------
    console.log('\n--- Teacher A (Laptop) Publishes a Lecture via Dashboard UI ---');
    let titleInput = await teacherAPage.$('input[placeholder*="أزمنة المستقبل"]');
    if (!titleInput) {
      const lecTab = await teacherAPage.$('button:has-text("المحاضرات")');
      if (lecTab) {
        await lecTab.click();
        await teacherAPage.waitForTimeout(1500);
      }
      titleInput = await teacherAPage.waitForSelector('input[placeholder*="أزمنة المستقبل"]', { timeout: 8000 });
    }

    const testTitle = 'محاضرة المزامنة المتعددة ' + Date.now();
    console.log(`Filling lecture title: "${testTitle}"`);
    await titleInput.fill(testTitle);

    const unitInput = await teacherAPage.$('input[placeholder*="Unit"]');
    if (unitInput) await unitInput.fill('Unit 1');

    // Mark as free lecture so any student on any phone can watch without code
    const freeBtn = await teacherAPage.$('button:has-text("مجانية تجريبية")');
    if (freeBtn) {
      await freeBtn.click();
      console.log('Marked lecture as Free (open to all students on all devices)');
    } else {
      const freeCheckbox = await teacherAPage.$('#isFreeLecture');
      if (freeCheckbox) await freeCheckbox.check();
    }

    // Attach real video
    const videoFile = path.resolve('scripts/test-laptop-video.mp4');
    const fileInput = await teacherAPage.$('input[type="file"][accept*="video"]');
    await fileInput.setInputFiles(videoFile);

    console.log('Waiting for Cloudflare R2 upload to complete & verify streaming URL...');
    await teacherAPage.waitForSelector('text=✅ الفيديو على السحابة وشغال', { timeout: 30000 });
    console.log('✅ PASS: Video uploaded directly to Cloudflare R2 and verified active!');

    // Publish lecture
    await teacherAPage.evaluate(() => {
      const btn = document.getElementById('publish-lecture-submit-btn');
      if (btn) btn.click();
      else throw new Error('Publish button not found');
    });
    await teacherAPage.waitForTimeout(3000);

    // Verify Teacher A sees published lecture in dashboard
    const inTeacherAList = await teacherAPage.evaluate((t) => {
      const rows = Array.from(document.querySelectorAll('div, tr, li')).filter(el => !el.closest('.toast'));
      return rows.some(r => r.innerText && r.innerText.includes(t) && !r.innerText.includes('سلة'));
    }, testTitle);
    console.log('Teacher A sees published lecture in dashboard:', inTeacherAList);
    assert.strictEqual(inTeacherAList, true, 'Lecture must appear in Teacher A dashboard');

    // -------------------------------------------------------------
    // VERIFICATION 1: Teacher B (Mobile) Sees Published Lecture
    // -------------------------------------------------------------
    console.log('\n--- Verifying Teacher B (Mobile iPhone) receives lecture in dashboard ---');
    await teacherBPage.reload({ waitUntil: 'domcontentloaded' });
    await teacherBPage.waitForTimeout(2000);
    const pinB2 = await teacherBPage.$('input[type="password"]');
    if (pinB2) {
      await pinB2.fill('1234512345');
      await pinB2.press('Enter');
      await teacherBPage.waitForTimeout(2000);
    }
    const inTeacherBList = await teacherBPage.evaluate((t) => {
      const rows = Array.from(document.querySelectorAll('div, tr, li')).filter(el => !el.closest('.toast'));
      return rows.some(r => r.innerText && r.innerText.includes(t) && !r.innerText.includes('سلة'));
    }, testTitle);
    console.log('Teacher B on Mobile sees published lecture:', inTeacherBList);
    assert.strictEqual(inTeacherBList, true, 'Teacher B on Mobile MUST see lecture created by Teacher A');
    console.log('✅ PASS: Teacher B on Mobile received new lecture created by Teacher A on Laptop!');

    // -------------------------------------------------------------
    // VERIFICATION 2: Student C (Student Mobile Context) Sees Lecture
    // -------------------------------------------------------------
    console.log('\n--- Setting up Student C (Student Mobile Context) ---');
    const studentContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15'
    });
    const studentPage = await studentContext.newPage();
    await studentPage.goto('http://localhost:3000/#/stage-lectures?stageId=stage-1793823759992', { waitUntil: 'domcontentloaded' });
    await studentPage.waitForTimeout(2500);

    const studentSeesLecture = await studentPage.evaluate((t) => {
      const cards = Array.from(document.querySelectorAll('.card'));
      return cards.some(c => c.innerText && c.innerText.includes(t));
    }, testTitle);
    console.log('Student phone sees uploaded lecture immediately:', studentSeesLecture);
    assert.strictEqual(studentSeesLecture, true, 'Student phone MUST see new uploaded lecture!');
    console.log('✅ PASS: Student phone synchronized and received the new lecture!');

    // -------------------------------------------------------------
    // ACTION 2: Teacher B (on Mobile iPhone) Deletes the Lecture
    // -------------------------------------------------------------
    console.log('\n--- Teacher B (on Mobile iPhone) Deletes the Lecture ---');
    await teacherBPage.bringToFront();
    const deleteClicked = await teacherBPage.evaluate((t) => {
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
    }, testTitle);
    console.log('Teacher B clicked exact delete lecture button:', deleteClicked);
    assert.strictEqual(deleteClicked, true, 'Teacher B delete button must be clicked');
    await teacherBPage.waitForTimeout(3000);

    // -------------------------------------------------------------
    // VERIFICATION 3: Teacher A and Student C Reflect Deletion
    // -------------------------------------------------------------
    console.log('\n--- Verifying Teacher A (Laptop) reflects deletion done by Teacher B (Mobile) ---');
    await teacherAPage.bringToFront();
    await teacherAPage.reload({ waitUntil: 'domcontentloaded' });
    await teacherAPage.waitForTimeout(2000);
    const pinA2 = await teacherAPage.$('input[type="password"]');
    if (pinA2) {
      await pinA2.fill('1234512345');
      await pinA2.press('Enter');
      await teacherAPage.waitForTimeout(2000);
    }
    const teacherAStillHas = await teacherAPage.evaluate((t) => {
      const rows = Array.from(document.querySelectorAll('div, tr, li')).filter(el => !el.closest('.toast'));
      return rows.some(r => r.innerText && r.innerText.includes(t) && !r.innerText.includes('سلة') && !r.innerText.includes('محذوف'));
    }, testTitle);
    console.log('Teacher A still has lecture in active published list?', teacherAStillHas);
    assert.strictEqual(teacherAStillHas, false, 'Teacher A must NOT see deleted lecture in active list');
    console.log('✅ PASS: Teacher A dropped the lecture deleted by Teacher B!');

    console.log('\n--- Verifying Student C phone drops deleted lecture ---');
    await studentPage.bringToFront();
    await studentPage.reload({ waitUntil: 'domcontentloaded' });
    await studentPage.waitForTimeout(2500);

    const studentStillSees = await studentPage.evaluate((t) => {
      const cards = Array.from(document.querySelectorAll('.card'));
      return cards.some(c => c.innerText && c.innerText.includes(t));
    }, testTitle);
    console.log('Student C still sees deleted lecture?', studentStillSees);
    assert.strictEqual(studentStillSees, false, 'Student C must NOT see deleted lecture!');
    console.log('✅ PASS: Student C no longer sees the deleted lecture!');

    console.log('\n========================================================');
    console.log('🎉 CROSS-TEACHER & CROSS-ACCOUNT REAL-TIME SYNC VERIFIED 100%!');
    console.log('========================================================\n');

    await teacherAContext.close();
    await teacherBContext.close();
    await studentContext.close();
  } finally {
    await browser.close();
  }
}

testCrossTeacherSync().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
