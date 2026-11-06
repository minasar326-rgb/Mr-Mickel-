const fs = require('fs');
const path = require('path');

const r2Path = path.resolve(__dirname, '../src/services/r2Storage.js');
let code = fs.readFileSync(r2Path, 'utf8');

const target = `    const cleanLectures = lecturesList.filter(l => l && !l.isDeleted && !deletedLectureIds.includes(l.id));`;

const replacement = [
  '    // Filter incoming lectures that are explicitly marked deleted',
  '    const incomingClean = lecturesList.filter(l => l && !l.isDeleted && !deletedLectureIds.includes(l.id));',
  '',
  '    // Active incoming lectures must NEVER be in deletedLectureIds!',
  '    const activeIds = new Set(incomingClean.map(l => l.id).filter(Boolean));',
  '    deletedLectureIds = deletedLectureIds.filter(id => !activeIds.has(id));',
  '',
  '    // Smart Merge: Merge with previously known manifest so partial tab states never drop lectures',
  '    const existingList = (typeof window !== \'undefined\' && Array.isArray(window.__MS_LECTURES_MANIFEST__))',
  '      ? window.__MS_LECTURES_MANIFEST__',
  '      : [];',
  '    const lectureMap = new Map();',
  '    existingList.forEach(l => {',
  '      if (l && l.id && !deletedLectureIds.includes(l.id)) {',
  '        lectureMap.set(l.id, l);',
  '      }',
  '    });',
  '    incomingClean.forEach(l => {',
  '      if (l && l.id && !deletedLectureIds.includes(l.id)) {',
  '        const prev = lectureMap.get(l.id) || {};',
  '        lectureMap.set(l.id, { ...prev, ...l });',
  '      }',
  '    });',
  '    const cleanLectures = Array.from(lectureMap.values());'
].join('\r\n');

if (!code.includes('// Smart Merge: Merge with previously known manifest so partial tab states never drop lectures')) {
  if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync(r2Path, code, 'utf8');
    console.log('r2Storage.js updated with Smart Merge');
  } else {
    // try with \r\n
    const crlfTarget = target.replace(/\n/g, '\r\n');
    if (code.includes(crlfTarget)) {
      code = code.replace(crlfTarget, replacement);
      fs.writeFileSync(r2Path, code, 'utf8');
      console.log('r2Storage.js (CRLF) updated with Smart Merge');
    } else {
      console.warn('target not found in r2Storage.js');
    }
  }
} else {
  console.log('r2Storage.js already protected');
}
