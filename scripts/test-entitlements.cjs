const assert = require('assert');

async function testEntitlements() {
  const { coversLecture, validateCodeTarget } = await import('../src/utils/entitlements.js');

  console.log('🧪 RUNNING ENTITLEMENTS & COVERS_LECTURE TESTS');

  const lectures = [
    { id: 'lec-1', stageId: 'sec-1', sectionId: 'month-1-sec1', title: 'محاضرة 1' },
    { id: 'lec-2', stageId: 'sec-1', sectionId: 'month-1-sec1', title: 'محاضرة 2' },
    { id: 'lec-orphan', stageId: 'sec-1', sectionId: null, title: 'محاضرة يتيمة بدون شهر' },
    { id: 'lec-3', stageId: 'sec-2', sectionId: 'month-1-sec2', title: 'محاضرة ثانية ثانوي' },
    { id: 'lec-4', stageId: 'sec-3', sectionId: 'month-1-sec3', title: 'محاضرة ثالثة ثانوي' }
  ];

  // 1. Stage-level subscription test
  const sec1Sub = { targetId: 'sec-1', codeType: 'stage', status: 'active' };
  assert.strictEqual(coversLecture(sec1Sub, lectures[0]), true, 'Stage sub should cover lec-1');
  assert.strictEqual(coversLecture(sec1Sub, lectures[1]), true, 'Stage sub should cover lec-2');
  assert.strictEqual(coversLecture(sec1Sub, lectures[2]), true, 'Stage sub should cover orphan lec in same stage');
  assert.strictEqual(coversLecture(sec1Sub, lectures[3]), false, 'Sec-1 sub should NOT cover Sec-2');

  // 2. Section-level subscription test
  const monthSub = { targetId: 'month-1-sec1', codeType: 'month', status: 'active' };
  assert.strictEqual(coversLecture(monthSub, lectures[0]), true, 'Month sub covers lec-1');
  assert.strictEqual(coversLecture(monthSub, lectures[2]), false, 'Month sub does not cover orphan without section');
  assert.strictEqual(coversLecture(monthSub, lectures[3]), false, 'Month sub does not cover other section');

  // 3. Direct lecture subscription test
  const singleSub = { targetId: 'lec-1', codeType: 'lecture', status: 'active' };
  assert.strictEqual(coversLecture(singleSub, lectures[0]), true, 'Single sub covers lec-1');
  assert.strictEqual(coversLecture(singleSub, lectures[1]), false, 'Single sub does not cover lec-2');

  // 4. Word VIP in code/title must NOT grant all-access unless codeType === 'all-access'
  const fakeVipSub = { targetId: 'month-1-sec1', codeType: 'month', title: 'كود VIP للشهر', status: 'active' };
  assert.strictEqual(coversLecture(fakeVipSub, lectures[3]), false, 'VIP in title must NOT leak across stages!');

  // 5. Genuine All-Access
  const genuineAllAccess = { targetId: 'all-access', codeType: 'all-access', status: 'active' };
  assert.strictEqual(coversLecture(genuineAllAccess, lectures[0]), true);
  assert.strictEqual(coversLecture(genuineAllAccess, lectures[3]), true);
  assert.strictEqual(coversLecture(genuineAllAccess, lectures[4]), true);

  // 6. Expired subscription
  const expiredSub = { targetId: 'sec-1', codeType: 'stage', status: 'active', expiresAt: '2020-01-01' };
  assert.strictEqual(coversLecture(expiredSub, lectures[0]), false, 'Expired sub must return false');

  console.log('✅ ALL ENTITLEMENT & COVERS_LECTURE TESTS PASSED 100%!');
}

testEntitlements().catch(err => {
  console.error('❌ Entitlements test error:', err);
  process.exit(1);
});
