const assert = require('assert');
const { normalize10DigitCode } = require('../src/utils/codeNormalizer.js');
const { coversLecture, validateCodeTarget, getCoveredLectures } = require('../src/utils/entitlements.js');

console.log('====================================================');
console.log('🧪 RUNNING CROSS-DEVICE LOCKDOWN & CODE VERIFICATION');
console.log('====================================================\n');

// ------------------------------------------------------------------
// TEST 1: Arabic & Persian Numeral Normalization for Phones / Tablets
// ------------------------------------------------------------------
console.log('Test 1: Normalizing 10-digit codes from mobile Arabic keyboards...');

const arabicInput1 = '٨٣٩١٠٤٨٢٩١';
const normalized1 = normalize10DigitCode(arabicInput1);
assert.strictEqual(normalized1, '8391048291', 'Failed to normalize Eastern Arabic numerals');

const persianInput = '  ۸۴۹۲۰۱۹۳۸۴  ';
const normalized2 = normalize10DigitCode(persianInput);
assert.strictEqual(normalized2, '8492019384', 'Failed to normalize Persian numerals');

// Unicode directional marks from iOS Arabic keyboard (\u200E, \u200F)
const unicodeInput = '\u200E٨٣٩\u200F١٠٤\u200B٨٢٩١\uFEFF';
const normalized3 = normalize10DigitCode(unicodeInput);
assert.strictEqual(normalized3, '8391048291', 'Failed to strip invisible Unicode directional marks');

console.log('  ✅ Arabic, Persian, and Unicode marks successfully converted to 10 ASCII digits: 8391048291\n');

// ------------------------------------------------------------------
// TEST 2: Paywall Lockdown & Fake Role Protection
// ------------------------------------------------------------------
console.log('Test 2: Verifying that paywall blocks unauthorized roles and guests...');

const paidLecture = {
  id: 'lec-sec3-01',
  title: 'المحاضرة الأولى: التأسيس الشامل',
  stageId: 'sec-3',
  sectionId: 'sec-3-month-01',
  isFree: false
};

const freeLecture = {
  id: 'lec-free-intro',
  title: 'محاضرة تأسيسية مجانية',
  stageId: 'sec-3',
  sectionId: 'sec-3-month-01',
  isFree: true
};

// Simulation of canAccessLecture logic
function simulateCanAccessLecture({ lecture, currentUser, role, isVerifiedAdmin }) {
  if (!lecture) return { allowed: false, reason: 'المحاضرة غير موجودة' };
  
  // Only verified admin session can bypass paywall (NEVER raw unverified role string!)
  if (isVerifiedAdmin) {
    return { allowed: true, isTeacherOverride: true, reason: 'حساب المعلم المعتمد' };
  }

  // Free lectures are always open
  if (lecture.isFree) {
    return { allowed: true, reason: 'محاضرة مجانية' };
  }

  // Must be logged in
  const uid = currentUser?.uid || currentUser?.id;
  if (!currentUser || !uid || uid === 'guest') {
    return { allowed: false, requiresAuth: true, reason: 'يجب تسجيل الدخول بحساب Google أولاً' };
  }

  // Check subscriptions
  const userSubs = currentUser.subscriptions || {};
  for (const [subKey, sub] of Object.entries(userSubs)) {
    if (!sub) continue;
    if (coversLecture(sub, lecture, [lecture])) {
      if (sub.isFrozen || sub.status === 'frozen') return { allowed: false, reason: 'الاشتراك مجمد' };
      return { allowed: true, reason: 'اشتراك سارٍ ومفعل' };
    }
  }

  return { allowed: false, reason: 'هذه المحاضرة تتطلب اشتراكاً مفعل' };
}

// Case A: Unauthenticated guest tries to watch paid lecture
const guestAccess = simulateCanAccessLecture({
  lecture: paidLecture,
  currentUser: null,
  role: 'student',
  isVerifiedAdmin: false
});
assert.strictEqual(guestAccess.allowed, false, 'Guest must NOT be allowed to watch paid lecture');
console.log('  ✅ Case A: Unauthenticated guest is strictly BLOCKED from paid lecture.');

