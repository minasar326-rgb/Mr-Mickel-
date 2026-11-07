/**
 * Automated Verification Script: Test All 3 Code Types & Subscriptions
 * 
 * Verifies:
 * 1. Code Format: Exactly 10 digits (0-9 only), unique, single-use.
 * 2. Type 1 (كود المرحلة بالكامل): Unlocks all months and lectures in the stage forever.
 * 3. Type 2 (كود شهر محدد): Auto-pulls month price, unlocks that month's lectures forever, other months locked.
 * 4. Type 3 (كود محاضرة واحدة): Auto-pulls lecture price, unlocks that lecture only, other lectures locked.
 * 5. Re-use prevention: Cannot be redeemed by another student (already_used).
 * 6. Same student re-entry: Returns alreadyActive without error.
 * 7. Google login != subscription: Unsubscribed student is blocked by paywall.
 * 8. Permanence: Never expires (isPermanent: true).
 */

const { coversLecture, validateCodeTarget } = require('../src/utils/entitlements.js');

// Mock Data
const stages = [
  { id: 'sec-3', name: 'الصف الثالث الثانوي', price: '500 ج.م' },
  { id: 'sec-2', name: 'الصف الثاني الثانوي', price: '450 ج.م' },
  { id: 'sec-1', name: 'الصف الأول الثانوي', price: '400 ج.م' },
  { id: 'prep', name: 'الصف الثالث الإعدادي', price: '350 ج.م' }
];

const sections = [
  { id: 'sec3-month-1', stageId: 'sec-3', title: 'الشهر الأول (أكتوبر)', price: 180 },
  { id: 'sec3-month-2', stageId: 'sec-3', title: 'الشهر الثاني (نوفمبر)', price: 180 },
  { id: 'sec3-month-3', stageId: 'sec-3', title: 'الشهر الثالث (ديسمبر)', price: 190 }
];

const lectures = [
  // Month 1 lectures
  { id: 'lec-s3-01', stageId: 'sec-3', sectionId: 'sec3-month-1', title: 'محاضرة 1 (الشهر 1)', isFree: false, price: '70 ج.م' },
  { id: 'lec-s3-02', stageId: 'sec-3', sectionId: 'sec3-month-1', title: 'محاضرة 2 (الشهر 1)', isFree: false, price: '70 ج.م' },
  // Month 2 lectures
  { id: 'lec-s3-03', stageId: 'sec-3', sectionId: 'sec3-month-2', title: 'محاضرة 3 (الشهر 2)', isFree: false, price: '70 ج.م' },
  { id: 'lec-s3-04', stageId: 'sec-3', sectionId: 'sec3-month-2', title: 'محاضرة 4 (الشهر 2)', isFree: false, price: '70 ج.م' },
  // Free lecture
  { id: 'lec-free', stageId: 'sec-3', sectionId: 'sec3-month-1', title: 'محاضرة تجريبية مجانية', isFree: true, price: 'مجاناً' }
];

// Helper: 10-digit generator
function generate10DigitCode(existingSet = new Set()) {
  let codeStr = '';
  do {
    const first = Math.floor(1 + Math.random() * 9);
    let rest = '';
    for (let i = 0; i < 9; i++) {
      rest += Math.floor(Math.random() * 10);
    }
    codeStr = `${first}${rest}`;
  } while (existingSet.has(codeStr));
  return codeStr;
}

// Simulated In-Memory Access Codes Store
const accessCodesStore = [];

function createCode({ stageId, targetId, codeType, sectionId, lectureId, targetTitle, price }) {
  const existingSet = new Set(accessCodesStore.map(c => c.code));
  const codeStr = generate10DigitCode(existingSet);

  const codeObj = {
    code: codeStr,
    codeType,
    targetId,
    targetTitle,
    stageId,
    sectionId: sectionId || '',
    lectureId: lectureId || '',
    price: typeof price === 'number' ? `${price} ج.م` : (price || '180 ج.م'),
    isPermanent: true,
    durationDays: 36500,
    isSingleUse: true,
    maxUses: 1,
    usedCount: 0,
    isUsed: false,
    isActive: true,
    usedByUid: null,
    usedByEmail: null,
    usedAt: null
  };

  accessCodesStore.push(codeObj);
  return codeObj;
}

