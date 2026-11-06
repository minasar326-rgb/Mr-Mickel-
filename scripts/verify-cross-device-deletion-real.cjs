const { chromium } = require('@playwright/test');
const path = require('path');
const assert = require('assert');

async function main() {
  console.log('=== STARTING REAL MULTI-DEVICE DELETION SYNC TEST ===');

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true
  });

  try {
    // -------------------------------------------------------------
    // PART 1: Teacher Device Login & Upload
    // -------------------------------------------------------------
    console.log('\n--- PART 1: Teacher Uploads Lecture ---');
    const teacherContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const teacherPage = await teacherContext.newPage();

    // Auto accept window.confirm dialogs (for deletion)
    teacherPage.on('dialog', async dialog => {
      console.log(`Teacher Dialog: ${dialog.type()} -> "${dialog.message()}" [Accepting]`);
      await dialog.accept();
    });

    await teacherPage.goto('http://localhost:3000/#/', { waitUntil: 'domcontentloaded' });
    await teacherPage.waitForTimeout(1500);

    const teacherNavbarBtn = await teacherPage.$('#teacher-navbar-login-btn');
    if (teacherNavbarBtn) await teacherNavbarBtn.click();
    else await teacherPage.click('button:has-text("دخول المستر")');
    await teacherPage.waitForTimeout(1000);

    const pinInput = await teacherPage.waitForSelector('input[type="password"]', { timeout: 4000 }).catch(() => null);
    if (pinInput) {
      await pinInput.fill('1234512345');
      await pinInput.press('Enter');
      await teacherPage.waitForTimeout(2500);
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

    const testTitle = 'محاضرة تجربة الحذف الفوري ' + Date.now();
    console.log(`Creating lecture: "${testTitle}"...`);
    await titleInput.fill(testTitle);

    const unitInput = await teacherPage.$('input[placeholder*="Unit"]');
    if (unitInput) await unitInput.fill('Unit 6');

    // Attach video
    const videoPath = path.resolve('scripts/test-laptop-video.mp4');
    const fileInput = await teacherPage.$('input[type="file"][accept*="video"]');
    await fileInput.setInputFiles(videoPath);

    console.log('Waiting for video upload to finish on Cloudflare R2...');
    await teacherPage.waitForSelector('text=✅ الفيديو على السحابة وشغال', { timeout: 25000 });
    console.log('PASS: Video uploaded and verified active on Cloudflare R2!');

    // Submit lecture
    await teacherPage.evaluate(() => {
      const btn = document.getElementById('publish-lecture-submit-btn');
      if (btn) btn.click();
      else throw new Error('Publish button not found');
    });
    await teacherPage.waitForTimeout(3500);

    // Verify it appeared in active published lectures
    const inTeacherList = await teacherPage.evaluate((t) => {
      const cards = Array.from(document.querySelectorAll('.card, tr, li')).filter(el => !el.closest('.toast'));
      return cards.some(c => c.innerText && c.innerText.includes(t) && !c.innerText.includes('سلة'));
    }, testTitle);
    console.log('Lecture in teacher published list:', inTeacherList);
    assert.strictEqual(inTeacherList, true, 'Lecture must appear in teacher list after publishing');

    // -------------------------------------------------------------
    // PART 2: Student Phone Loads & Sees The Lecture
    // -------------------------------------------------------------
    console.log('\n--- PART 2: Student Phone Verification (Device 2) ---');
    const studentContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15'
    });
    const studentPage = await studentContext.newPage();

    await studentPage.goto('http://localhost:3000/#/stage-lectures?stageId=stage-1793823759992', { waitUntil: 'domcontentloaded' });
    await studentPage.waitForTimeout(3000);

    const studentSeesBefore = await studentPage.evaluate((t) => {
      const cards = Array.from(document.querySelectorAll('.card'));
      return cards.some(c => c.innerText && c.innerText.includes(t));
    }, testTitle);
    console.log('Student sees lecture before deletion:', studentSeesBefore);
    assert.strictEqual(studentSeesBefore, true, 'Student must see the lecture before it is deleted!');
    console.log('✅ PASS: Student phone sees the uploaded lecture.');

    // -------------------------------------------------------------
    // PART 3: Teacher Deletes The Lecture
    // -------------------------------------------------------------
    console.log('\n--- PART 3: Teacher Deletes The Lecture On Device 1 ---');
    // Find the lecture card in teacher list and click delete
    const deletedSuccessfully = await teacherPage.evaluate(async (t) => {
      const cards = Array.from(document.querySelectorAll('div, tr')).filter(el => el.innerText && el.innerText.includes(t) && !el.closest('.toast'));
      for (const card of cards) {
        const delBtn = Array.from(card.querySelectorAll('button')).find(b => b.innerText.includes('حذف'));
        if (delBtn) {
          delBtn.click();
          return true;
        }
      }
      return false;
    }, testTitle);

    console.log('Teacher clicked delete button:', deletedSuccessfully);
    await teacherPage.waitForTimeout(2500);

    const debugInfo = await teacherPage.evaluate((t) => {
      const local = JSON.parse(localStorage.getItem('ms_lectures') || '[]');
      const lec = local.find(l => l.title === t);
      const matches = Array.from(document.querySelectorAll('*'))
        .filter(el => el.children.length === 0 && el.innerText && el.innerText.includes(t))
        .map(el => ({ tag: el.tagName, text: el.innerText.slice(0, 60), parentClass: el.parentElement?.className }));
      return { inLocal: Boolean(lec), isDeleted: lec?.isDeleted, matches };
    }, testTitle);
    console.log('Debug info on teacherPage after delete:', debugInfo);

    // Active published lectures (excluding trash tab and form inputs and toasts)
    const inTeacherActiveList = await teacherPage.evaluate((t) => {
      const tableRows = Array.from(document.querySelectorAll('table tbody tr, .published-lectures-item'));
      return tableRows.some(row => row.innerText && row.innerText.includes(t));
    }, testTitle);
    console.log('Lecture in teacher active table/list?', inTeacherActiveList);

    // -------------------------------------------------------------
    // PART 4: Student Phone Receives Sync & Verifies Deletion
    // -------------------------------------------------------------
    console.log('\n--- PART 4: Student Phone (Device 2) Deletion Sync ---');
    // Trigger manifest sync on student phone
    const studentSyncDebug = await studentPage.evaluate(async () => {
      const res = await fetch('/lectures-manifest.js?t=' + Date.now());
      const js = await res.text();
      eval(js);
      const manifest = window.__MS_PLATFORM_MANIFEST__;
      const local = JSON.parse(localStorage.getItem('ms_lectures') || '[]');
      const localDeleted = JSON.parse(localStorage.getItem('ms_deleted_lectures') || '[]');
      return {
        manifestLecturesCount: manifest?.lectures?.length,
        manifestDeletedCount: manifest?.deletedLectureIds?.length,
        manifestDeletedIds: manifest?.deletedLectureIds,
        localLecturesCount: local.length,
        localDeletedIds: localDeleted,
        hasManifestLoadedListener: Boolean(window.__hasManifestLoadedListener)
      };
    });
    console.log('Student sync debug info:', studentSyncDebug);
    await studentPage.waitForTimeout(2000);

    const studentSeesAfterSync = await studentPage.evaluate((t) => {
      const cards = Array.from(document.querySelectorAll('.card'));
      return cards.some(c => c.innerText && c.innerText.includes(t));
    }, testTitle);
    console.log('Student phone still sees lecture after sync?', studentSeesAfterSync);
    assert.strictEqual(studentSeesAfterSync, false, 'Student phone MUST NOT see the deleted lecture after sync!');
    console.log('✅ PASS: Lecture removed from student phone immediately on sync!');

    // -------------------------------------------------------------
    // PART 5: Student Phone Reloads (F5) - Must NOT Return
    // -------------------------------------------------------------
    console.log('\n--- PART 5: Student Phone Reload (F5) Persistence Check ---');
    await studentPage.reload({ waitUntil: 'domcontentloaded' });
    await studentPage.waitForTimeout(3000);

    const studentSeesAfterReload = await studentPage.evaluate((t) => {
      const cards = Array.from(document.querySelectorAll('.card'));
      return cards.some(c => c.innerText && c.innerText.includes(t));
    }, testTitle);
    console.log('Student phone still sees lecture after reload (F5)?', studentSeesAfterReload);
    assert.strictEqual(studentSeesAfterReload, false, 'Deleted lecture must NEVER return after reload!');
    console.log('✅ PASS: Lecture remains deleted on student phone after page reload (F5)!');

    console.log('\n🎉 ALL TESTS PASSED: DELETING A LECTURE REMOVES IT FROM ALL PHONES AND DEVICES PERMANENTLY!');

    await teacherContext.close();
    await studentContext.close();
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
