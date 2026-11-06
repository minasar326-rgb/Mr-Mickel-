import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const targetFile = path.resolve(__dirname, '../src/context/TeacherContext.jsx');

let code = fs.readFileSync(targetFile, 'utf8');

// 1. Add periodic manifest sync & visibilitychange in useEffect
const oldEffectStart = `    // 0. Instant Manifest Sync from Cloudflare R2 (Global CDN, ultra-fast and public for all student phones)
    fetchLecturesManifestFromR2().then(manifestLectures => {
      if (!isCancelled && Array.isArray(manifestLectures) && manifestLectures.length > 0) {
        setLectures(prev => mergeLectures(prev, sanitizeLectures(manifestLectures)));
      }
    }).catch(() => {});`;

const newEffectStart = `    // 0. Instant Manifest Sync from Cloudflare R2 / Server (Global CDN, ultra-fast and public for all student phones)
    const syncManifest = () => {
      fetchLecturesManifestFromR2().then(manifestLectures => {
        if (!isCancelled && Array.isArray(manifestLectures) && manifestLectures.length > 0) {
          setLectures(prev => mergeLectures(prev, sanitizeLectures(manifestLectures)));
        }
      }).catch(() => {});
    };
    syncManifest();

    // Poll every 15s so phones & student devices automatically catch new uploads
    const manifestInterval = setInterval(syncManifest, 15000);

    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible' && !isCancelled) {
        syncManifest();
      }
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }`;

code = code.replace(oldEffectStart, newEffectStart);

// 2. Add cleanup in return () => {
const oldCleanup = `    return () => {
      isCancelled = true;`;

const newCleanup = `    return () => {
      isCancelled = true;
      clearInterval(manifestInterval);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }`;

code = code.replace(oldCleanup, newCleanup);

// 3. Define refreshLecturesManifest before return
const fnDef = `  const refreshLecturesManifest = async () => {
    try {
      const manifestLectures = await fetchLecturesManifestFromR2();
      if (Array.isArray(manifestLectures) && manifestLectures.length > 0) {
        setLectures(prev => mergeLectures(prev, sanitizeLectures(manifestLectures)));
        return true;
      }
    } catch (_) {}
    return false;
  };

  const uploadNewLecture = async (lectureData) => {`;

code = code.replace(`  const uploadNewLecture = async (lectureData) => {`, fnDef);

// 4. Export refreshLecturesManifest in value object
code = code.replace(
  `uploadNewLecture,`,
  `refreshLecturesManifest,\n        uploadNewLecture,`
);

fs.writeFileSync(targetFile, code, 'utf8');
console.log('✅ TeacherContext.jsx patched successfully!');
