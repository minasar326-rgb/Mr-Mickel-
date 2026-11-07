const assert = require('assert');
const { normalize10DigitCode } = require('../src/utils/codeNormalizer.js');
const { coversLecture, validateCodeTarget } = require('../src/utils/entitlements.js');
const { lecturesData } = require('../src/data/lecturesData.js');

console.log('====================================================');
console.log('🧪 TESTING FULL MONTH UNLOCK & CODE ISOLATION SUITE');
console.log('====================================================\n');

// 1. Verify default lectures have sectionId populated
console.log('Test 1: Verifying all curriculum lectures have valid sectionId...');
lecturesData.forEach(lec => {
  assert.ok(lec.sectionId, `Lecture ${lec.id} (${lec.title}) is missing sectionId!`);
});
console.log(`  ✅ All ${lecturesData.length} default lectures have sectionId properly assigned.`);

// Helper function to simulate access check
function checkAccess(lecture, currentUser) {
  if (!lecture) return { allowed: false };
  if (lecture.isFree) return { allowed: true };
  if (!currentUser || !currentUser.uid || currentUser.uid === 'guest') {
    return { allowed: false, reason: 'not_logged_in' };
  }

  const userSubs = currentUser.subscriptions || {};
  for (const [key, sub] of Object.entries(userSubs)) {
    if (!sub) continue;
    if (coversLecture(sub, lecture, lecturesData)) {
      return { allowed: true, reason: 'unlocked' };
    }
  }

  return { allowed: false, reason: 'not_subscribed' };
}

// ------------------------------------------------------------------
// SCENARIO 1: Student subscribes to Senior 3, Month 1 (sec3-month-1)
// ------------------------------------------------------------------
console.log('\nTest 2: Senior 3 - Month 1 Subscription...');
const studentS3Month1 = {
  uid: 'std-s3-01',
  name: 'أحمد محمود',
  subscriptions: {
    'sec3-month-1': {
      targetId: 'sec3-month-1',
      stageId: 'sec-3',
      codeType: 'month',
      status: 'active',
      isPermanent: true
    }
  }
};

const lecS3_1 = lecturesData.find(l => l.id === 'lec-s3-01'); // Month 1
const lecS3_2 = lecturesData.find(l => l.id === 'lec-s3-02'); // Month 1
const lecS3_3 = lecturesData.find(l => l.id === 'lec-s3-03'); // Month 2
const lecS2_1 = lecturesData.find(l => l.id === 'lec-s2-01'); // Stage 2
const lecS1_1 = lecturesData.find(l => l.id === 'lec-s1-01'); // Stage 1

assert.strictEqual(checkAccess(lecS3_1, studentS3Month1).allowed, true, 'Lec S3-01 in Month 1 MUST be unlocked');
assert.strictEqual(checkAccess(lecS3_2, studentS3Month1).allowed, true, 'Lec S3-02 in Month 1 MUST be unlocked');
assert.strictEqual(checkAccess(lecS3_3, studentS3Month1).allowed, false, 'Lec S3-03 in Month 2 MUST be LOCKED');
assert.strictEqual(checkAccess(lecS2_1, studentS3Month1).allowed, false, 'Lec S2-01 in Stage 2 MUST be LOCKED');
assert.strictEqual(checkAccess(lecS1_1, studentS3Month1).allowed, false, 'Lec S1-01 in Stage 1 MUST be LOCKED');

console.log('  ✅ Senior 3 Month 1 unlocks BOTH lectures in Month 1, while Month 2 and other stages remain LOCKED!');

// ------------------------------------------------------------------
// SCENARIO 2: Student subscribes to Senior 1, Month 1 (sec1-month-1)
// ------------------------------------------------------------------
console.log('\nTest 3: Senior 1 - Month 1 Subscription...');
const studentS1 = {
  uid: 'std-s1-01',
  name: 'كريم وائل',
  subscriptions: {
    'sec1-month-1': {
      targetId: 'sec1-month-1',
      stageId: 'sec-1',
      codeType: 'month',
      status: 'active',
      isPermanent: true
    }
  }
};

assert.strictEqual(checkAccess(lecS1_1, studentS1).allowed, true, 'Lec S1-01 MUST be unlocked for Senior 1 student');
assert.strictEqual(checkAccess(lecS3_1, studentS1).allowed, false, 'Lec S3-01 MUST be locked for Senior 1 student');
assert.strictEqual(checkAccess(lecS2_1, studentS1).allowed, false, 'Lec S2-01 MUST be locked for Senior 1 student');

console.log('  ✅ Senior 1 Month 1 unlocks ONLY Senior 1 lectures, and other stages remain LOCKED!');

// ------------------------------------------------------------------
// SCENARIO 3: Single Lecture Subscription (lec-s3-03)
// ------------------------------------------------------------------
console.log('\nTest 4: Single Lecture Subscription...');
const studentSingleLec = {
  uid: 'std-single-01',
  name: 'مريم عادل',
  subscriptions: {
    'lec-s3-03': {
      targetId: 'lec-s3-03',
      stageId: 'sec-3',
      codeType: 'lecture',
      status: 'active',
      isPermanent: true
    }
  }
};

assert.strictEqual(checkAccess(lecS3_3, studentSingleLec).allowed, true, 'Purchased lecture lec-s3-03 MUST be unlocked');
assert.strictEqual(checkAccess(lecS3_1, studentSingleLec).allowed, false, 'Other lecture lec-s3-01 MUST remain locked');
assert.strictEqual(checkAccess(lecS3_2, studentSingleLec).allowed, false, 'Other lecture lec-s3-02 MUST remain locked');

console.log('  ✅ Single Lecture Code unlocks ONLY that lecture and keeps all other lectures LOCKED!');

// ------------------------------------------------------------------
// SCENARIO 4: Phone / Tablet Arabic Keyboard Code Entry Normalization
// ------------------------------------------------------------------
console.log('\nTest 5: Phone/Tablet Arabic Keyboards...');
const rawPhoneCode = '  \u200E٨٣٩١٠٤٨٢٩١  ';
const cleanPhoneCode = normalize10DigitCode(rawPhoneCode);
assert.strictEqual(cleanPhoneCode, '8391048291', 'Arabic numerals from phone must normalize to 8391048291');
console.log('  ✅ Phone Arabic keyboard numerals "٨٣٩١٠٤٨٢٩١" normalized cleanly to ASCII 10 digits: 8391048291');

console.log('\n====================================================');
console.log('🎉 ALL TESTS PASSED WITH 100% SUCCESS!');
console.log('====================================================');