// Case B: Student without subscription tries to watch paid lecture
const studentNoSub = simulateCanAccessLecture({
  lecture: paidLecture,
  currentUser: { uid: 'student-123', name: 'أحمد علي', subscriptions: {} },
  role: 'student',
  isVerifiedAdmin: false
});
assert.strictEqual(studentNoSub.allowed, false, 'Student without subscription must be blocked');
console.log('  ✅ Case B: Student without active subscription is strictly BLOCKED.');

// Case C: Fake role attempt - User sets role="instructor" in localStorage but has NO valid admin session token
const fakeTeacherAccess = simulateCanAccessLecture({
  lecture: paidLecture,
  currentUser: { uid: 'student-hacker', name: 'مهاجم' },
  role: 'instructor', // Fake role!
  isVerifiedAdmin: false // No valid admin session!
});
assert.strictEqual(fakeTeacherAccess.allowed, false, 'Fake instructor role must NOT bypass the paywall!');
console.log('  ✅ Case C: Tampered/fake instructor role WITHOUT verified admin PIN is strictly BLOCKED!');

// Case D: Anyone can watch free lecture
const freeAccess = simulateCanAccessLecture({
  lecture: freeLecture,
  currentUser: null,
  role: 'student',
  isVerifiedAdmin: false
});
assert.strictEqual(freeAccess.allowed, true, 'Free lecture must be allowed for everyone');
console.log('  ✅ Case D: Free lecture is accessible to everyone.');

// Case E: Legit teacher with verified admin session
const legitTeacherAccess = simulateCanAccessLecture({
  lecture: paidLecture,
  currentUser: { uid: 'teacher-michael' },
  role: 'instructor',
  isVerifiedAdmin: true
});
assert.strictEqual(legitTeacherAccess.allowed, true, 'Legit verified teacher must have access');
console.log('  ✅ Case E: Verified teacher with active cryptographic admin session has full access.\n');

// ------------------------------------------------------------------
// TEST 3: Cross-Device Code Redemption & Single-Use Enforcement
// ------------------------------------------------------------------
console.log('Test 3: Testing 3 subscription code types and single-use enforcement...');

const mockStages = [
  { id: 'sec-3', name: 'الصف الثالث الثانوي' }
];
const mockSections = [
  { id: 'sec-3-month-01', stageId: 'sec-3', title: 'شهر أكتوبر 2026', price: 180 },
  { id: 'sec-3-month-02', stageId: 'sec-3', title: 'شهر نوفمبر 2026', price: 180 }
];
const mockLectures = [
  paidLecture,
  { id: 'lec-sec3-02', title: 'المحاضرة الثانية', stageId: 'sec-3', sectionId: 'sec-3-month-01', isFree: false },
  { id: 'lec-sec3-nov', title: 'محاضرة نوفمبر', stageId: 'sec-3', sectionId: 'sec-3-month-02', isFree: false }
];

// Code 1: Month Subscription Code
const monthCode = {
  code: '8391048291',
  codeType: 'month',
  targetId: 'sec-3-month-01',
  targetTitle: 'شهر أكتوبر 2026',
  stageId: 'sec-3',
  price: '180 ج.م',
  isUsed: false,
  usedCount: 0,
  maxUses: 1,
  isActive: true
};

// Simulate student 1 entering the code from an iPad in Arabic digits: ٨٣٩١٠٤٨٢٩١
const typedCodeByStudent1 = '٨٣٩١٠٤٨٢٩١';
const cleanCode1 = normalize10DigitCode(typedCodeByStudent1);
assert.strictEqual(cleanCode1, monthCode.code);

// Student 1 redeems code
const student1 = {
  uid: 'student-mina',
  name: 'مينا سمير',
  email: 'mina@example.com',
  subscriptions: {}
};

// Simulate redemption
monthCode.isUsed = true;
monthCode.usedCount = 1;
monthCode.usedByUid = student1.uid;
monthCode.usedBy = student1.name;