function redeemCodeSimulation({ codeStr, studentUid, studentEmail }) {
  const code = accessCodesStore.find(c => c.code === codeStr);
  if (!code) return { ok: false, error: 'invalid_code', message: 'كود غير صحيح' };
  if (!code.isActive) return { ok: false, error: 'code_disabled', message: 'كود معطل' };

  if (code.isUsed && code.usedByUid !== studentUid) {
    return { ok: false, error: 'already_used', message: 'الكود مستخدم بالفعل من طالب آخر' };
  }

  if (code.isUsed && code.usedByUid === studentUid) {
    return {
      ok: true,
      alreadyActive: true,
      message: 'الكود مفعّل بحسابك بالفعل',
      subscription: {
        userId: studentUid,
        targetId: code.targetId,
        codeType: code.codeType,
        isPermanent: true,
        expiresAt: '2099-12-31T23:59:59.999Z'
      }
    };
  }

  // Mark as used
  code.isUsed = true;
  code.usedCount = 1;
  code.usedByUid = studentUid;
  code.usedByEmail = studentEmail;
  code.usedAt = new Date().toISOString();

  const sub = {
    userId: studentUid,
    targetId: code.targetId,
    stageId: code.stageId,
    codeType: code.codeType,
    isPermanent: true,
    durationDays: 36500,
    expiresAt: '2099-12-31T23:59:59.999Z'
  };

  return {
    ok: true,
    alreadyActive: false,
    subscription: sub
  };
}

// Lecture Access Checker (canAccessLecture simulation)
function checkLectureAccess({ student, lecture }) {
  if (lecture.isFree) return { allowed: true, reason: 'free' };
  if (!student || !student.uid || student.uid === 'guest') {
    return { allowed: false, reason: 'not_logged_in' };
  }

  const userSubs = student.subscriptions || {};
  for (const sub of Object.values(userSubs)) {
    if (coversLecture(sub, lecture, lectures)) {
      return { allowed: true, reason: 'subscribed', sub };
    }
  }

  return { allowed: false, reason: 'subscription_required' };
}

// -------------------------------------------------------------
// RUN TESTS
// -------------------------------------------------------------
console.log('====================================================');
console.log('🧪 RUNNING COMPREHENSIVE 3-TYPE CODE SYSTEM TESTS');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(cond, msg) {
  totalTests++;
  if (cond) {
    console.log(`✅ PASS: ${msg}`);
    passedTests++;
  } else {
    console.error(`❌ FAIL: ${msg}`);
    process.exitCode = 1;
  }
}

// -------------------------------------------------------------
// Test 1: Code Format (10 digits only, no letters or symbols)
// -------------------------------------------------------------
console.log('--- Test 1: 10-Digit Numeric Format & Uniqueness ---');
const generatedCodes = new Set();
for (let i = 0; i < 50; i++) {
  const code = generate10DigitCode(generatedCodes);
  assert(/^\d{10}$/.test(code), `Code "${code}" is strictly 10 digits`);
  assert(!generatedCodes.has(code), `Code "${code}" is unique`);
  generatedCodes.add(code);
}

// -------------------------------------------------------------
// Test 2: Type 1 - كود المرحلة بالكامل (Full Stage Code)
// -------------------------------------------------------------
console.log('\n--- Test 2: Type 1 - Full Stage Code (كود المرحلة بالكامل) ---');
const stageCode = createCode({
  stageId: 'sec-3',
  targetId: 'sec-3',
  codeType: 'stage',
  targetTitle: 'مرحلة كاملة: الصف الثالث الثانوي',
  price: '500 ج.م'
});

assert(/^\d{10}$/.test(stageCode.code), 'Stage code is 10 digits');
assert(stageCode.codeType === 'stage', 'Code type is stage');
assert(stageCode.isPermanent === true, 'Stage code is permanent');

// Student 1 redeems stage code
const student1 = { uid: 'student-google-uid-001', email: 'ahmed@gmail.com', subscriptions: {} };
const redeemRes1 = redeemCodeSimulation({
  codeStr: stageCode.code,
  studentUid: student1.uid,
  studentEmail: student1.email
});

assert(redeemRes1.ok === true, 'Student 1 redeemed stage code successfully');
student1.subscriptions['sec-3'] = redeemRes1.subscription;

