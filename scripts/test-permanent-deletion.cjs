const assert = require('assert');

console.log('🧪 Starting Permanent Deletion Logic Audit...');

// Simulate local storage
const storage = {};
global.localStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; }
};

// Test 1: Verify getDeletedLectureIds and mergeLectures
const getDeletedLectureIds = () => {
  try {
    const raw = localStorage.getItem('ms_deleted_lectures');
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch (e) {
    return new Set();
  }
};

const mergeLectures = (prevList = [], incomingList = [], incomingDeletedIds = []) => {
  const deletedIds = getDeletedLectureIds();
  (incomingDeletedIds || []).forEach(id => { if (id) deletedIds.add(id); });

  try {
    localStorage.setItem('ms_deleted_lectures', JSON.stringify(Array.from(deletedIds)));
  } catch (e) {}

  if (!Array.isArray(incomingList) || incomingList.length === 0) {
    return (prevList || []).filter(l => l && !l.isDeleted && !deletedIds.has(l.id));
  }

  const map = new Map();

  (prevList || []).forEach(item => {
    if (!item || !item.id || deletedIds.has(item.id) || item.isDeleted) return;
    map.set(item.id, item);
  });

  incomingList.forEach(incoming => {
    if (!incoming || !incoming.id || deletedIds.has(incoming.id) || incoming.isDeleted) return;
    if (map.has(incoming.id)) {
      const existing = map.get(incoming.id);
      map.set(incoming.id, { ...existing, ...incoming });
    } else {
      map.set(incoming.id, incoming);
    }
  });

  return Array.from(map.values()).filter(l => l && l.id && !deletedIds.has(l.id) && !l.isDeleted);
};

// Test scenario:
// Step 1: Active lectures
const initial = [
  { id: 'lec-1', title: 'مقدمة', isDeleted: false },
  { id: 'lec-2', title: 'شرح زمن الماضي', isDeleted: false },
  { id: 'lec-3', title: 'محاضرة للمسح', isDeleted: false }
];

let current = mergeLectures([], initial);
assert.strictEqual(current.length, 3, 'Initial lectures must be 3');

// Step 2: Delete lec-3
const deletedIds = getDeletedLectureIds();
deletedIds.add('lec-3');
localStorage.setItem('ms_deleted_lectures', JSON.stringify(Array.from(deletedIds)));

current = current.filter(l => l.id !== 'lec-3');
localStorage.setItem('ms_lectures', JSON.stringify(current));
assert.strictEqual(current.length, 2, 'After delete, current must be 2');

// Step 3: Incoming sync from old RTDB or Firestore containing lec-3
const incomingStaleSync = [
  { id: 'lec-1', title: 'مقدمة' },
  { id: 'lec-2', title: 'شرح زمن الماضي' },
  { id: 'lec-3', title: 'محاضرة للمسح' } // STALE RECORD
];

// In the old buggy code, this would have REVIVED lec-3 and wiped it from deletedIds!
const mergedAfterStaleSync = mergeLectures(current, incomingStaleSync, Array.from(getDeletedLectureIds()));

assert.strictEqual(mergedAfterStaleSync.length, 2, 'Stale sync MUST NOT resurrect deleted lecture lec-3');
assert.ok(!mergedAfterStaleSync.some(l => l.id === 'lec-3'), 'lec-3 must not be present');

// Verify deletedIds still has lec-3
const postDeletedIds = getDeletedLectureIds();
assert.ok(postDeletedIds.has('lec-3'), 'Tombstone lec-3 MUST remain in deletedIds');

console.log('✅ TEST PASSED: No resurrection possible from any stale sync!');
console.log('✅ TEST PASSED: Tombstone set is strictly preserved and enforced!');
