const assert = require('assert');
const { coversLecture } = require('../src/utils/entitlements.js');

console.log('Testing coversLecture with sectionId properly assigned...');

const testLec1 = { id: 'lec-s3-01', stageId: 'sec-3', sectionId: 'sec3-month-1', isFree: false };
const testLec2 = { id: 'lec-s3-02', stageId: 'sec-3', sectionId: 'sec3-month-1', isFree: false };
const testLec3 = { id: 'lec-s3-03', stageId: 'sec-3', sectionId: 'sec3-month-2', isFree: false };
const testLecS2 = { id: 'lec-s2-01', stageId: 'sec-2', sectionId: 'sec2-month-1', isFree: false };

const monthSub = {
  targetId: 'sec3-month-1',
  codeType: 'month',
  stageId: 'sec-3',
  isPermanent: true,
  status: 'active'
};

console.log('Lec 1 (Month 1):', coversLecture(monthSub, testLec1));
console.log('Lec 2 (Month 1):', coversLecture(monthSub, testLec2));
console.log('Lec 3 (Month 2):', coversLecture(monthSub, testLec3));
console.log('Lec S2 (Stage 2):', coversLecture(monthSub, testLecS2));

assert.strictEqual(coversLecture(monthSub, testLec1), true, 'Lec 1 must be covered');
assert.strictEqual(coversLecture(monthSub, testLec2), true, 'Lec 2 must be covered');
assert.strictEqual(coversLecture(monthSub, testLec3), false, 'Lec 3 must NOT be covered');
assert.strictEqual(coversLecture(monthSub, testLecS2), false, 'Lec S2 must NOT be covered');

console.log('✅ coversLecture logic works perfectly once sectionId is populated!');
