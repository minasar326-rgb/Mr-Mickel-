const fs = require('fs');

const manifest = JSON.parse(fs.readFileSync('public/lectures-manifest.json', 'utf8'));
const incomingLectures = manifest.lectures;
const incomingDeletedIds = manifest.deletedLectureIds;

console.log('Incoming lectures count:', incomingLectures.length);
console.log('Incoming deleted count:', incomingDeletedIds.length);

const deletedIds = new Set(incomingDeletedIds);
deletedIds.add('lec-s3-01'); // Simulate stale injection

console.log('Before anti-stale, has lec-s3-01?', deletedIds.has('lec-s3-01'));

const cloudDeletedSet = new Set(incomingDeletedIds);
incomingLectures.forEach(l => {
  if (l && l.id && !l.isDeleted && !cloudDeletedSet.has(l.id)) {
    if (deletedIds.has(l.id)) {
      console.log('Deleting from deletedIds:', l.id);
      deletedIds.delete(l.id);
    }
  }
});

console.log('After anti-stale, has lec-s3-01?', deletedIds.has('lec-s3-01'));
