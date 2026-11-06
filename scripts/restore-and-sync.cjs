const { execSync } = require('child_process');
const fs = require('fs');

const raw05 = execSync('git show 056740b:public/lectures-manifest.json', { encoding: 'utf8' });
const json05 = JSON.parse(raw05);

const raw97 = execSync('git show 9758d64:public/lectures-manifest.json', { encoding: 'utf8' });
const json97 = JSON.parse(raw97);

const lectureMap = new Map();
(json05.lectures || []).forEach(l => lectureMap.set(l.id, l));
(json97.lectures || []).forEach(l => lectureMap.set(l.id, l));

const restoredLectures = Array.from(lectureMap.values());
const activeIds = new Set(restoredLectures.map(l => l.id));

// Filter out active IDs from deletedLectureIds so they are never blocked
let deletedIds = (json97.deletedLectureIds || []).filter(id => !activeIds.has(id));

const fullPayload = {
  lectures: restoredLectures,
  stages: json97.stages || json05.stages || [],
  sections: json97.sections || json05.sections || [],
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

console.log('Successfully restored', restoredLectures.length, 'lectures and synced all manifest files!');
