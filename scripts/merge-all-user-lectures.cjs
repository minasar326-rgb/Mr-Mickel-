const fs = require('fs');
const { execSync } = require('child_process');

const currentManifest = JSON.parse(fs.readFileSync('public/lectures-manifest.json', 'utf8'));

const raw05 = execSync('git show 056740b:public/lectures-manifest.json', { encoding: 'utf8' });
const json05 = JSON.parse(raw05);

const raw97 = execSync('git show 9758d64:public/lectures-manifest.json', { encoding: 'utf8' });
const json97 = JSON.parse(raw97);

const lectureMap = new Map();
// 1. baseline
(json05.lectures || []).forEach(l => lectureMap.set(l.id, l));
// 2. previous user uploads (خامسه ابتدائى)
(json97.lectures || []).forEach(l => lectureMap.set(l.id, l));
// 3. current active user upload (سادسه ابتدائى: اسمع مني)
(currentManifest.lectures || []).forEach(l => lectureMap.set(l.id, l));

const allLectures = Array.from(lectureMap.values());
const activeIds = new Set(allLectures.map(l => l.id));

let deletedIds = (currentManifest.deletedLectureIds || []).filter(id => !activeIds.has(id));

const fullPayload = {
  lectures: allLectures,
  stages: currentManifest.stages || json97.stages || [],
  sections: currentManifest.sections || json97.sections || [],
  deletedLectureIds: deletedIds,
  updatedAt: new Date().toISOString()
};

const jsonStr = JSON.stringify(fullPayload);
fs.writeFileSync('public/lectures-manifest.json', jsonStr, 'utf8');
fs.writeFileSync('lectures-manifest.json', jsonStr, 'utf8');

const jsContent = `(function() {
  var payload = ${jsonStr};
  window.__MS_LECTURES_MANIFEST__ = payload.lectures || payload;
  window.__MS_STAGES_MANIFEST__ = payload.stages || [];
  window.__MS_SECTIONS_MANIFEST__ = payload.sections || [];
  window.__MS_DELETED_LECTURES__ = payload.deletedLectureIds || [];
  window.__MS_PLATFORM_MANIFEST__ = payload;
  if (typeof window.__onLecturesManifest === 'function') {
    try { window.__onLecturesManifest(payload); } catch(e) {}
  }
  try {
    window.dispatchEvent(new CustomEvent('ms:platform-manifest-loaded', { detail: payload }));
  } catch(e) {}
})();`;

fs.writeFileSync('public/lectures-manifest.js', jsContent, 'utf8');
fs.writeFileSync('lectures-manifest.js', jsContent, 'utf8');

console.log('Total merged lectures successfully:', allLectures.length);
allLectures.forEach(l => console.log(' ->', l.id, ':', l.title, '(', l.stageName || l.stageId, ')'));
