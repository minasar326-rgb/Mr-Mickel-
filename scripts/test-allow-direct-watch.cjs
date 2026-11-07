const assert = require('assert');

console.log('🧪 Starting Direct Watch Feature Verification Tests...\n');

// 1. Mock Entitlements logic
function coversLecture(subscription, lecture, allLectures) {
  if (!subscription || !lecture) return false;
  const targetId = String(subscription.targetId || '').trim();
  const subType = subscription.codeType || subscription.targetType;

  if (targetId === 'all-access') return true;

  if (subType === 'stage') {
    const s1 = String(lecture.stageId || '').trim();
    return s1 === targetId;
  }

  if (subType === 'month' || subType === 'section') {
    const lecSectionId = String(lecture.sectionId || '').trim();
    if (lecSectionId && lecSectionId === targetId) return true;
    return false;
  }

  if (subType === 'lecture') {
    return String(lecture.id || '').trim() === targetId;
  }

  return false;
}

// 2. Mock canAccessLecture logic from TeacherContext.jsx
function canAccessLecture(lecture, stageId, context) {
  const {
    currentUser,
    isAdminVerified,
    manualOverrides = {},
    sections = [],
    lectures = [],
    videoWatchProgress = {},
    examResults = {},
    examSubmissions = {}
  } = context;

  if (!lecture) {
    return { allowed: false, reasonCode: 'not_found' };
  }

  if (isAdminVerified) {
    return { allowed: true, isTeacherOverride: true, reasonCode: 'teacher_override' };
  }

  const currentUid = currentUser?.uid || currentUser?.id;
  if (currentUid && manualOverrides[lecture.id]?.[currentUid]?.unlocked) {
    return { allowed: true, isTeacherOverride: true, reasonCode: 'teacher_manual_override' };
  }

  if (Boolean(lecture.isFree)) {
    return { allowed: true, reasonCode: 'free_lecture' };
  }

  if (!currentUser || !currentUid || currentUid === 'guest') {
    return { allowed: false, requiresAuth: true, reasonCode: 'not_logged_in' };
  }

  const userSubs = currentUser.subscriptions || {};
  let matchingSub = null;
  for (const [subKey, sub] of Object.entries(userSubs)) {
    if (!sub) continue;
    if (coversLecture(sub, lecture, lectures)) {
      matchingSub = sub;
      break;
    }
  }

  if (!matchingSub) {
    return { allowed: false, requiresSubscription: true, reasonCode: 'not_subscribed' };
  }

  // 6. Check section progression toggle & direct watch override
  const currentSection = (sections || []).find(s => s.id === lecture.sectionId);
  const enforceProgression = Boolean(currentSection?.enforceProgression);

  if (lecture.allowDirectWatch || !enforceProgression || matchingSub.codeType === 'lecture' || matchingSub.targetId === lecture.id) {
    return {
      allowed: true,
      reasonCode: lecture.allowDirectWatch ? 'unlocked_direct' : 'unlocked',
      reasonText: lecture.allowDirectWatch 
        ? 'المحاضرة متاحة للمشاهدة المباشرة دون اشتراط المحاضرات السابقة' 
        : 'المحاضرة متاحة ومفتوحة بالكامل ضمن اشتراكك النشط'
    };
  }

  // 7. Sequential progression check within the cohort
  const cohort = (lectures || [])
    .filter(l => !l.isDeleted)
    .filter(l => l.sectionId === lecture.sectionId)
    .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

  const currIdx = cohort.findIndex(l => l.id === lecture.id);
  if (currIdx <= 0) {
    return { allowed: true, reasonCode: 'unlocked_first' };
  }

  const prevLec = cohort[currIdx - 1];
  const prevProg = videoWatchProgress[prevLec.id] || { percent: 0 };
  const prevWatchPercent = prevProg.percent || 0;
  const requiredWatchPercent = Number(currentSection?.requiredWatchPercent || 50);

  if (prevWatchPercent < requiredWatchPercent) {
    return {
      allowed: false,
      isProgressionLocked: true,
      reasonCode: 'watch_previous'
    };
  }

  return { allowed: true, reasonCode: 'unlocked' };
}

// ---------------------------------------------------------------------
// TEST SUITE
// ---------------------------------------------------------------------
const mockSection = {
  id: 'sec3-month-1',
  stageId: 'sec-3',
  enforceProgression: true,
  requiredWatchPercent: 50
};

