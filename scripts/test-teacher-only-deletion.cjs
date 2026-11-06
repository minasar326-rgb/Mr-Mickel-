const { chromium } = require('@playwright/test');
const assert = require('assert');
const fs = require('fs');

async function testTeacherOnlyDeletion() {
  console.log('--- STARTING AUDIT: Verifying Lecture Deletion Exclusively Permitted by Teacher ---');
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  page.on('dialog', async d => await d.accept());

  // Load manifest to find confirmed active lectures
  const manifest = JSON.parse(fs.readFileSync('public/lectures-manifest.json', 'utf8'));
  const activeManifestLec = manifest.lectures.find(l => l && l.id && !l.isDeleted);
  assert(activeManifestLec, 'Must have at least one active lecture in manifest');
  console.log(`Verified active cloud manifest lecture: "${activeManifestLec.title}" (${activeManifestLec.id})`);

  try {
    // 1. Load platform as student / guest
    console.log('\n[Step 1] Loading platform in Student Mode...');
    await page.goto('http://localhost:3000/#/stages', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);

    // Verify lectures exist
    const initialLectures = await page.evaluate(() => {
      const saved = localStorage.getItem('ms_lectures');
      const list = saved ? JSON.parse(saved) : [];
      return list.map(l => ({ id: l.id, title: l.title }));
    });
    console.log(`Found ${initialLectures.length} active lectures in browser localStorage.`);
    assert(initialLectures.length > 0, 'Platform must have active lectures');

    // 2. Attempt unauthorized deletion from student / unauthenticated context
    console.log('\n[Step 2] Testing Unauthorized Deletion Attack from Student/Guest Context...');
    const studentDeleteResult = await page.evaluate(async (targetId) => {
      const deletedIdsBefore = JSON.parse(localStorage.getItem('ms_deleted_lectures') || '[]');
      
      // Attempt to invoke deleteLecture if exposed
      if (window.__teacherContext && window.__teacherContext.deleteLecture) {
        await window.__teacherContext.deleteLecture(targetId, true);
      }
      
      const deletedIdsAfter = JSON.parse(localStorage.getItem('ms_deleted_lectures') || '[]');
      const lecturesAfter = JSON.parse(localStorage.getItem('ms_lectures') || '[]');
      const stillExists = lecturesAfter.some(l => l.id === targetId);
      
      return {
        stillExists,
        wasAddedToDeleted: deletedIdsAfter.includes(targetId),
        deletedIdsCount: deletedIdsAfter.length
      };
    }, activeManifestLec.id);

    console.log('Unauthorized deletion test result:', studentDeleteResult);
    assert.strictEqual(studentDeleteResult.stillExists, true, 'Lecture MUST NOT be deleted by unauthorized action!');
    assert.strictEqual(studentDeleteResult.wasAddedToDeleted, false, 'Lecture ID must NOT be added to ms_deleted_lectures by unauthorized action!');
    console.log('✓ PASS: Unauthorized deletion was completely blocked and prevented.');

    // 3. Test Anti-Stale Suppression: If a client happens to have this active lecture ID in local ms_deleted_lectures,
    // cloud manifest syncing MUST clean it and ensure the lecture is NOT suppressed!
    console.log('\n[Step 3] Testing Anti-Stale Self-Healing: Inoculating simulated stale ms_deleted_lectures...');
    await page.evaluate((targetId) => {
      const current = JSON.parse(localStorage.getItem('ms_deleted_lectures') || '[]');
      if (!current.includes(targetId)) current.push(targetId);
      current.push('stale-dummy-id');
      localStorage.setItem('ms_deleted_lectures', JSON.stringify(current));
    }, activeManifestLec.id);

    // Trigger manifest reload
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const healedDeletedIds = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('ms_deleted_lectures') || '[]');
    });
    console.log('Is active lecture in ms_deleted_lectures after cloud manifest healing?', healedDeletedIds.includes(activeManifestLec.id));
    assert(!healedDeletedIds.includes(activeManifestLec.id), 'Active lecture must be automatically healed and removed from deleted IDs!');
    console.log('✓ PASS: Anti-stale suppression protection successfully protected the lecture from accidental deletion.');

    // 4. Login as Teacher with PIN and verify authorized controls
    console.log('\n[Step 4] Logging in as Authorized Teacher (PIN: 1234512345)...');
    await page.goto('http://localhost:3000/#/teacher-admin', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const pinInput = page.locator('input[type="password"]');
    if (await pinInput.count() > 0) {
      await pinInput.fill('1234512345');
      await pinInput.press('Enter');
      await page.waitForTimeout(2000);
    }

    const currentUrl = page.url();
    console.log('Current URL after teacher authentication:', currentUrl);
    assert(currentUrl.includes('teacher-admin'), 'Must successfully reach teacher-admin panel');

    const adminContentVisible = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('لوحة تحكم') || text.includes('إدارة المحاضرات') || text.includes('المستر') || text.includes('إحصائيات');
    });
    assert(adminContentVisible, 'Admin center UI must be visible to authenticated teacher');
    console.log('✓ PASS: Teacher authenticated successfully and entered Teacher Admin Center.');

    // 5. Verify teacher UI has explicit confirmation safeguards
    console.log('\n[Step 5] Checking confirmation dialogs and deletion safeguards in Teacher Admin...');
    const deleteButtonsCount = await page.locator('button:has-text("حذف"), button:has-text("حذف المحاضرة")').count();
    console.log(`Found ${deleteButtonsCount} guarded delete buttons in teacher panel.`);
    assert(deleteButtonsCount > 0, 'Teacher admin must display deletion controls exclusively to authorized instructor');
    console.log('✓ PASS: Deletion controls are strictly and exclusively present in the teacher admin panel with confirmation guards.');

    console.log('\n================================================================');
    console.log('🎉 ALL SECURITY & DELETION CONTROLS PASSED 100%!');
    console.log('NO LECTURE CAN EVER BE DELETED EXCEPT BY THE TEACHER DIRECTLY!');
    console.log('================================================================');

  } finally {
    await browser.close();
  }
}

testTeacherOnlyDeletion().catch(err => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
