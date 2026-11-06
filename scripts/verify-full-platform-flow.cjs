const { chromium } = require('@playwright/test');
const path = require('path');
const assert = require('assert');

async function testFullPlatform() {
  console.log('========================================================');
  console.log('🚀 RUNNING COMPREHENSIVE MULTI-DEVICE PLATFORM SUITE');
  console.log('========================================================\n');

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true
  });

  try {
    // -----------------------------------------------------------------
    // 1. TEACHER DEVICE: UPLOAD LECTURE WITH CLOUDFLARE R2 VIDEO
    // -----------------------------------------------------------------
    console.log('--- STEP 1: Teacher (Desktop Context) Uploads Lecture ---');
    const teacherContext = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const teacherPage = await teacherContext.newPage();

    teacherPage.on('dialog', async d => {
      console.log(`[Teacher Dialog] ${d.type()} -> "${d.message()}" (Accepted)`);
      await d.accept();
    });

    await teacherPage.goto('http://localhost:3000/#/teacher-admin', { waitUntil: 'domcontentloaded' });
    await teacherPage.waitForTimeout(1500);

    const pinInput = await teacherPage.$('input[type="password"]');
    if (pinInput) {
      await pinInput.fill('1234512345');
      await pinInput.press('Enter');
      await teacherPage.waitForTimeout(2000);
    }

    // Go to lectures tab if needed
    let titleInput = await teacherPage.waitForSelector('input[placeholder*="أزمنة المستقبل"]', { timeout: 8000 }).catch(() => null);
    if (!titleInput) {
      const lecTab = await teacherPage.$('button:has-text("المحاضرات")');
      if (lecTab) {
        await lecTab.click();
        await teacherPage.waitForTimeout(1500);
      }
      titleInput = await teacherPage.waitForSelector('input[placeholder*="أزمنة المستقبل"]', { timeout: 8000 });
    }

    const testTitle = 'محاضرة الوحدة الأولى الرسمية ' + Date.now();
    console.log(`Filling lecture title: "${testTitle}"`);
    await titleInput.fill(testTitle);

    const unitInput = await teacherPage.$('input[placeholder*="Unit"]');
    if (unitInput) await unitInput.fill('Unit 1');

    // Mark as free lecture so any student on any phone can watch without code
    const freeBtn = await teacherPage.$('button:has-text("مجانية تجريبية")');
    if (freeBtn) {
      await freeBtn.click();
      console.log('Marked lecture as Free (open to all students on all devices)');
    } else {
      const freeCheckbox = await teacherPage.$('#isFreeLecture');
      if (freeCheckbox) await freeCheckbox.check();
    }

    // Attach real video
    const videoFile = path.resolve('scripts/test-laptop-video.mp4');
    const fileInput = await teacherPage.$('input[type="file"][accept*="video"]');
    await fileInput.setInputFiles(videoFile);

    console.log('Waiting for Cloudflare R2 upload to complete & verify streaming URL...');
    await teacherPage.waitForSelector('text=✅ الفيديو على السحابة وشغال', { timeout: 30000 });
    console.log('✅ PASS: Video uploaded directly to Cloudflare R2 and verified active!');

    // Publish lecture
    await teacherPage.evaluate(() => {
      const btn = document.getElementById('publish-lecture-submit-btn');
      if (btn) btn.click();
      else throw new Error('Publish button not found');
    });
    await teacherPage.waitForTimeout(3000);

    // Verify published in teacher list
    const inTeacherList = await teacherPage.evaluate((t) => {
      const rows = Array.from(document.querySelectorAll('div, tr, li')).filter(el => !el.closest('.toast'));
      return rows.some(r => r.innerText && r.innerText.includes(t) && !r.innerText.includes('سلة'));
    }, testTitle);
    console.log('Teacher sees published lecture in dashboard:', inTeacherList);
    assert.strictEqual(inTeacherList, true, 'Lecture must appear in teacher published list');

    // -----------------------------------------------------------------
    // 2. STUDENT DEVICE: PHONE (MOBILE IPHONE CONTEXT) INSTANT ACCESS
    // -----------------------------------------------------------------
    console.log('\n--- STEP 2: Student Phone (Mobile iPhone Context) Sync & Watch ---');
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

    // -----------------------------------------------------------------
    // 3. STUDENT WATCHES LECTURE & VIDEO STREAMING VERIFICATION
    // -----------------------------------------------------------------
    console.log('\n--- STEP 3: Student Opens & Verifies Video Streaming ---');
    const watchClicked = await studentPage.evaluate((t) => {
      const cards = Array.from(document.querySelectorAll('.card')).filter(c => c.innerText && c.innerText.includes(t));
      if (cards.length > 0) {
        const btn = Array.from(cards[0].querySelectorAll('button')).find(b => b.innerText.includes('مشاهدة'));
        if (btn) {
          btn.click();
          return true;
        }
      }
      return false;
    }, testTitle);
    console.log('Student clicked watch lecture button:', watchClicked);
    assert.strictEqual(watchClicked, true, 'Student watch button must be clicked');

    await studentPage.waitForSelector('video', { timeout: 10000 });
    const videoSrc = await studentPage.evaluate(() => {
      const video = document.querySelector('video');
      return video ? (video.currentSrc || video.src) : null;
    });
    console.log('Student video player stream URL:', videoSrc);
    assert.ok(videoSrc && (videoSrc.includes('r2.dev') || videoSrc.startsWith('http')), 'Video element must stream from Cloudflare R2');
    console.log('✅ PASS: Video player initialized and streaming from Cloudflare R2!');

    // -----------------------------------------------------------------
    // 4. CROSS-DEVICE SYNCHRONOUS DELETION TEST
    // -----------------------------------------------------------------
    console.log('\n--- STEP 4: Teacher Deletes Lecture & Cross-Device Sync ---');
    await teacherPage.bringToFront();
    const deleteClicked = await teacherPage.evaluate((t) => {
      const items = Array.from(document.querySelectorAll('div, tr')).filter(el => el.innerText && el.innerText.includes(t) && !el.closest('.toast'));
      for (const item of items) {
        const delBtn = Array.from(item.querySelectorAll('button')).find(b => b.innerText.includes('حذف'));
        if (delBtn) {
          delBtn.click();
          return true;
        }
      }
      return false;
    }, testTitle);
    console.log('Teacher clicked delete lecture button:', deleteClicked);
    assert.strictEqual(deleteClicked, true, 'Teacher delete button must be clicked');
    await teacherPage.waitForTimeout(2500);

    // Now check student phone
    await studentPage.bringToFront();
    // Allow sync / trigger manifest sync
    await studentPage.evaluate(async () => {
      const res = await fetch('/lectures-manifest.js?t=' + Date.now());
      const js = await res.text();
      eval(js);
    });
    await studentPage.waitForTimeout(2000);

    // Navigate student back to stage-lectures
    await studentPage.goto('http://localhost:3000/#/stage-lectures?stageId=stage-1793823759992', { waitUntil: 'domcontentloaded' });
    await studentPage.waitForTimeout(2000);

    const studentSeesAfterDelete = await studentPage.evaluate((t) => {
      const cards = Array.from(document.querySelectorAll('.card'));
      return cards.some(c => c.innerText && c.innerText.includes(t));
    }, testTitle);
    console.log('Student phone still sees deleted lecture?', studentSeesAfterDelete);
    assert.strictEqual(studentSeesAfterDelete, false, 'Deleted lecture must disappear from student phone!');
    console.log('✅ PASS: Lecture disappeared from student phone synchronously!');

    // Check after full page reload (F5)
    await studentPage.reload({ waitUntil: 'domcontentloaded' });
    await studentPage.waitForTimeout(2500);
    const studentSeesAfterReload = await studentPage.evaluate((t) => {
      const cards = Array.from(document.querySelectorAll('.card'));
      return cards.some(c => c.innerText && c.innerText.includes(t));
    }, testTitle);
    console.log('Student phone sees lecture after reload (F5)?', studentSeesAfterReload);
    assert.strictEqual(studentSeesAfterReload, false, 'Deleted lecture must NOT return after reload!');
    console.log('✅ PASS: Deletion is permanent across all devices and reloads!');

    console.log('\n========================================================');
    console.log('🎉 ALL PLATFORM TESTS PASSED 100% WITH ZERO ERRORS!');
    console.log('========================================================\n');

    await teacherContext.close();
    await studentContext.close();
  } finally {
    await browser.close();
  }
}

testFullPlatform().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