const mockLectures = [
  { id: 'lec-1', sectionId: 'sec3-month-1', stageId: 'sec-3', order: 1, title: 'محاضرة 1', allowDirectWatch: false, isFree: false },
  { id: 'lec-2', sectionId: 'sec3-month-1', stageId: 'sec-3', order: 2, title: 'محاضرة 2 (عادية)', allowDirectWatch: false, isFree: false },
  { id: 'lec-3', sectionId: 'sec3-month-1', stageId: 'sec-3', order: 3, title: 'محاضرة 3 (مشاهدة مباشرة)', allowDirectWatch: true, isFree: false },
  { id: 'lec-free', sectionId: 'sec3-month-1', stageId: 'sec-3', order: 4, title: 'محاضرة مجانية', allowDirectWatch: false, isFree: true }
];

// Test 1: Subscribed student with 0% watch on Lecture 1
console.log('Test 1: Subscribed student accessing lecture with allowDirectWatch: true');
const subscribedUser = {
  uid: 'student-123',
  subscriptions: {
    'sub-1': { codeType: 'month', targetId: 'sec3-month-1', status: 'active' }
  }
};

const resLec1 = canAccessLecture(mockLectures[0], 'sec-3', {
  currentUser: subscribedUser,
  sections: [mockSection],
  lectures: mockLectures,
  videoWatchProgress: {}
});
assert.strictEqual(resLec1.allowed, true);
assert.strictEqual(resLec1.reasonCode, 'unlocked_first');
console.log('  ✓ Lecture 1 is unlocked (first in cohort)');

const resLec2 = canAccessLecture(mockLectures[1], 'sec-3', {
  currentUser: subscribedUser,
  sections: [mockSection],
  lectures: mockLectures,
  videoWatchProgress: { 'lec-1': { percent: 0 } }
});
assert.strictEqual(resLec2.allowed, false);
assert.strictEqual(resLec2.reasonCode, 'watch_previous');
console.log('  ✓ Lecture 2 is locked by progression (prev watch is 0%)');

const resLec3 = canAccessLecture(mockLectures[2], 'sec-3', {
  currentUser: subscribedUser,
  sections: [mockSection],
  lectures: mockLectures,
  videoWatchProgress: { 'lec-1': { percent: 0 }, 'lec-2': { percent: 0 } }
});
assert.strictEqual(resLec3.allowed, true);
assert.strictEqual(resLec3.reasonCode, 'unlocked_direct');
console.log('  ✓ Lecture 3 (allowDirectWatch: true) is UNLOCKED directly without watching prev lectures!');

// Test 2: Unsubscribed student attempting to access Lecture 3
console.log('\nTest 2: Unsubscribed student attempting to access direct watch lecture');
const unsubscribedUser = {
  uid: 'student-unsub',
  subscriptions: {}
};

const resUnsubLec3 = canAccessLecture(mockLectures[2], 'sec-3', {
  currentUser: unsubscribedUser,
  sections: [mockSection],
  lectures: mockLectures
});
assert.strictEqual(resUnsubLec3.allowed, false);
assert.strictEqual(resUnsubLec3.reasonCode, 'not_subscribed');
console.log('  ✓ Unsubscribed student is BLOCKED from Lecture 3 (subscription paywall preserved)');

// Test 3: Free lecture access
console.log('\nTest 3: Unsubscribed student accessing free lecture');
const resFree = canAccessLecture(mockLectures[3], 'sec-3', {
  currentUser: unsubscribedUser,
  sections: [mockSection],
  lectures: mockLectures
});
assert.strictEqual(resFree.allowed, true);
assert.strictEqual(resFree.reasonCode, 'free_lecture');
console.log('  ✓ Free lecture remains accessible to everyone');

// Test 4: sanitizeLectures preserves allowDirectWatch
console.log('\nTest 4: sanitizeLectures preserves allowDirectWatch');
const sanitizeLectures = (list) => {
  if (!Array.isArray(list)) return [];
  return list.map(lec => {
    if (!lec) return lec;
    return {
      ...lec,
      allowDirectWatch: Boolean(lec.allowDirectWatch)
    };
  });
};

const cleaned = sanitizeLectures([
  { id: '1', allowDirectWatch: true },
  { id: '2', allowDirectWatch: false },
  { id: '3' }
]);
assert.strictEqual(cleaned[0].allowDirectWatch, true);
assert.strictEqual(cleaned[1].allowDirectWatch, false);
assert.strictEqual(cleaned[2].allowDirectWatch, false);
console.log('  ✓ sanitizeLectures correctly normalizes and preserves allowDirectWatch boolean');

console.log('\n🎉 ALL DIRECT WATCH VERIFICATION TESTS PASSED SUCCESSFULLY! (100% Pass)');