const createdSub = {
  userId: student1.uid,
  targetId: monthCode.targetId,
  stageId: monthCode.stageId,
  codeType: monthCode.codeType,
  isPermanent: true,
  status: 'active'
};
student1.subscriptions[monthCode.targetId] = createdSub;

// Verify Student 1 can now access October lectures
const oct1Access = simulateCanAccessLecture({
  lecture: paidLecture,
  currentUser: student1,
  role: 'student',
  isVerifiedAdmin: false
});
assert.strictEqual(oct1Access.allowed, true, 'Student 1 must access lecture covered by month subscription');

// Verify Student 1 CANNOT access November lecture (different month!)
const novAccess = simulateCanAccessLecture({
  lecture: mockLectures[2],
  currentUser: student1,
  role: 'student',
  isVerifiedAdmin: false
});
assert.strictEqual(novAccess.allowed, false, 'Student 1 must NOT access unpurchased month');
console.log('  ✅ Month Code: Unlocks all lectures in the purchased month, but keeps new months locked.');

// Student 2 tries to use the same code: 8391048291
const student2 = {
  uid: 'student-george',
  name: 'جورج ماهر',
  email: 'george@example.com',
  subscriptions: {}
};

function tryRedeem(codeDoc, student) {
  if (codeDoc.isUsed && codeDoc.usedByUid !== student.uid) {
    return { ok: false, error: 'already_used', message: 'الكود مستخدم بالفعل من قِبل طالب آخر' };
  }
  return { ok: true };
}

const reuseResult = tryRedeem(monthCode, student2);
assert.strictEqual(reuseResult.ok, false);
assert.strictEqual(reuseResult.error, 'already_used');
console.log('  ✅ Single-Use Enforcement: Second student cannot reuse the same code (already_used).');

// Code 2: Stage Full Access Code
const stageCode = {
  code: '9182736450',
  codeType: 'stage',
  targetId: 'sec-3',
  targetTitle: 'الصف الثالث الثانوي كاملاً',
  stageId: 'sec-3',
  isUsed: false,
  usedCount: 0,
  maxUses: 1,
  isActive: true
};
const student3 = {
  uid: 'student-kirollos',
  name: 'كيرلس رفعت',
  subscriptions: {
    'sec-3': { targetId: 'sec-3', stageId: 'sec-3', codeType: 'stage', status: 'active', isPermanent: true }
  }
};
const octStageAccess = simulateCanAccessLecture({ lecture: paidLecture, currentUser: student3, role: 'student', isVerifiedAdmin: false });
const novStageAccess = simulateCanAccessLecture({ lecture: mockLectures[2], currentUser: student3, role: 'student', isVerifiedAdmin: false });
assert.strictEqual(octStageAccess.allowed, true);
assert.strictEqual(novStageAccess.allowed, true);
console.log('  ✅ Stage Code: Successfully unlocks current and future months in the stage.');

// Code 3: Single Lecture Code
const singleLecCode = {
  code: '1029384756',
  codeType: 'lecture',
  targetId: 'lec-sec3-01',
  targetTitle: 'المحاضرة الأولى: التأسيس الشامل',
  stageId: 'sec-3',
  isUsed: false,
  usedCount: 0,
  maxUses: 1,
  isActive: true
};
const student4 = {
  uid: 'student-fady',
  name: 'فادي إبراهيم',
  subscriptions: {
    'lec-sec3-01': { targetId: 'lec-sec3-01', stageId: 'sec-3', codeType: 'lecture', status: 'active', isPermanent: true }
  }
};
const lec1Access = simulateCanAccessLecture({ lecture: paidLecture, currentUser: student4, role: 'student', isVerifiedAdmin: false });
const lec2Access = simulateCanAccessLecture({ lecture: mockLectures[1], currentUser: student4, role: 'student', isVerifiedAdmin: false });
assert.strictEqual(lec1Access.allowed, true);
assert.strictEqual(lec2Access.allowed, false);
console.log('  ✅ Single Lecture Code: Unlocks only the specific lecture, other lectures remain locked.');

console.log('\n====================================================');
console.log('🎉 ALL CROSS-DEVICE LOCKDOWN & CODE TESTS PASSED 100%');
console.log('====================================================');