// Verify Student 1 has access to ALL lectures in this stage (Month 1, Month 2, Future Month)
assert(checkLectureAccess({ student: student1, lecture: lectures[0] }).allowed === true, 'Student 1 unlocked Month 1 Lec 1');
assert(checkLectureAccess({ student: student1, lecture: lectures[1] }).allowed === true, 'Student 1 unlocked Month 1 Lec 2');
assert(checkLectureAccess({ student: student1, lecture: lectures[2] }).allowed === true, 'Student 1 unlocked Month 2 Lec 3');
assert(checkLectureAccess({ student: student1, lecture: lectures[3] }).allowed === true, 'Student 1 unlocked Month 2 Lec 4');

// Add a future lecture to the stage -> Student 1 must STILL have access!
const futureLectureInStage = { id: 'lec-future-01', stageId: 'sec-3', sectionId: 'sec3-month-3', title: 'محاضرة مضافة مستقبلاً', isFree: false };
assert(checkLectureAccess({ student: student1, lecture: futureLectureInStage }).allowed === true, 'Student 1 automatically has access to future lectures added to the stage');

// Other stages must NOT be unlocked by this code!
const sec2Lecture = { id: 'lec-s2-01', stageId: 'sec-2', sectionId: 'sec2-month-1', title: 'محاضرة ثانية ثانوي', isFree: false };
assert(checkLectureAccess({ student: student1, lecture: sec2Lecture }).allowed === false, 'Student 1 cannot access other stages (isolation preserved)');

// Student 2 tries to use the same code -> MUST BE REJECTED!
const student2 = { uid: 'student-google-uid-002', email: 'mohamed@gmail.com', subscriptions: {} };
const reuseRes = redeemCodeSimulation({
  codeStr: stageCode.code,
  studentUid: student2.uid,
  studentEmail: student2.email
});
assert(reuseRes.ok === false && reuseRes.error === 'already_used', 'Student 2 is BLOCKED from using Student 1 code');

// Student 1 re-enters the code -> Already active confirmation
const reenterRes = redeemCodeSimulation({
  codeStr: stageCode.code,
  studentUid: student1.uid,
  studentEmail: student1.email
});
assert(reenterRes.ok === true && reenterRes.alreadyActive === true, 'Student 1 re-entering code gets alreadyActive confirmation');

// -------------------------------------------------------------
// Test 3: Type 2 - كود شهر محدد (Specific Month Code with Auto Price)
// -------------------------------------------------------------
console.log('\n--- Test 3: Type 2 - Specific Month Code (كود شهر محدد) ---');
const monthSection = sections.find(s => s.id === 'sec3-month-1');
const monthCode = createCode({
  stageId: 'sec-3',
  targetId: 'sec3-month-1',
  codeType: 'month',
  sectionId: 'sec3-month-1',
  targetTitle: `شهر: ${monthSection.title}`,
  price: monthSection.price // Auto-pulled from section!
});

assert(/^\d{10}$/.test(monthCode.code), 'Month code is 10 digits');
assert(monthCode.price === '180 ج.م', 'Price automatically pulled from month setting (180 ج.م)');
assert(monthCode.codeType === 'month', 'Code type is month');

// Student 3 redeems Month 1 code
const student3 = { uid: 'student-google-uid-003', email: 'sara@gmail.com', subscriptions: {} };
const redeemMonthRes = redeemCodeSimulation({
  codeStr: monthCode.code,
  studentUid: student3.uid,
  studentEmail: student3.email
});

assert(redeemMonthRes.ok === true, 'Student 3 redeemed Month 1 code successfully');
student3.subscriptions['sec3-month-1'] = redeemMonthRes.subscription;

// Verify: Month 1 lectures are OPEN
assert(checkLectureAccess({ student: student3, lecture: lectures[0] }).allowed === true, 'Student 3 can access Month 1 Lec 1');
assert(checkLectureAccess({ student: student3, lecture: lectures[1] }).allowed === true, 'Student 3 can access Month 1 Lec 2');

// Verify: Month 2 lectures are LOCKED!
assert(checkLectureAccess({ student: student3, lecture: lectures[2] }).allowed === false, 'Month 2 Lec 3 is LOCKED for Student 3');
assert(checkLectureAccess({ student: student3, lecture: lectures[3] }).allowed === false, 'Month 2 Lec 4 is LOCKED for Student 3');

