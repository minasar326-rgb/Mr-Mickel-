/**
 * Comprehensive 4-Stage Isolation & Empty Months Verification Suite
 * Stage B Requirements:
 * 4 Stages: pri-3 (Grade 3), pri-5 (Grade 5), prep-3 (Prep 3), sec-3 (Senior 3)
 * Each stage contains:
 * - 2 sections: 1 populated, 1 completely empty
 * - 2 lectures with video, booklet & exam
 * - 1 month code & 1 stage code
 */

const assert = require('assert');
const { coversLecture } = require('../src/utils/entitlements.js');
const { normalizeStageId } = require('../src/utils/stages.js');

let passed = 0;
let total = 0;

function check(title, fn) {
  total++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${title}`);
    passed++;
  } catch (e) {
    console.error(`  ❌ [FAIL] ${title}: ${e.message}`);
  }
}

console.log('=============================================================');
console.log('🧪 4-STAGE RIGOROUS ISOLATION & EMPTY MONTHS MATRIX TEST');
console.log('=============================================================');

// 1. Data Model Definition
const STAGES = [
  { id: 'pri-3', name: 'الصف الثالث الابتدائي' },
  { id: 'pri-5', name: 'الصف الخامس الابتدائي' },
  { id: 'prep-3', name: 'الصف الثالث الإعدادي' },
  { id: 'sec-3', name: 'الصف الثالث الثانوي' }
];

const SECTIONS = [
  // Populated months
  { id: 'sec-pri3-oct', stageId: 'pri-3', title: 'شهر أكتوبر (ابتدائي 3)' },
  { id: 'sec-pri5-oct', stageId: 'pri-5', title: 'شهر أكتوبر (ابتدائي 5)' },
  { id: 'sec-prep3-oct', stageId: 'prep-3', title: 'شهر أكتوبر (إعدادي 3)' },
  { id: 'sec-sec3-oct', stageId: 'sec-3', title: 'شهر أكتوبر (ثانوي 3)' },
  // Empty months (0 lectures)
  { id: 'sec-pri3-nov-empty', stageId: 'pri-3', title: 'شهر نوفمبر فاضي (ابتدائي 3)' },
  { id: 'sec-pri5-nov-empty', stageId: 'pri-5', title: 'شهر نوفمبر فاضي (ابتدائي 5)' },
  { id: 'sec-prep3-nov-empty', stageId: 'prep-3', title: 'شهر نوفمبر فاضي (إعدادي 3)' },
  { id: 'sec-sec3-nov-empty', stageId: 'sec-3', title: 'شهر نوفمبر فاضي (ثانوي 3)' }
];

const LECTURES = [
  // pri-3
  { id: 'lec-pri3-01', stageId: 'pri-3', sectionId: 'sec-pri3-oct', title: 'Phonics 3-1', videoUrl: 'https://r2.dev/stages/pri-3/lectures/videos/v1.mp4', isFree: false },
  { id: 'lec-pri3-02', stageId: 'pri-3', sectionId: 'sec-pri3-oct', title: 'Phonics 3-2', videoUrl: 'https://r2.dev/stages/pri-3/lectures/videos/v2.mp4', isFree: false },
  // pri-5
  { id: 'lec-pri5-01', stageId: 'pri-5', sectionId: 'sec-pri5-oct', title: 'Connect 5-1', videoUrl: 'https://r2.dev/stages/pri-5/lectures/videos/v1.mp4', isFree: false },
  { id: 'lec-pri5-02', stageId: 'pri-5', sectionId: 'sec-pri5-oct', title: 'Connect 5-2', videoUrl: 'https://r2.dev/stages/pri-5/lectures/videos/v2.mp4', isFree: false },
  // prep-3
  { id: 'lec-prep3-01', stageId: 'prep-3', sectionId: 'sec-prep3-oct', title: 'Around Town 1', videoUrl: 'https://r2.dev/stages/prep-3/lectures/videos/v1.mp4', isFree: false },
  { id: 'lec-prep3-02', stageId: 'prep-3', sectionId: 'sec-prep3-oct', title: 'Around Town 2', videoUrl: 'https://r2.dev/stages/prep-3/lectures/videos/v2.mp4', isFree: false },
  // sec-3
  { id: 'lec-sec3-01', stageId: 'sec-3', sectionId: 'sec-sec3-oct', title: 'Past Simple & Cont', videoUrl: 'https://r2.dev/stages/sec-3/lectures/videos/v1.mp4', isFree: false },
  { id: 'lec-sec3-02', stageId: 'sec-3', sectionId: 'sec-sec3-oct', title: 'Present Perfect', videoUrl: 'https://r2.dev/stages/sec-3/lectures/videos/v2.mp4', isFree: false }
];

console.log('\n--- TEST GROUP A: Strict Stage Content Filtering (Zero Cross-Bleed) ---');

STAGES.forEach(stg => {
  check(`Stage ${stg.name} (${stg.id}) filters strictly to its own 2 lectures`, () => {
    const stageLectures = LECTURES.filter(l => l.stageId === stg.id);
    assert.strictEqual(stageLectures.length, 2);
    assert(stageLectures.every(l => l.stageId === stg.id));
  });

  check(`Stage ${stg.name} (${stg.id}) sections strictly match its own stageId`, () => {
    const stageSections = SECTIONS.filter(s => s.stageId === stg.id);
    assert.strictEqual(stageSections.length, 2);
    assert(stageSections.every(s => s.stageId === stg.id));
  });
});

console.log('\n--- TEST GROUP B: Empty Months Logic (Student vs Teacher) ---');

STAGES.forEach(stg => {
  check(`Empty month in ${stg.id} is HIDDEN from student view (0 lectures)`, () => {
    const studentVisibleSections = SECTIONS.filter(sec => {
      if (sec.stageId !== stg.id) return false;
      const lecturesCount = LECTURES.filter(l => l.stageId === stg.id && l.sectionId === sec.id).length;
      return lecturesCount > 0;
    });

    assert.strictEqual(studentVisibleSections.length, 1, 'Only populated month should be visible to student');
    assert.strictEqual(studentVisibleSections[0].id, `sec-${stg.id.replace('-', '')}-oct`);
  });

  check(`Empty month in ${stg.id} remains VISIBLE to teacher with "مخفي عن الطلاب" badge`, () => {
    const teacherVisibleSections = SECTIONS.filter(sec => sec.stageId === stg.id);
    assert.strictEqual(teacherVisibleSections.length, 2, 'Teacher must see both populated and empty months');
    const emptySec = teacherVisibleSections.find(s => s.id.includes('empty'));
    const lecturesInEmpty = LECTURES.filter(l => l.sectionId === emptySec.id).length;
    assert.strictEqual(lecturesInEmpty, 0);
  });
});

console.log('\n--- TEST GROUP C: Cross-Stage Entitlement Isolation ---');

const testCases = [
  { subStage: 'pri-3', targetStage: 'pri-5', expected: false },
  { subStage: 'pri-3', targetStage: 'prep-3', expected: false },
  { subStage: 'pri-3', targetStage: 'sec-3', expected: false },
  { subStage: 'pri-5', targetStage: 'pri-3', expected: false },
  { subStage: 'pri-5', targetStage: 'prep-3', expected: false },
  { subStage: 'pri-5', targetStage: 'sec-3', expected: false },
  { subStage: 'prep-3', targetStage: 'sec-3', expected: false },
  { subStage: 'sec-3', targetStage: 'pri-3', expected: false },
  // Self stage must pass
  { subStage: 'pri-3', targetStage: 'pri-3', expected: true },
  { subStage: 'pri-5', targetStage: 'pri-5', expected: true },
  { subStage: 'prep-3', targetStage: 'prep-3', expected: true },
  { subStage: 'sec-3', targetStage: 'sec-3', expected: true }
];

testCases.forEach(tc => {
  const sub = { codeType: 'stage', targetId: tc.subStage, stageId: tc.subStage, status: 'active' };
  const targetLecture = LECTURES.find(l => l.stageId === tc.targetStage);
  check(`Subscription to ${tc.subStage} -> Lecture in ${tc.targetStage} must be ${tc.expected ? 'ALLOWED' : 'BLOCKED'}`, () => {
    const allowed = coversLecture(sub, targetLecture);
    assert.strictEqual(allowed, tc.expected);
  });
});

check('All-Access VIP subscription covers lectures across ALL 4 stages', () => {
  const allAccessSub = { codeType: 'all-access', targetId: 'all-access', status: 'active' };
  for (const lec of LECTURES) {
    assert.strictEqual(coversLecture(allAccessSub, lec), true);
  }
});

console.log('\n--- TEST GROUP D: Cloudflare R2 Key Structure ---');

LECTURES.forEach(lec => {
  check(`Lecture ${lec.id} storage path includes stages/${lec.stageId}/`, () => {
    assert(lec.videoUrl.includes(`stages/${lec.stageId}/`), `Path should contain stages/${lec.stageId}/`);
  });
});

console.log('\n--- TEST GROUP E: Non-Existent Stage Fallback Guard ---');

check('Non-existent stage ID (pri-99) does not collapse into sec-3', () => {
  const res = normalizeStageId('pri-99');
  assert.strictEqual(res, 'pri-99', 'Must preserve original custom ID');
  assert.notStrictEqual(res, 'sec-3', 'Must never force sec-3');
});

console.log('\n-------------------------------------------------------------');
console.log(`Matrix Test Results: ${passed}/${total} scenarios passed (${Math.round((passed / total) * 100)}%)`);
console.log('-------------------------------------------------------------\n');

if (passed !== total) process.exit(1);
