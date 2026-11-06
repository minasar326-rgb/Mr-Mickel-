/**
 * Stage Isolation Automated Test Suite
 * Validates Requirement 1, 2, 3, 5, 6:
 * - Subscribing to pri-5 does NOT unlock pri-6 or sec-3.
 * - Subscribing to all-access unlocks all stages.
 * - Nonexistent stage returns null / doesn't fall back to sec-3.
 * - Strict equality filtering isolates lectures per stage.
 */
const assert = require('assert');
const path = require('path');

// Test entitlement engine
const { coversLecture } = require('../src/utils/entitlements.js');
const { CANONICAL_STAGES, normalizeStageId } = require('../src/utils/stages.js');

let passedTests = 0;
let totalTests = 0;

function it(description, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ PASS: ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${description}`);
    console.error(`     ${err.message}`);
  }
}

console.log('\n======================================================');
console.log('🧪 Starting Stage Isolation Test Suite (Stage 1)');
console.log('======================================================\n');

// 1. Cross-stage subscription isolation tests
it('Stage subscription for pri-5 does NOT unlock pri-6', () => {
  const pri5Sub = { codeType: 'stage', targetId: 'pri-5', stageId: 'pri-5', status: 'active' };
  const pri6Lecture = { id: 'lec-pri6-01', stageId: 'pri-6', title: 'English P6' };
  const allowed = coversLecture(pri5Sub, pri6Lecture);
  assert.strictEqual(allowed, false, 'pri-5 subscription must NOT unlock pri-6');
});

it('Stage subscription for pri-5 does NOT unlock sec-3', () => {
  const pri5Sub = { codeType: 'stage', targetId: 'pri-5', stageId: 'pri-5', status: 'active' };
  const sec3Lecture = { id: 'lec-s3-01', stageId: 'sec-3', title: 'Thanaweya Grammar' };
  const allowed = coversLecture(pri5Sub, sec3Lecture);
  assert.strictEqual(allowed, false, 'pri-5 subscription must NOT unlock sec-3');
});

it('Stage subscription for pri-5 DOES unlock pri-5 lectures', () => {
  const pri5Sub = { codeType: 'stage', targetId: 'pri-5', stageId: 'pri-5', status: 'active' };
  const pri5Lecture = { id: 'lec-pri5-01', stageId: 'pri-5', title: 'Grade 5 Phonics' };
  const allowed = coversLecture(pri5Sub, pri5Lecture);
  assert.strictEqual(allowed, true, 'pri-5 subscription MUST unlock pri-5');
});

it('All-access VIP subscription DOES unlock all stages (pri-5, pri-6, sec-3)', () => {
  const allAccessSub = { codeType: 'all-access', targetId: 'all-access', status: 'active' };
  const pri5Lecture = { id: 'lec-pri5-01', stageId: 'pri-5' };
  const pri6Lecture = { id: 'lec-pri6-01', stageId: 'pri-6' };
  const sec3Lecture = { id: 'lec-s3-01', stageId: 'sec-3' };
  assert.strictEqual(coversLecture(allAccessSub, pri5Lecture), true);
  assert.strictEqual(coversLecture(allAccessSub, pri6Lecture), true);
  assert.strictEqual(coversLecture(allAccessSub, sec3Lecture), true);
});

// 2. Strict stage lookup and no-fallback tests
it('normalizeStageId with empty/unknown does NOT fall back to sec-3', () => {
  const resultEmpty = normalizeStageId('');
  assert.notStrictEqual(resultEmpty, 'sec-3', 'Empty string must not collapse to sec-3');

  const customStage = normalizeStageId('custom-grade-xyz');
  assert.strictEqual(customStage, 'custom-grade-xyz', 'Custom stages must be preserved');
});

it('Strict equality filtering strictly separates lectures across stages', () => {
  const mockLectures = [
    { id: 'l1', stageId: 'pri-5', title: 'Grade 5 Unit 1' },
    { id: 'l2', stageId: 'pri-5', title: 'Grade 5 Unit 2' },
    { id: 'l3', stageId: 'pri-6', title: 'Grade 6 Unit 1' },
    { id: 'l4', stageId: 'sec-3', title: 'Senior 3 Unit 1' }
  ];

  const currentStage = { id: 'pri-5', name: 'الصف الخامس الابتدائي' };
  const filtered = mockLectures.filter(l => l.stageId === currentStage.id);

  assert.strictEqual(filtered.length, 2, 'Should only contain the 2 pri-5 lectures');
  assert.strictEqual(filtered.some(l => l.stageId === 'sec-3'), false, 'sec-3 must NOT appear in pri-5');
  assert.strictEqual(filtered.some(l => l.stageId === 'pri-6'), false, 'pri-6 must NOT appear in pri-5');
});

// 3. Stage isolation for months & sections
it('Sections must match strictly on stageId', () => {
  const mockSections = [
    { id: 'm1-p5', stageId: 'pri-5', title: 'شهر أكتوبر خامسة ابتدائي' },
    { id: 'm1-s3', stageId: 'sec-3', title: 'شهر أكتوبر تالتة ثانوي' }
  ];

  const pri5Sections = mockSections.filter(s => s.stageId === 'pri-5');
  assert.strictEqual(pri5Sections.length, 1);
  assert.strictEqual(pri5Sections[0].id, 'm1-p5');
});

console.log('\n------------------------------------------------------');
console.log(`Results: ${passedTests}/${totalTests} tests passed (${Math.round((passedTests / totalTests) * 100)}%)`);
console.log('------------------------------------------------------\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