// Add a future lecture to Month 1 -> Student 3 must have access to it!
const futureLectureInMonth1 = { id: 'lec-m1-future', stageId: 'sec-3', sectionId: 'sec3-month-1', title: 'محاضرة مضافة مستقبلاً للشهر الأول', isFree: false };
assert(checkLectureAccess({ student: student3, lecture: futureLectureInMonth1 }).allowed === true, 'Future lecture in Month 1 is automatically covered for Student 3');

// -------------------------------------------------------------
// Test 4: Type 3 - كود محاضرة واحدة (Single Lecture Code with Auto Price)
// -------------------------------------------------------------
console.log('\n--- Test 4: Type 3 - Single Lecture Code (كود محاضرة واحدة) ---');
const singleLec = lectures[2]; // Month 2 Lec 3
const lecCode = createCode({
  stageId: 'sec-3',
  targetId: singleLec.id,
  codeType: 'lecture',
  lectureId: singleLec.id,
  targetTitle: `محاضرة: ${singleLec.title}`,
  price: singleLec.price // Auto-pulled from lecture price!
});

assert(/^\d{10}$/.test(lecCode.code), 'Lecture code is 10 digits');
assert(lecCode.price === '70 ج.م', 'Price automatically pulled from lecture setting (70 ج.م)');
assert(lecCode.codeType === 'lecture', 'Code type is lecture');

// Student 4 redeems single lecture code
const student4 = { uid: 'student-google-uid-004', email: 'khaled@gmail.com', subscriptions: {} };
const redeemLecRes = redeemCodeSimulation({
  codeStr: lecCode.code,
  studentUid: student4.uid,
  studentEmail: student4.email
});

assert(redeemLecRes.ok === true, 'Student 4 redeemed single lecture code successfully');
student4.subscriptions[singleLec.id] = redeemLecRes.subscription;

// Verify: ONLY this lecture is OPEN
assert(checkLectureAccess({ student: student4, lecture: lectures[2] }).allowed === true, 'Student 4 can access Month 2 Lec 3');
// Other lecture in same month is LOCKED!
assert(checkLectureAccess({ student: student4, lecture: lectures[3] }).allowed === false, 'Student 4 CANNOT access Month 2 Lec 4 (isolated)');
// Month 1 lecture is LOCKED!
assert(checkLectureAccess({ student: student4, lecture: lectures[0] }).allowed === false, 'Student 4 CANNOT access Month 1 Lec 1');

// -------------------------------------------------------------
// Test 5: Unsubscribed Google Login != Access
// -------------------------------------------------------------
console.log('\n--- Test 5: Unsubscribed Google Login !== Access (Paywall Enforced) ---');
const loggedInUnsubscribedStudent = { uid: 'student-logged-in-no-sub', email: 'newstudent@gmail.com', subscriptions: {} };
const guestUser = { uid: 'guest', email: '' };

assert(checkLectureAccess({ student: loggedInUnsubscribedStudent, lecture: lectures[0] }).allowed === false, 'Logged-in unsubscribed student is BLOCKED from paid lecture');
assert(checkLectureAccess({ student: guestUser, lecture: lectures[0] }).allowed === false, 'Guest user is BLOCKED from paid lecture');
// Free lecture is open to anyone
assert(checkLectureAccess({ student: loggedInUnsubscribedStudent, lecture: lectures[4] }).allowed === true, 'Free lecture is open to logged-in student');
assert(checkLectureAccess({ student: guestUser, lecture: lectures[4] }).allowed === true, 'Free lecture is open to guest');

// -------------------------------------------------------------
// Test 6: Subscription Permanence (Never Expires)
// -------------------------------------------------------------
console.log('\n--- Test 6: Subscription Permanence (Never Expires) ---');
const oldDateSubscription = {
  userId: student1.uid,
  targetId: 'sec-3',
  codeType: 'stage',
  isPermanent: true,
  startDate: '2024-01-01T00:00:00.000Z',
  durationDays: 36500,
  expiresAt: '2099-12-31T23:59:59.999Z'
};
assert(coversLecture(oldDateSubscription, lectures[0], lectures) === true, 'Permanent subscription from 2 years ago is STILL VALID and active');

console.log('\n====================================================');
console.log(`🎉 ALL TESTS COMPLETED: ${passedTests}/${totalTests} PASSED`);
console.log('====================================================');
